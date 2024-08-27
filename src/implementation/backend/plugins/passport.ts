import * as _passport from "passport"
import { Request } from "express"

import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20"
import { Account } from "@domain/models/authentication/user"
import { ExRequest } from "@backend/main"
import { SessionStoredError } from "@domain/errors"
import { config } from "@shared/config"

export class DomainNotAuthorizedError extends Error {
  private _domain: string
  constructor(domain: string) {
    super(`${domain} is not allowed.`)
    this._domain = domain
  }

  get domain(): string {
    return this._domain
  }
}

export function loadPassport(): _passport.PassportStatic {
  _passport.use(
    new Strategy(
      {
        passReqToCallback: true,
        clientID: process.env.GOOGLE_OAUTH_20_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_20_CLIENT_SECRET,
        callbackURL: "http://localhost:3001/auth/google/callback",
        scope: ["email", "profile"]
      },
      (
        req: Request,
        accessToken: string,
        refreshToken: string,
        /* params: GoogleCallbackParameters, */
        profile: Profile,
        done: VerifyCallback
      ) => {
        const { name, emails, photos } = profile
        const account: Account = {
          email: emails[0].value,
          firstName: name.givenName,
          lastName: name.familyName,
          photoUrl: photos[0].value,
          accessToken
        }
        const domain = account.email.split("@")[1]

        if (config.AUTHORIZED_DOMAIN && domain !== config.AUTHORIZED_DOMAIN) {
          ;(req as ExRequest).session.hasError =
            SessionStoredError.domainNotAllowed({
              title: "認証エラー",
              body: `ドメイン "${domain}" でのサインインは許可されていません`,
              domain
            })
          return done(new DomainNotAuthorizedError(domain), null)
        }

        done(null, account)
      }
    )
  )

  _passport.serializeUser(
    (user: Account, done: (err: Error, user: Account) => void) => {
      process.nextTick(() => {
        return done(null, user)
      })
    }
  )

  _passport.deserializeUser(
    (user: Account, done: (err: Error, user: Account) => void) => {
      process.nextTick(() => {
        return done(null, user)
      })
    }
  )

  return _passport
}
