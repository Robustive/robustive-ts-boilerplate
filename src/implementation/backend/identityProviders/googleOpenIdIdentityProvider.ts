import { Request } from "express"
import { Strategy as OpenIDConnectStrategy, Profile } from "passport-openidconnect"
import { ServiceError } from "@domain/errors"
import { config } from "@backend/config"
import { AuthenticateOptions } from "passport"
import { CustomVerifyCallback, IdentityProvider } from "@backend/interfaces"
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import * as jwt from "jsonwebtoken"
import { IdentityProviderType } from "@domain/models/authentication"
import { AuthenticationErrorCode } from "@domain/errors/authentication"

type GoogleIdTokenClaims = {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

/**
 * 処理順序
 *  1. OpenIDConnectStrategy verify callback
 *  2. passport.serializeUser
 *  3. /auth/google/callback ===> signInHandler
 *  4. sessionManager.beginSession
 *  5. passport.deserializeUser
 *  6. sessionManager.restoreAppSessionAndActor
 */
export class GoogleOpenIdIdentityProvider implements IdentityProvider {

  get strategy(): OpenIDConnectStrategy {
    return new OpenIDConnectStrategy(
      {
        passReqToCallback: true,
        issuer: "https://accounts.google.com",
        authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenURL: "https://oauth2.googleapis.com/token",
        userInfoURL: "https://openidconnect.googleapis.com/v1/userinfo",
        clientID: process.env.GOOGLE_OAUTH_20_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_OAUTH_20_CLIENT_SECRET || "",
        callbackURL: "http://localhost:3001/auth/google/callback",
        scope: ["openid", "email", "profile"]
      },
      /** 
       * Google で認証が成功すると呼ばれる。Google OpenID の Sub でサービスのユーザ情報を取得してセッションを開始する。
       */
      (
        req: Request,
        _issuer: string,
        profile: Profile,
        _context: object,
        _idToken: object | string,
        _accessToken: string | object,
        _refreshToken: string,
        params: any,
        done: CustomVerifyCallback
      ) => {
        const clientIp = req.ip
        const { id: sub, displayName, emails, name } = profile
        if (!emails || !emails[0]) {
          return done(new SystemError(SystemErrorCode.unreachable({ reason: "Gogole OAuthでの認証では、メールアドレスは必ずある" })), null)
        }
        const email = emails[0].value
        const domain = email.split("@")[1]
        if (config.AUTHORIZED_DOMAIN && domain !== config.AUTHORIZED_DOMAIN) {
          const err = new ServiceError(AuthenticationErrorCode.domainNotAllowed({
            title: "認証エラー",
            body: `ドメイン "${domain}" でのサインインは許可されていません`,
            domain
          }))
          req.session.authError = err
          return done(err, null)
        }

        const photoUrl = (() => {
          const idToken = params?.id_token
          const claims = idToken ? jwt.decode(idToken) : undefined
          return claims ? (claims as GoogleIdTokenClaims).picture : undefined
        })()

        const authenticationEnvelope = {
          provider: IdentityProviderType.Google,
          clientIp,
          authenticatedAt: new Date(),
          [IdentityProviderType.Google]: {
            sub,
            displayName,
            name,
            email,
            photoUrl
          }
        }

        console.info("[SYSTEM] authenticate", authenticationEnvelope)
        done(null, authenticationEnvelope) // ここで返した値がセッションストアで保存され、req.session.passport.user で参照可能になる
      }
    )
  }
  /**
   * | prompt         | 説明
   * |----------------|-----------------------------------------
   * | none           | ユーザー操作なし。ログイン済みでなければエラー
   * | login          | 強制的に再ログインさせる
   * | consent        | 毎回同意画面を表示
   * | select_account | 必ずアカウント選択画面を表示
   */
  get redirectAuthenticationOptions(): AuthenticateOptions | null {
    return {
      session: true,
      // prompt: "none"
    }
  }

  get callbackAuthenticationOptions(): AuthenticateOptions | null {
    return { failureRedirect: "/" }
  }
}   