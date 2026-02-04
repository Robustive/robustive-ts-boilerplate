import { RequestHandler } from "express"
import { AppSession, SessionManagerStrategy } from "."
import { BaseAppSession } from "./index"
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import { AuthenticationEnvelope, IdentityProviderType } from "@domain/models/authentication"
import { UserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { Nobody } from "@domain/actors/nobody"
import { AuthenticatedUser } from "@domain/actors/authenticatedUser"
import { GoogleSub } from "@domain/models/authentication/type"

export type StoredAppSession = BaseAppSession

export class ExpressSessionManager implements SessionManagerStrategy {

  constructor(
    private userQuery: UserQuery
  ) { }

  /**
   * リクエスト毎にセッションを復元し、Actorをセットする。
   * express-session でセッションを管理するので、deserializeUser の結果（= req.user）を見て実施。
   */
  restoreAppSessionAndActor(): RequestHandler {
    return (req, res, next) => {
      if (!req.user) {
        const appSession = AppSession.stored({ actor: new Nobody() })
        req.session.appSession = appSession
        console.info("[SYSTEM] restoreAppSessionAndActor", { appSession })
        return next()
      }

      const envelope = req.user as AuthenticationEnvelope
      switch (envelope.provider) {
        case IdentityProviderType.Google: {
          const sub = envelope[IdentityProviderType.Google].sub
          return this.userQuery.findByGoogleSub(GoogleSub.unsafeFrom(sub))
            .then(account => {
              if (!account) {
                return next(new SystemError(SystemErrorCode.unreachable({ reason: "ExpressSessionManager の prepareAppSession まで来てアカウントが登録されていないことはない" })))
              }
              const appSession = AppSession.stored({ actor: new AuthenticatedUser(account) })
              req.session.appSession = appSession
              console.info("[SYSTEM] restoreAppSessionAndActor", { appSession })
              return next()
            })
        }
        default: {
          return next(new SystemError(SystemErrorCode.unreachable({ reason: `${envelope.provider} が実装されていない` })))
        }
      }
    }
  }

}