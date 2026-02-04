import { Behavior, NoImplementationNeeded } from "@backend/scenarioDelegate"
import { SessionManager, SessionManagerType } from "@backend/sessionManagers"
import { JwtSessionManager, REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "@backend/sessionManagers/jwtSessionManager"
import { DataSource } from "@dependencies/postgres"
import { UserCommand } from "@dependencies/postgres/repositories/users/userCommand"
import { UserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { Actor } from "@domain/actors"
import { AuthenticationEnvelope, IdentityProviderType } from "@domain/models/authentication"
import { Account } from "@domain/models/authentication/user"
import { R } from "@domain/usecases"
import { SignInScenes } from "@domain/usecases/authentication/signIn"
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import { Request, Response } from "express"
import { Scenario } from "@robustive/robustive-ts"
import { ResponseContext, ResponseStatus } from "@robustive/robustive-ts-express"
import { ServiceError } from "@domain/errors"
import { Email, GoogleSub } from "@domain/models/authentication/type"

export function createBackendSignInChoreography<Context, Client>(
  dataSource: DataSource<Context, Client>,
  now: () => Date,
  jwtSessionManager: JwtSessionManager,
  userQuery: UserQuery,
  userCommand: UserCommand
): (req: Request, res: Response, actor: Actor, scenario: Scenario<SignInScenes>) => Behavior<SignInScenes> {
  const { basics: B, alternatives: A } = R.authentication.signIn.keys

  return (req: Request, res: Response, actor: Actor, scenario: Scenario<SignInScenes>) => {

    const issueRefreshToken = ({ account }: { account: Account }): Promise<ResponseContext<SignInScenes>> => {
      const refreshToken = jwtSessionManager.signRefreshToken(account, req.ip, now())

      /**
       * 現状、HttpOnly Cookie での保存を採用していて、サーバ側はステートレス。
       * refreshToken（あるいは Hash）を Redis に保存すると、強制ログアウト/失効や、端末毎のセッション管理（一覧表示、特定端末だけログアウト）がしやすくなる
       */
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS)
      return scenario.just(
        scenario.basics.システムはトップページへリダイレクトする()
      )
    }

    return {
      [B.ユーザはサインインボタンを押下する]: NoImplementationNeeded,
      [B.GoogleOAuthの場合_システムはGoogleOAuthを行う]: NoImplementationNeeded,
      [B.Googleからリダイレクトされた場合_システムはアプリセッションを開始する]: (): Promise<ResponseContext<SignInScenes>> => {
        if (SessionManager.shared.sessionManagerType === SessionManagerType.jwt) {
          return scenario.just(
            scenario.basics.トークンによるセッション管理の場合_システムはアカウントを取得する()
          )
        } else {
          return scenario.just(
            scenario.alternatives.セッションストアによるセッション管理の場合_システムはセッションを開始する()
          )
        }
      },
      [B.トークンによるセッション管理の場合_システムはアカウントを取得する]: (): Promise<ResponseContext<SignInScenes>> => {
        /**
         * IdentityProviderでの認証後のコールバック後に呼ばれる。
         * req.session.passport.user を見て、リフレッシュトークンを発行する。
         * req.session.appSession はまだない。
         */
        const envelope = req.session.passport.user
        if (!envelope) {
          throw new SystemError(SystemErrorCode.unreachable({ reason: "authenticationEnvelope は passport.serializeUser で req.session.passport.user に設定されている" }))
        }

        switch (envelope.provider) {
          case IdentityProviderType.Google: {
            const { sub, email } = envelope[IdentityProviderType.Google]
            return dataSource.begin()
              .then(() => {
                return userQuery.findByGoogleSub(GoogleSub.unsafeFrom(sub))
                  .then(account => {
                    if (account) {
                      return scenario.just(
                        scenario.basics.アカウントがある場合_システムはリフレッシュトークン発行する({ account })
                      )
                    } else {
                      return userQuery.findByEmail(Email.unsafeFrom(email))
                        .then(account => {
                          if (account) {
                            return scenario.just(
                              scenario.alternatives.アカウントがあるがGoogleOpenIdと紐づいていない場合_システムはアカウントとの紐づけを行う({ account, envelope })
                            )
                          } else {
                            return scenario.just(
                              scenario.alternatives.アカウントがない場合_システムはアカウントを発行する({ envelope })
                            )
                          }
                        })
                    }
                  })
              })
          }
        }
      },
      [B.アカウントがある場合_システムはリフレッシュトークン発行する]: issueRefreshToken,
      [A.セッションストアによるセッション管理の場合_システムはセッションを開始する]: (): Promise<ResponseContext<SignInScenes>> => {
        res.redirect("/")
        return scenario.respond(
          scenario.goals.システムはトップページを表示する(),
          ResponseStatus.responded()
        )
      },
      [A.アカウントがあるがGoogleOpenIdと紐づいていない場合_システムはアカウントとの紐づけを行う]: ({ account, envelope }: { account: Account, envelope: AuthenticationEnvelope }): Promise<ResponseContext<SignInScenes>> => {
        return userCommand.createUserGoogleOpenId(GoogleSub.unsafeFrom(envelope[IdentityProviderType.Google].sub), account.id)
          .then(() => {
            return dataSource.commit()
          })
          .then(() => {
            return scenario.just(
              scenario.alternatives.紐づけに成功した場合_システムはリフレッシュトークン発行する({ account })
            )
          })
        // TODO
        // .catch((error) => {
        //   return scenario.just(
        //     scenario.alternatives.紐づけに失敗した場合_システムはアカウントを発行する({ envelope })
        //   )
        // })
      },
      [A.紐づけに成功した場合_システムはリフレッシュトークン発行する]: issueRefreshToken,
      [A.アカウントがない場合_システムはアカウントを発行する]: ({ envelope }: { envelope: AuthenticationEnvelope }): Promise<ResponseContext<SignInScenes>> => {
        switch (envelope.provider) {
          case IdentityProviderType.Google: {
            const claims = envelope[IdentityProviderType.Google]
            const accountResult = Account.tryFromClaims(claims)
            
            if (accountResult.isErr()) {
              return scenario.just(
                scenario.goals.アカウントの発行に失敗した場合_システムはエラーを表示する({ error: new SystemError(SystemErrorCode.unknownError({ debuggingLead: "", cause: new ServiceError(accountResult.error) })) })
              )
            }
            return userCommand.createUserFromGoogleOpenId(GoogleSub.unsafeFrom(claims.sub), accountResult.value)
              .then(() => {
                return dataSource.commit()
                  .then(() => {
                    return scenario.just(
                      scenario.alternatives.アカウントの発行に成功した場合_システムはリフレッシュトークン発行する({ account: accountResult.value })
                    )
                  })
              })
          }
        }
      },
      [A.アカウントの発行に成功した場合_システムはリフレッシュトークン発行する]: issueRefreshToken,
      [B.システムはトップページへリダイレクトする]:
        (): Promise<ResponseContext<SignInScenes>> => {
          res.redirect("/")
          return scenario.respond(
            scenario.goals.システムはトップページを表示する(),
            ResponseStatus.responded()
          )
        }
    }
  }
}
