import "@robustive/robustive-ts-express"
import * as express from "express"
import type { ViteDevServer } from "vite"
import { readFile } from "node:fs/promises"
import { join } from "path"
import { config } from "@backend/config"

import * as session from "express-session"
import * as passport from "passport"

import { GoogleOpenIdIdentityProvider } from "./identityProviders/googleOpenIdIdentityProvider"
import { IdentityProvider } from "./interfaces"
import { errorHandler } from "./middlewares/errorHandler"
import { requestId } from "./middlewares/requestId"
import { Postgres } from "@dependencies/postgres"
import { robustiveHandler } from "./middlewares/robustiveHandler"
import { signInHandler } from "./middlewares/signInHandler"
import { AppSession, SessionManager } from "./sessionManagers"
import { ServiceError } from "@domain/errors"
import { AuthenticationEnvelope, IdentityProviderType } from "@domain/models/authentication"
import { UserActivityObserver } from "./observers/userActivityObserver"
import { PgUserCommand } from "@dependencies/postgres/repositories/users/userCommand"
import { EventBus } from "./eventBus"

/**
 * req.session の拡張
 */
declare module "express-session" {
  interface SessionData {
    authError?: ServiceError
    appSession: AppSession
    passport: {
      user?: AuthenticationEnvelope // passport-openidconnect がこの値を設定する
    }
  }
}

const identityProviders = Object.keys(config.SSO).reduce(
  (ret, key) => {
    switch (key) {
      case IdentityProviderType.Google: {
        if (config.SSO[key].isEnable) {
          return { ...ret, [IdentityProviderType.Google]: new GoogleOpenIdIdentityProvider() }
        }
        break
      }
      case IdentityProviderType.Github: {
        if (config.SSO[key].isEnable) {
          throw new Error("Not implemented")
        }
        break
      }
    }
    return ret
  },
  {} as Record<IdentityProviderType, IdentityProvider>
)

// ===== Observers ==============================

const userActivityObserver = new UserActivityObserver(EventBus.shared, new PgUserCommand())
userActivityObserver.register()

// ===== Express ===============================

// NOTE:
// - In production, we serve built assets from dist/frontend.
// - In local development, we mount Vite (middlewareMode) to enable HMR while keeping Express as the main server.
const isLocalDev = process.env.NODE_ENV !== "production"
const repoRoot = join(__dirname, "../../../")
const viteConfigFile = join(repoRoot, "packages/frontend/vite.config.ts")

let vite: ViteDevServer | null = null

// Frontend serving / HMR (dev only)
async function setupFrontendServing() {
  if (!isLocalDev) {
    // Production: serve built frontend
    app.use(express.static(join(__dirname, "../../../dist/frontend")))

    // SPA fallback to built index.html
    app.use((req, res, next) => {
      if (
        req.originalUrl.startsWith("/" + config.BACKEND_GLOBAL_PREFIX) ||
        req.originalUrl.startsWith("/auth")
      ) {
        return next()
      }
      res.sendFile(join(__dirname, "../../../dist/frontend/index.html"))
    })
    return
  }

  // Local development: mount Vite as middleware
  const { createServer: createViteServer } = await import("vite")

  vite = await createViteServer({
    root: repoRoot,
    configFile: viteConfigFile,
    server: {
      middlewareMode: true,
      // If you run this server on a different port or behind a proxy, you can tweak these.
      hmr: true
    },
    appType: "custom"
  })

  app.use(vite.middlewares)

  // SPA fallback: transform index.html via Vite so HMR client is injected.
  app.use(async (req, res, next) => {
    try {
      // Let API/auth routes pass through.
      if (
        req.originalUrl.startsWith("/" + config.BACKEND_GLOBAL_PREFIX) ||
        req.originalUrl.startsWith("/auth") ||
        req.originalUrl.startsWith("/api") ||
        req.originalUrl.startsWith("/.well-known")
      ) {
        return next()
      }

      const url = req.originalUrl
      const indexHtmlPath = join(repoRoot, "index.html")

      let html = await readFile(indexHtmlPath, "utf-8")
      html = await vite!.transformIndexHtml(url, html)

      res.status(200).setHeader("Content-Type", "text/html").end(html)
    } catch (e) {
      vite?.ssrFixStacktrace(e as Error)
      next(e)
    }
  })
}

const app = express()
app.get("/api/health", (_req, res) => res.json({ ok: true }))

app.use(express.json())
app.use(requestId())

// passport-openidconnect内部で SessionStore を使用するので、サービスのセッション管理方法に関わらず、express-sessionセットアップする
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: new session.MemoryStore()
  })
)

app.use(passport.initialize())
// passport.session() が req.session.passport.user を設定する
app.use(passport.session())

/**
 * ログイン成功時、OpenIDConnectStrategy の verifyコールバック後に呼ばれ、done()で返した値を
 * SessionStoreにセッション情報として保存する。また保存した値は req.session.passport.user で
 * 取得できるようになる。
 */
passport.serializeUser(
  (
    envelope: AuthenticationEnvelope,
    done: (err: Error, envelope: AuthenticationEnvelope) => void
  ) => {
    console.log("[Passport] serializeUser")
    process.nextTick(() => {
      return done(null, envelope) // this will set "req.session.passport.user"
    })
  }
)

/**
 * リクエスト毎に SessionStore に保存した値を受け取る。done()で返した値は
 * req.user で取得できるようになる。
 */
passport.deserializeUser(
  (
    envelope: AuthenticationEnvelope,
    done: (err: Error, envelope: AuthenticationEnvelope) => void
  ) => {
    console.log("[Passport] deserializeUser")
    process.nextTick(() => {
      return done(null, envelope) // this will set "req.user"
    })
  }
)

SessionManager.shared.setup(app)

// ===== Routes ==============================

Object.entries(identityProviders).forEach(([providerType, provider]: [IdentityProviderType, IdentityProvider]) => {
  passport.use(providerType, provider.strategy)

  app.get(
    config.SSO[providerType].authPath,
    passport.authenticate(providerType, provider.redirectAuthenticationOptions ?? { session: true })
  )

  // リダイレクトをハンドル
  app.get(
    config.SSO[providerType].callbackPath,
    passport.authenticate(
      providerType,
      provider.callbackAuthenticationOptions ?? { failureRedirect: "/" }
    ),
    SessionManager.shared.restoreAppSessionAndActor(),
    signInHandler(providerType, Postgres.shared)
  )
})

app.all(
  `/${config.BACKEND_GLOBAL_PREFIX}/domain/:domain/usecase/:usecase/course/:course/scene/:scene`,
  SessionManager.shared.csrfProtection(),
  SessionManager.shared.issueCsrfToken(),
  SessionManager.shared.restoreAppSessionAndActor(),
  robustiveHandler(Postgres.shared)
)

// ===== Error handling ======================
app.use(errorHandler())

Postgres.shared.isReady().then(async () => {
  await setupFrontendServing()
  app.listen(3001, () => console.log("Start listening on 3001..."))
})
