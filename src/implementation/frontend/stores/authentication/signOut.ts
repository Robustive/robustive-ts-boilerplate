import { R } from "@domain/usecases"
import { Context, Scenario } from "robustive-ts"
import { FrontendService, Mutation } from ".."
import { SignOutScenes } from "@domain/usecases/authentication/signOut"
import axios from "axios"
import { SignInStatus } from "@domain/models/authentication/user"
import { Behavior, Choreography } from "@shared/scenarioDelegate"

export function createFrontendSignOutChoreography(
  service: FrontendService
): Choreography<SignOutScenes> {
  const { basics, goals } = R.authentication.signOut.keys

  const behavior = (
    scenario: Scenario<SignOutScenes>
  ): Behavior<SignOutScenes> => {
    return {
      [basics.ユーザはサインアウトボタンを押下する]: (): Promise<
        Context<SignOutScenes>
      > => {
        return scenario.just(
          scenario.basics.システムはサインインセッションを破棄する()
        )
      },
      [basics.システムはサインインセッションを破棄する]: (): Promise<
        Context<SignOutScenes>
      > => {
        return axios
          .post("/auth/signout")
          .then(() =>
            scenario.just(scenario.goals.システムはホーム画面を表示する())
          )
      }
    }
  }

  const mutation: Mutation<SignOutScenes> = {
    [goals.システムはホーム画面を表示する]: () => {
      console.log("サインアウトしました")
      service.actions.change(SignInStatus.signOut())
    }
  }
  return {
    behavior,
    mutation
  }
}
