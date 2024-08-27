import { R } from "@domain/usecases"
import { SignInScenes } from "@domain/usecases/authentication/signIn"
import { Behavior } from "@shared/scenarioDelegate"
import { Context, Scenario } from "robustive-ts"

export function createBackendSignInBehavior(
  _scenario: Scenario<SignInScenes>
): Behavior<SignInScenes> {
  // frontend からのリクエストを passport が処理するためユースケースを通らない
  return {
    [R.authentication.signIn.keys.basics.ユーザはサインインボタンを押下する]:
      (): Promise<Context<SignInScenes>> => {
        throw new Error("not implemented")
      },
    [R.authentication.signIn.keys.basics.システムはGoogleOAuthを行う]:
      (): Promise<Context<SignInScenes>> => {
        throw new Error("not implemented")
      }
  }
}
