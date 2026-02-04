import { Behavior } from "@backend/scenarioDelegate"
import { Actor } from "@domain/actors"
import { R } from "@domain/usecases"
import { BootScenes } from "@domain/usecases/application/boot"
import { NoImplementationNeeded } from "@backend/scenarioDelegate"
import { Request, Response } from "express"
import { Scenario } from "@robustive/robustive-ts"
import { ResponseContext, ResponseStatus } from "@robustive/robustive-ts-express"
import { isNobody } from "@domain/actors/nobody"
import { AppSession, SessionManagerType } from "@backend/sessionManagers"
import { JwtSessionManager, REFRESH_COOKIE_NAME, TokenVerfiedResult } from "@backend/sessionManagers/jwtSessionManager"
import { UserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import { AuthenticatedUser } from "@domain/actors/authenticatedUser"
import { UserActivityEvent } from "@backend/observers/userActivityObserver"
import { EventBus } from "@backend/eventBus"
import { Account } from "@domain/models/authentication/user"
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@shared/common"
import { AuthenticationErrorCode } from "@domain/errors/authentication"

export function createBackendBootChoreography(
  jwtSessionManager: JwtSessionManager,
  eventBus: EventBus,
  userQuery: UserQuery
): (req: Request, res: Response, actor: Actor, scenario: Scenario<BootScenes>) => Behavior<BootScenes> {
  const { basics: B, alternatives: A } = R.application.boot.keys

  return (req: Request, res: Response, actor: Actor, scenario: Scenario<BootScenes>) => {
    const verifyRefreshToken = (): Promise<ResponseContext<BootScenes>> => {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]

      if (!refreshToken) {
        return scenario.just(
          scenario.goals.リフレッシュトークンがないあるいは無効な場合_システムはサインイン画面を表示する()
        )
      }

      const result = jwtSessionManager.verifyRefreshToken(refreshToken)
      if (result.isErr()) {
        return scenario.just(
          scenario.goals.リフレッシュトークンがないあるいは無効な場合_システムはサインイン画面を表示する()
        )
      }
      const { id } = result.value
      // TODO: userチェック（バンされていないか）
      return userQuery.findById(id)
        .then(account => {
          if (!account) {
            // DBをクリアしたのなら、以下のコメントアウトを外してクッキーを消すこと
            // res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS)
            throw new SystemError(SystemErrorCode.unreachable({ reason: "リフレッシュトークンが発行されていてアカウントが登録されていないことはない" }))
          }
          return scenario.just(
            scenario.basics.リフレッシュトークンが有効な場合_システムはアクセストークンを発行する({ account })
          )
        })
    }

    return {
      [B.ユーザはサイトを開く]: NoImplementationNeeded,
      [B.システムはサインインセッションを確認する]: (): Promise<ResponseContext<BootScenes>> => {

        if (req.session.appSession.case === SessionManagerType.jwt) {
          return scenario.just(
            scenario.basics.トークンによるセッションの場合_システムはCSRFトークンを検証する({ isResubmission: false })
          )
        } else {
          if (isNobody(actor)) {
            return scenario.just(
              scenario.goals.セッションストアによるセッション管理でセッションがない場合_システムはサインイン画面を表示する()
            )
          }
          return scenario.just(
            scenario.goals.セッションストアによるセッション管理でセッションがある場合_システムはホーム画面を表示する({ account: actor.user })
          )
        }
      },
      [B.トークンによるセッションの場合_システムはCSRFトークンを検証する]: ({ isResubmission }: { isResubmission: boolean }): Promise<ResponseContext<BootScenes>> => {
        const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]
        const headerToken = req.header(CSRF_HEADER_NAME)

        try {
          jwtSessionManager.verifyDoubleSubmitCsrf(cookieToken, headerToken)
          return scenario.just(
            scenario.basics.CSRFトークンが有効な場合_システムはアクセストークンを確認する()
          )
        } catch (error) {
          if (isResubmission) {
            return scenario.respond(
              scenario.goals.セッションにエラー情報がある場合_システムはホーム画面にエラー表示する({ errorCode: AuthenticationErrorCode.doubleSubmitVerifyFailed({ title: "セッションエラー", body: "不正なアクセスです。" }) }),
              ResponseStatus.normal({ statusCode: 403 })
            )
          }
          return scenario.respond(
            scenario.alternatives.CSRFトークンが無効な場合_システムはCSRFトークンを要求する()
          )
        }
      },
      [B.CSRFトークンが有効な場合_システムはアクセストークンを確認する]: (): Promise<ResponseContext<BootScenes>> => {
        if (req.session.appSession.case !== SessionManagerType.jwt) {
          throw new SystemError(SystemErrorCode.unreachable({ reason: "CSRFトークンが有効な場合_システムはアクセストークンを確認するのシーンでは必ずJWTによるセッション管理" }))
        }

        const accessToken = req.session.appSession?.accessToken
        if (accessToken) {
          return scenario.just(
            scenario.alternatives.アクセストークンがある場合_システムはアクセストークンを検証する({ accessToken })
          )

        } else {
          return scenario.just(
            scenario.basics.アクセストークンがない場合_システムはリフレッシュトークンを検証する()
          )
        }
      },
      [B.アクセストークンがない場合_システムはリフレッシュトークンを検証する]: verifyRefreshToken,
      [B.リフレッシュトークンが有効な場合_システムはアクセストークンを発行する]: ({ account }: { account: Account }): Promise<ResponseContext<BootScenes>> => {
        // いきなりこのシーンを呼び出す攻撃に備え、ここでもCSRFトークンを検証する
        const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]
        const headerToken = req.header(CSRF_HEADER_NAME)

        try {
          jwtSessionManager.verifyDoubleSubmitCsrf(cookieToken, headerToken)
        } catch (_) {
          return scenario.respond(
            scenario.alternatives.CSRFトークンが無効な場合_システムはCSRFトークンを要求する()
          )
        }

        const accessToken = jwtSessionManager.signAccessToken(account.id)
        const appSession = AppSession.jwt({
          actor: new AuthenticatedUser(account),
          accessToken,
          tokenVerfiedResult: TokenVerfiedResult.refreshed
        })
        req.session.appSession = appSession
        eventBus.userActivity.emit(UserActivityEvent.signIn({ userId: account.id }))

        return scenario.just(
          scenario.goals.システムはホーム画面を表示する({ account, accessToken })
        )
      },
      [A.CSRFトークンが無効な場合_システムはCSRFトークンを要求する]: NoImplementationNeeded,
      [A.アクセストークンがある場合_システムはアクセストークンを検証する]: ({ accessToken }: { accessToken: string }): Promise<ResponseContext<BootScenes>> => {
        // restoreAppSessionAndActorを経ているので、基本正しい
        const result = jwtSessionManager.verifyAccessToken(accessToken)
        if (result.isErr()) {
          return scenario.just(
            scenario.alternatives.アクセストークンが無効の場合_システムはリフレッシュトークンを検証する()
          )
        } else {
          // ユーザのチェックなどは restoreAppSessionAndActor で行っているので省略
          return scenario.just(
            scenario.goals.アクセストークンが有効な場合_システムはホーム画面を表示する({ account: actor.user, accessToken })
          )
        }
      },
      [A.アクセストークンが無効の場合_システムはリフレッシュトークンを検証する]: verifyRefreshToken,

    }
  }
}
