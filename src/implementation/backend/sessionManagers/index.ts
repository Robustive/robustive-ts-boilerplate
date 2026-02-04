import { Express, RequestHandler } from "express"
import { JwtAppSession, JwtSessionManager } from "./jwtSessionManager"
import { ExpressSessionManager, StoredAppSession } from "./expressSessionManager"
import { SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts"
import { config } from "@backend/config"
import { PgUserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { Actor } from "@domain/actors"

export type BaseAppSession = {
  actor: Actor
}

type AppSessionContext = {
  stored: StoredAppSession,
  jwt: JwtAppSession
}

export const AppSession = new SwiftEnum<AppSessionContext>()
export type AppSession = SwiftEnumCases<AppSessionContext>

export const SessionManagerType = {
  jwt: "jwt",
  memory: "memory"
} as const

export type SessionManagerType = typeof SessionManagerType[keyof typeof SessionManagerType]

export interface SessionManagerStrategy {
  setup?(app: Express): void
  /**
  * リクエスト毎にセッションを復元し、Actorをセットする
  */
  restoreAppSessionAndActor(): RequestHandler
}

export class SessionManager {
  static #singleton: SessionManager
  private _strategy: SessionManagerStrategy

  private constructor(private _sessionManagerType: SessionManagerType) {
    this._strategy = _sessionManagerType === SessionManagerType.jwt
      ? new JwtSessionManager(new PgUserQuery())
      : new ExpressSessionManager(new PgUserQuery())
  }

  static get shared() {
    return this.#singleton ??= new SessionManager(config.SESSION_MANAGER as SessionManagerType)
  }

  get sessionManagerType() {
    return this._sessionManagerType
  }

  setup(app: Express) {
    this._strategy.setup?.(app)
  }

  /**
   * リクエスト毎にセッションを復元し、Actorをセットする
   */
  restoreAppSessionAndActor(): RequestHandler {
    return this._strategy.restoreAppSessionAndActor()
  }

  /**
   * CSRFトークンを発行する
   */
  issueCsrfToken(): RequestHandler {
    if (this._sessionManagerType === SessionManagerType.jwt) {
      return (this._strategy as JwtSessionManager).issueCsrfToken()
    }
    return (req, res, next) => next()
  }

  csrfProtection(): RequestHandler {
    if (this._sessionManagerType === SessionManagerType.jwt) {
      return (this._strategy as JwtSessionManager).csrfProtection()
    }
    return (req, res, next) => next()
  }
}
