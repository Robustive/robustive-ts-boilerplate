import { SessionStoredError } from "@domain/errors"
import { Account } from "@domain/models/authentication/user"
import { R } from "@domain/usecases"
import { BootScenes } from "@domain/usecases/application/boot"
import { Behavior } from "@shared/scenarioDelegate"
import { Context, Scenario } from "robustive-ts"

export function createBackendBootBehavior(scenario: Scenario<BootScenes>): Behavior<BootScenes> {
  return {
    [R.application.boot.keys.basics.ユーザはサイトを開く]: (): Promise<Context<BootScenes>> => {
      throw new Error("not implemented")
    },
    [R.application.boot.keys.basics.システムはサインインセッションを確認する]: ({
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
