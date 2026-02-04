import { R } from "@domain/usecases"
import { State, StoreComposable } from "../../interfaces"
import { reactive } from "vue"
import { SignInStatus } from "@domain/models/authentication/user"
import { createFrontendSignInChoreography } from "./signIn"
import { createFrontendSignOutChoreography } from "./signOut"

export interface AuthenticationState extends State {
  // readonly signInStatus: SignInStatus | null
  // readonly idInvalidMessage: string | string[] | undefined
  // readonly passwordInvalidMessage: string | string[] | undefined
  // readonly signInFailureMessage: string | undefined
  // readonly isPresentAdministratorRegistrationDialog: boolean
  // readonly domain: string | null
  // readonly account: Account | null
}

export interface AuthenticationStore
  extends StoreComposable<AuthenticationState, "authentication"> {}

export function useAuthenticationStore(): AuthenticationStore {
  const state = reactive<AuthenticationState>({
    signInStatus: SignInStatus.unknown()
  })

  return {
    state,
    choreographies: {
      [R.authentication.keys.signIn]: createFrontendSignInChoreography,
      [R.authentication.keys.signOut]: createFrontendSignOutChoreography
    }
  }
}
