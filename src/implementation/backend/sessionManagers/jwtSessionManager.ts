import { Express, CookieOptions, RequestHandler } from "express"
import * as jwt from "jsonwebtoken"
import * as cookieParser from "cookie-parser"
import { config } from "@backend/config"
import { Account } from "@domain/models/authentication/user"
import { AppSession, BaseAppSession, SessionManagerStrategy } from "."
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import { UserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { AuthenticatedUser } from "@domain/actors/authenticatedUser"
import { Nobody } from "@domain/actors/nobody"
import { randomBytes, timingSafeEqual } from "node:crypto"
import { ContextParams } from "@backend/middlewares/robustiveHandler"
import { R } from "@domain/usecases"
import { HttpMethod } from "@shared/interfaces"
import { CSRF_COOKIE_NAME } from "@shared/common"
import { UserId } from "@domain/models/authentication/type"
import { Result } from "@domain/functional-utils/result"

// 例: https://app.example.com からのみ許可
const ALLOWED_ORIGINS = new Set([
  // "https://app.example.com",
  "http://localhost:3001",
  // 必要なら管理画面や別ドメインを追加
])

type AccessTokenPayload = {
  id: UserId
  typ: "access"
}

type RefreshTokenPayload = {
  id: UserId
  ip: string
  at: Date
  typ: "refresh"
}

// Cookie settings（本番は secure:true + sameSite を構成に合わせる）
export const REFRESH_COOKIE_NAME = "refresh_token"
export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: `/${config.BACKEND_GLOBAL_PREFIX}/domain/application/usecase/boot/`, // refresh を使う場所を限定すると被害面積が減る
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30d
}

export const CSRF_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: false, // JSで読んでヘッダに載せるため
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/", // client側では "/" でないと取得できない
  maxAge: 24 * 60 * 60 * 1000, // 1d
}

const regexUsecaseApi = new RegExp(`^\/${config.BACKEND_GLOBAL_PREFIX}\/domain\/([^/]+)\/usecase\/([^/]+)\/course\/([^/]+)\/scene\/([^/]+)$`)
const regexBearer = /^Bearer (.+)$/

export const TokenVerfiedResult = {
  hasValidAccessToken: "hasValidAccessToken",
  accessTokenExpired: "accessTokenExpired",
  refreshed: "refreshed",
  refreshTokenExpired: "refreshTokenExpired",
  hasNoToken: "hasNoToken",
} as const

export type TokenVerfiedResult = typeof TokenVerfiedResult[keyof typeof TokenVerfiedResult]

export type JwtAppSession = BaseAppSession & { accessToken?: string; tokenVerfiedResult: TokenVerfiedResult }

export class JwtSessionManager implements SessionManagerStrategy {

  constructor(
    private userQuery: UserQuery
  ) { }

  private generateCsrfToken(): string {
    return randomBytes(32).toString("base64url");
  }

  setup(app: Express): void {
    app.use(cookieParser())
  }

