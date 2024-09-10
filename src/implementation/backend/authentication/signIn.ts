import { BackendService } from "@backend/controllers"
import { R } from "@domain/usecases"
import { SignInScenes } from "@domain/usecases/authentication/signIn"
import { Behavior, Choreography } from "@shared/scenarioDelegate"
import { Context, IActor, NOCARE, Scenario } from "robustive-ts"

export function createBackendSignInChoreography(
  _service: BackendService
): Choreography<SignInScenes> {
  const behavior = <A extends IActor<NOCARE>>(
    _scenario: Scenario<SignInScenes>
  ): Behavior<A, SignInScenes> => {
    // frontend からのリクエストを passport が処理するためユースケースを通らない
    return {
      [R.authentication.signIn.keys.basics.ユーザはサインインボタンを押下する]: (
        _actor: A
      ): Promise<Context<SignInScenes>> => {
        throw new Error("not implemented")
      },
      [R.authentication.signIn.keys.basics.システムはGoogleOAuthを行う]: (
        _actor: A
      ): Promise<Context<SignInScenes>> => {
        throw new Error("not implemented")
      }
    }
  }
  return {
    behavior
  }
}
