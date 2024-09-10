import { BackendService } from "@backend/controllers"
import { SessionStoredError } from "@domain/errors"
import { Account } from "@domain/models/authentication/user"
import { R } from "@domain/usecases"
import { BootScenes } from "@domain/usecases/application/boot"
import { Behavior, Choreography } from "@shared/scenarioDelegate"
import { Context, IActor, NOCARE, Scenario } from "robustive-ts"

export function createBackendBootChoreography(_service: BackendService): Choreography<BootScenes> {
  const behavior = <A extends IActor<NOCARE>>(
    scenario: Scenario<BootScenes>
  ): Behavior<A, BootScenes> => {
    return {
      [R.application.boot.keys.basics.ユーザはサイトを開く]: (_actor: A): Promise<Context<BootScenes>> => {
        throw new Error("not implemented")
      },
      [R.application.boot.keys.basics.システムはサインインセッションを確認する]: (_actor: A, {
        session
      }: {
        session: {
          passport: { user?: Account }
          hasError?: SessionStoredError
        } | null
      }): Promise<Context<BootScenes>> => {
        if (session && session.passport && session.passport.user) {
          return scenario.just(
            scenario.goals.サインインセッションがある場合_システムはホーム画面を表示する({
              account: session.passport.user
            })
          )
        } else if (session && session.hasError) {
          return scenario.just(
            scenario.goals.セッションにエラー情報がある場合_システムはホーム画面にエラー表示する({
              sessionStoredError: session.hasError
            })
          )
        } else {
          return scenario.just(
            scenario.goals.サインインセッションがない場合_システムはサインイン画面を表示する()
          )
        }
      }
    }
  }
  return {
    behavior
  }
}
