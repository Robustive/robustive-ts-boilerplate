import { Actor } from "@domain/actors"
import { R } from "@domain/usecases"
import { SignOutScenes } from "@domain/usecases/authentication/signOut"
import { Behavior } from "@backend/scenarioDelegate"
import { Request, Response } from "express"
import { Scenario } from "@robustive/robustive-ts"
import { ResponseContext } from "@robustive/robustive-ts-express"
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "@backend/sessionManagers/jwtSessionManager"
import { SessionManager, SessionManagerType } from "@backend/sessionManagers"

export function createBackendSignOutChoreography(
): (req: Request, res: Response, actor: Actor, scenario: Scenario<SignOutScenes>) => Behavior<SignOutScenes> {
  const { basics: B, alternatives: A } = R.authentication.signOut.keys
  return (req: Request, res: Response, actor: Actor, scenario: Scenario<SignOutScenes>) => ({
    [B.ユーザはサインアウトボタンを押下する]: (): Promise<ResponseContext<SignOutScenes>> => {
      if (SessionManager.shared.sessionManagerType === SessionManagerType.jwt) {
        return scenario.just(
          scenario.basics.トークンによるセッション管理の場合_システムはリフレッシュトークンを破棄する()
        )
      } else {
        return scenario.just(
          scenario.alternatives.セッションストアによるセッション管理の場合_システムはセッションを破棄する()
        )
      }
    },
    [B.トークンによるセッション管理の場合_システムはリフレッシュトークンを破棄する]: (): Promise<ResponseContext<SignOutScenes>> => {
      res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS)

      // We shouldn't necessarily redirect here if it's an API call, 
      // but the existing contract says 'redirect or send 200'.
      // The previous implementation used req.logout, which is passport specific for sessions.

      delete req.session.appSession

      return scenario.respond(
        scenario.goals.システムはホーム画面を表示する()
      )
    },
    [A.セッションストアによるセッション管理の場合_システムはセッションを破棄する]: (): Promise<ResponseContext<SignOutScenes>> => {
      req.logout((err) => {
        // if (err) {
        //   return next(err)
        // }
      })
      return scenario.respond(
        scenario.goals.システムはホーム画面を表示する()
      )
    }
  })
}