  verifyAccessToken(token: string): Result<AccessTokenPayload, SystemError> {
    try {
      const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload
      if (!payload.id) return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "payload.id is undefined"})))
      if (payload.typ === undefined || payload.typ !== "access") return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "payload.typ is undefined or not access token"})))
      return Result.Ok(payload)
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "access token expired", cause: e})))
      } else if (e instanceof jwt.NotBeforeError) {
        return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "access token not before", cause: e})))
      } else if (e instanceof jwt.JsonWebTokenError) {
        return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "access token decode failed", cause: e})))
      }
    }
  }

  verifyRefreshToken(token: string): Result<RefreshTokenPayload, SystemError> {
    try {
      const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshTokenPayload
      if (!payload.id) return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "payload.id is undefined"})))
      if (payload.typ === undefined || payload.typ !== "refresh") return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "payload.typ is undefined or not refresh token"})))
      return Result.Ok(payload)
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "refresh token expired", cause: e})))
      } else if (e instanceof jwt.NotBeforeError) {
        return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "refresh token not before", cause: e})))
      } else if (e instanceof jwt.JsonWebTokenError) {
        return Result.Err(new SystemError(SystemErrorCode.unknownError({debuggingLead: "refresh token decode failed", cause: e})))
      }
    }
  }

  verifyDoubleSubmitCsrf(cookieToken: string, headerToken: string) {
    if (!cookieToken || !headerToken) {
      throw new Error("Missing CSRF token")
    }

    const enc = new TextEncoder()
    // タイミング差攻撃を避けるために一定時間比較（地味に大事）
    const a = enc.encode(cookieToken)
    const b = enc.encode(headerToken)

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Invalid CSRF token")
    }
  }

  signAccessToken(id: UserId): string {
    const payload: AccessTokenPayload = {
      id,
      typ: "access"
    }

    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      // algorithm: "HS256",
      expiresIn: config.ACCESS_TOKEN_EXPIRES_IN,
      // issuer: config.JWT_ISSUER,
      // audience: config.JWT_AUDIENCE
    })
  }

  signRefreshToken(user: Account, clientIp: string, authenticatedAt: Date): string {
    const payload: RefreshTokenPayload = {
      id: user.id,
      ip: clientIp,
      at: authenticatedAt,
      typ: "refresh"
    }

    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      // algorithm: "HS256",
      expiresIn: config.REFRESH_TOKEN_EXPIRES_IN,
      // issuer: config.JWT_ISSUER,
      // audience: config.JWT_AUDIENCE
    })
  }

  /**
   * リクエスト毎にセッションを復元し、Actorをセットする。
   * トークンでサービスセッションを管理するので、deserializeUser の結果（= req.user）を見てはいけない
   */
  restoreAppSessionAndActor(): RequestHandler {
    return (req, res, next) => {
      let tokenVerfiedResult: TokenVerfiedResult = TokenVerfiedResult.hasNoToken
      const accessTokenExists = req.header("authorization")?.match(regexBearer)

      // ユースケース毎に実行前にアクセストークンの検証およびアクターのセットをする
      // でないとユースケースのauthorizationチェックができない
      if (accessTokenExists) {
        /* accessTokenがある場合、アクセストークンを検証してユーザを取得 */
        const [_, token] = accessTokenExists

        const result = this.verifyAccessToken(token)
        if (result.isErr()) {
          console.error("[SYSTEM] restoreAppSessionAndActor", { tokenVerfiedResult })
          return next(result.error)
        }

        const { id } = result.value
        // TODO: userチェック（バンされていないか）
        return this.userQuery.findById(id)
          .then(account => {
            if (!account) {
              return next(new SystemError(SystemErrorCode.unreachable({ reason: "アクセストークンが付与されていてアカウントが登録されていないことはない" })))
            }
            const accessToken = this.signAccessToken(id)
            const appSession = AppSession.jwt({
              actor: new AuthenticatedUser(account),
              accessToken,
              tokenVerfiedResult: TokenVerfiedResult.hasValidAccessToken
            })
            req.session.appSession = appSession
            console.info("[SYSTEM] restoreAppSessionAndActor", { appSession })
            return next()
          })
      }

      /* accessToken がないあるいは期限切れの場合、ゲスト扱い（ここれは refreshToken は見ない。Bootで見ている） */
      const appSession = AppSession.jwt({ actor: new Nobody(), tokenVerfiedResult })
      req.session.appSession = appSession
      console.info("[SYSTEM] restoreAppSessionAndActor", { appSession })
      return next()
    }
  }

  issueCsrfToken(): RequestHandler {
    return (req, res, next) => {
      const { domain, usecase } = req.params as Partial<ContextParams>

      // 発行するのは boot ユースケースのみ
      if (domain !== R.keys.application || usecase !== R.application.keys.boot) {
        return next()
      }
      // 既にあるなら再発行しない（任意）
      const existing = req.cookies?.[CSRF_COOKIE_NAME]
      const token = existing || this.generateCsrfToken()

      res.cookie(CSRF_COOKIE_NAME, token, CSRF_COOKIE_OPTIONS)
      return next()
    }
  }

  csrfProtection(): RequestHandler {
    return (req, res, next) => {
      const { domain, usecase } = req.params as Partial<ContextParams>

      // check対象は boot ユースケースのみ
      if (domain !== R.keys.application || usecase !== R.application.keys.boot) {
        return next()
      }

      /**
       * 1. HttpMethod が POST でない場合はNG
       */
      if (req.method !== HttpMethod.POST_TO_REJECT_REQUESTS_WITHOUT_USER_INTERACTION_AS_PART_OF_CSRF_PROTECTION) {
        return res.status(405).json({
          error: "Method Not Allowed",
          reason: "Invalid Method",
        })
      }

      const origin = req.headers.origin
      const referer = req.headers.referer

      /**
       * 2. Origin ヘッダがある場合（fetch / XHR / modern browser）、ALLOWED_ORIGINS であること
       */
      if (origin && ALLOWED_ORIGINS.size > 0) {
        if (!ALLOWED_ORIGINS.has(origin)) {
          return res.status(403).json({
            error: "Forbidden",
            reason: "Invalid Origin",
          })
        }
        return next()
      }

      /**
       * 3. Origin が無い場合（古いUA）は Referer を見る（フォールバック）
       *    ※ Referer も無い場合は「疑わしい」として拒否する
       */
      if (referer) {
        try {
          const refererOrigin = new URL(referer).origin
          if (!ALLOWED_ORIGINS.has(refererOrigin)) {
            return res.status(403).json({
              error: "Forbidden",
              reason: "Invalid Referer",
            })
          }
          return next()
        } catch {
          return res.status(403).json({
            error: "Forbidden",
            reason: "Malformed Referer",
          })
        }
      }

      /**
       * 4. Origin も Referer も無い
       *    → CSRF の可能性があるので拒否
       */
      return res.status(403).json({
        error: "Forbidden",
        reason: "Missing Origin/Referer",
      })
    }
  }
}
