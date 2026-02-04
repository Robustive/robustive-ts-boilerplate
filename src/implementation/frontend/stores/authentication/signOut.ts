import { R } from "@domain/usecases"
import { Context, Scenario } from "@robustive/robustive-ts"
import { FrontendService, Mutation } from ".."
import { SignOutScenes } from "@domain/usecases/authentication/signOut"
import { SignInStatus } from "@domain/models/authentication/user"
import { Behavior, Choreography } from "@frontend/scenarioDelegate"
import { Actor } from "@domain/actors"
import { handOverToBackend } from "@frontend/common"
import { NoImplementationNeeded } from "@shared/common"
import { HttpMethod } from "@shared/interfaces"
import { Views } from "@presentation/index"

export function createFrontendSignOutChoreography(
  service: FrontendService
): Choreography<"authentication", "signOut", SignOutScenes> {
  const { basics: B, alternatives: A, goals: G } = R.authentication.signOut.keys

  const behavior = (actor: Actor, scenario: Scenario<SignOutScenes>): Behavior<SignOutScenes> => {
    return {
      [B.ユーザはサインアウトボタンを押下する]: (): Promise<Context<SignOutScenes>> => {
        return handOverToBackend(
          actor,
          scenario.basics.ユーザはサインアウトボタンを押下する(),
          scenario,
          { method: HttpMethod.POST }
        )
      },
      [B.トークンによるセッション管理の場合_システムはリフレッシュトークンを破棄する]: NoImplementationNeeded,
      [A.セッションストアによるセッション管理の場合_システムはセッションを破棄する]: NoImplementationNeeded
    }
  }

  const mutation: Mutation<SignOutScenes> = {
    [G.システムはホーム画面を表示する]: () => {
      service.helpers.change(SignInStatus.signOut())
      service.helpers.navigateTo(Views.Main.path)
    }
  }
  return {
    behavior,
    mutation
  }
}
