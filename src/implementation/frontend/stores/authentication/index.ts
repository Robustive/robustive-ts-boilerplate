import { R, Usecase } from "@domain/usecases"
import { Actor } from "@domain/actors"
import { State, StoreComposable } from "../../interfaces"
import { reactive } from "vue"
import { FrontendService } from ".."
import { SignInStatus } from "@domain/models/authentication/user"
import { createFrontendSignInChoreography } from "./signIn"
import { createFrontendSignOutChoreography } from "./signOut"
import { ScenarioDelegate } from "@shared/scenarioDelegate"

export interface AuthenticationState extends State {}

export interface AuthenticationStore
  extends StoreComposable<AuthenticationState, "authentication"> {}

export function useAuthenticationStore(): AuthenticationStore {
  const state = reactive<AuthenticationState>({
    signInStatus: SignInStatus.unknown()
  })

  return {
    state,
    actions: {
      [R.authentication.keys.signIn]: (
        usecase: Usecase<"authentication", "signIn">,
        actor: Actor,
        service: FrontendService
      ): Promise<void> => {
        usecase.set(
          new ScenarioDelegate(createFrontendSignInChoreography(service))
        )
        return usecase.interactedBy(actor).then((_) => {})
      },
      [R.authentication.keys.signOut]: (
        usecase: Usecase<"authentication", "signOut">,
        actor: Actor,
        service: FrontendService
      ): Promise<void> => {
        usecase.set(
          new ScenarioDelegate(createFrontendSignOutChoreography(service))
        )
        return usecase.interactedBy(actor).then((_) => {})
      }
    }
  }
}
