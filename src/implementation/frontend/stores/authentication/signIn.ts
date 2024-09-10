import { R } from "@domain/usecases"
import { Context, IActor, NOCARE, Scenario } from "robustive-ts"
import { FrontendService, Mutation } from ".."
import { SignInScenes } from "@domain/usecases/authentication/signIn"
import { Behavior, Choreography } from "@shared/scenarioDelegate"

export function createFrontendSignInChoreography(
  _service: FrontendService
): Choreography<SignInScenes> {
  const { basics, goals } = R.authentication.signIn.keys

  const behavior = <A extends IActor<NOCARE>>(scenario: Scenario<SignInScenes>): Behavior<A, SignInScenes> => {
    return {
      [basics.ユーザはサインインボタンを押下する]: (_actor: A): Promise<Context<SignInScenes>> => {
        return scenario.just(scenario.basics.システムはGoogleOAuthを行う())
      },
      [basics.システムはGoogleOAuthを行う]: (_actor: A): Promise<Context<SignInScenes>> => {
        window.location.href = "/auth/google"
        return scenario.just(scenario.goals.GoogleOAuthでリダイレクトするためここには到達しない())
      }
    }
  }

  const mutation: Mutation<SignInScenes> = {
    [goals.GoogleOAuthでリダイレクトするためここには到達しない]: () => {
      console.log("★ GoogleOAuthでリダイレクトするためここには到達しない")
    }
  }

  return {
    behavior,
    mutation
  }
}
