import * as express from "express"
import * as core from "express-serve-static-core"
import { Request, Response, NextFunction } from "express"
import * as session from "express-session"

import { DomainNotAuthorizedError, loadPassport } from "./plugins/passport"
import { createBackendService } from "./controllers"
import { join } from "path"
import { SessionStoredError } from "@domain/errors"
import { config } from "@shared/config"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any

export type ExRequest<
  P = core.ParamsDictionary,
  ResBody = ANY,
  ReqBody = ANY,
  ReqQuery = core.Query,
  Locals extends Record<string, ANY> = Record<string, ANY>
> = Request<P, ResBody, ReqBody, ReqQuery, Locals> & {
  session: { hasError: SessionStoredError }
}

const app = express()
app.use(express.static(join(__dirname, "../../../dist/frontend")))
const passport = loadPassport()

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // HTTPSを使用する場合はtrueに設定
      maxAge: 1000 * 60 * 60 * 24 * 7 // クッキーの有効期限（ここでは一週間）
    }
  }),
  passport.initialize(),
  passport.session()
)

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/" + config.BACKEND_GLOBAL_PREFIX)) {
    return next()
  }
  if (req.originalUrl.startsWith("/auth")) {
    return next()
  }
  res.sendFile(join(__dirname, "../../../dist/frontend/index.html"))
})

app.get(
  "/auth/google",
  passport.authenticate("google", {
    prompt: "select_account",
    session: true
  })
)

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/"
  }),
  (_req, res) => {
    // frontend で boot を呼ばせ、そこでセッションからユーザ情報を取得する
    res.redirect("/")
  }
)

// using POST requests instead of GET requests in order to prevent accidental or malicious logouts.
app.post("/auth/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    // xhrではredirectできない
    res.sendStatus(200)
  })
})

createBackendService(app)

// Error handling
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof DomainNotAuthorizedError) {
      return res.redirect("/")
    }

    console.error(err)

    // Unhandled
    res.status(500).json({ error: err.message })
  }
)

app.listen(3001, () => console.log("Start listening on 3001..."))
