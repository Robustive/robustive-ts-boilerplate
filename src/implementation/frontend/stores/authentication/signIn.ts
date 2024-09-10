import { R } from "@domain/usecases"
import { Context, Scenario } from "robustive-ts"
import { FrontendService, Mutation } from ".."
import { SignInScenes } from "@domain/usecases/authentication/signIn"
import { Behavior, Choreography } from "@shared/scenarioDelegate"

export function createFrontendSignInChoreography(
  _service: FrontendService
): Choreography<SignInScenes> {
  const { basics, goals } = R.authentication.signIn.keys

  const behavior = (scenario: Scenario<SignInScenes>): Behavior<SignInScenes> => {
    return {
      [basics.ユーザはサインインボタンを押下する]: (): Promise<Context<SignInScenes>> => {
        return scenario.just(scenario.basics.システムはGoogleOAuthを行う())
      },
      [basics.システムはGoogleOAuthを行う]: (): Promise<Context<SignInScenes>> => {
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
