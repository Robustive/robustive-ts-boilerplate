import { BackendService } from "@backend/controllers"
import { R } from "@domain/usecases"
import { SignOutScenes } from "@domain/usecases/authentication/signOut"
import { Behavior, Choreography } from "@shared/scenarioDelegate"
import { Context, IActor, NOCARE, Scenario } from "robustive-ts"

export function createBackendSignOutChoreography(
  _service: BackendService
): Choreography<SignOutScenes> {
  const { basics } = R.authentication.signOut.keys

  const behavior = <A extends IActor<NOCARE>>(
    _scenario: Scenario<SignOutScenes>
  ): Behavior<A, SignOutScenes> => {
    // frontend からのリクエストを passport が処理するためユースケースを通らない
    return {
      [basics.ユーザはサインアウトボタンを押下する]: (
        _actor: A
      ): Promise<Context<SignOutScenes>> => {
        throw new Error("not implemented")
      },
      [basics.システムはサインインセッションを破棄する]: (
        _actor: A
      ): Promise<Context<SignOutScenes>> => {
        throw new Error("not implemented")
      }
    }
  }

  return {
    behavior
  }
}
