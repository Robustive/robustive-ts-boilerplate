import { AuthenticatedUser } from "@domain/actors/authenticatedUser"
import { Nobody } from "@domain/actors/nobody"
import { SignInStatus } from "@domain/models/authentication/user"
import { State } from "@frontend/interfaces"
import { FrontendService, SharedState, TypeOfStateItem } from "@frontend/stores"

export function createMockFrontendService(): FrontendService {
  const shared: SharedState = {
    actor: new Nobody(),
    routeLocation: "/",
    signInStatus: SignInStatus.unknown(),
    isLoading: false,
    sessionStoredError: null
  } 
  const set = <S extends State, K extends keyof S>(
    state: S,
    key: K,
    value: TypeOfStateItem<S, K>
  ): void => {
    state[key] = value as S[K]
  }

  const setOneTime = <S extends State, K extends keyof S>(
    state: S,
    key: K,
    value: TypeOfStateItem<S, K>
  ): void => {
    state[key] = (() => {
      state[key] = null as unknown as S[K]
      return value
    }) as S[K]
  }
  
  return {
    states: {
      shared,
      application: {
        drawerItems: [],
        replyFromBackend: undefined
      },
      authentication: {
        signInStatus: SignInStatus.unknown(),
      }
    },
    helpers: {
      trigger: () => {
        throw new Error("Method not implemented.")
      },
      set,
      setOneTime,
      navigateTo: (path: string) => {
        set(shared, "routeLocation", path)
      },
      change: (signInStatus: SignInStatus) => {
        const prevStatus = shared.signInStatus.case
        const prevActor = shared.actor
        const prevActorName = prevActor.constructor.name

        set(shared, "signInStatus", signInStatus)

        switch (signInStatus.case) {
          case SignInStatus.keys.signIn: {
            set(shared, "actor", new AuthenticatedUser(signInStatus.account, signInStatus.accessToken))
            break
          }
          case SignInStatus.keys.signOut: {
            // if (isAuthorizedUser(prevActor)) {
            //   prevActor.unsubscribe();
            // }
            set(shared, "actor", new Nobody())
            break
          }
          case SignInStatus.keys.unknown: {
            set(shared, "actor", new Nobody())
            break
          }
        }

        console.info(
          `SignInStatus changed: ${prevStatus} ---> ${signInStatus.case}, actor changed: ${prevActorName} --->`,
          shared.actor
        )
      },
      startLoading: () => {
        set(shared, "isLoading", true)
      },
      stopLoading: () => {
        set(shared, "isLoading", false)
      }
    }
  }
}