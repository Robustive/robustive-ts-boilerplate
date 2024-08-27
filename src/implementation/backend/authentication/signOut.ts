import { R } from "@domain/usecases"
import { SignOutScenes } from "@domain/usecases/authentication/signOut"
import { Behavior } from "@shared/scenarioDelegate"
import { Context, Scenario } from "robustive-ts"

export function createBackendSignOutBehavior(
  _scenario: Scenario<SignOutScenes>
): Behavior<SignOutScenes> {
  // frontend からのリクエストを passport が処理するためユースケースを通らない
  return {
    [R.authentication.signOut.keys.basics.ユーザはサインアウトボタンを押下する]:
      (): Promise<Context<SignOutScenes>> => {
        throw new Error("not implemented")
      },
    [R.authentication.signOut.keys.basics
      .システムはサインインセッションを破棄する]: (): Promise<
      Context<SignOutScenes>
    > => {
      throw new Error("not implemented")
    }
  }
}
