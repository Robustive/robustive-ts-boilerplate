import { Actor } from "@domain/actors"
import { SignInStatus } from "@domain/models/authentication/user"
import { DomainKeys, R, Requirements, Usecase } from "@domain/usecases"
import { Nobody } from "@domain/actors/nobody"
import { AuthenticatedUser } from "@domain/actors/authenticatedUser"
import { DomainActionsMap, OneTime, State } from "../interfaces"
import { ApplicationState, useApplicationStore } from "./application"
import { InjectionKey, reactive } from "vue"
import { RouteLocationRaw } from "vue-router"
import { Subscription } from "rxjs"
import { Empty, Scenes, StringKeyof } from "robustive-ts"
import { AuthenticationState, useAuthenticationStore } from "./authentication"
import { SessionStoredError } from "@domain/errors"

export type Mutation<Z extends Scenes> = {
  [S in keyof Z["goals"]]: Z["goals"][S] extends Empty
    ? () => void
    : (associatedValues: Z["goals"][S]) => void
}

export interface SharedState extends State {
  readonly actor: Actor
  readonly routeLocation: RouteLocationRaw
  readonly signInStatus: SignInStatus
  readonly isLoading: boolean
  readonly sessionStoredError: OneTime<SessionStoredError>
}

type TypeOfStateItem<S extends State, K extends keyof S> = S[K] extends infer V
  ? V extends OneTime<infer OTV>
    ? OTV
    : V
  : never

export type FrontendService = {
  states: {
    shared: SharedState
    application: ApplicationState
    authentication: AuthenticationState
  }
  actions: {
    dispatch: <D extends DomainKeys, U extends StringKeyof<Requirements[D]>>(
      usecase: Usecase<D, U>,
      actor?: Actor
    ) => Promise<Subscription | void>
    set: <S extends State, K extends keyof S>(
      state: S,
      key: K,
      value: TypeOfStateItem<S, K>
    ) => void
    setOneTime: <S extends State, K extends keyof S>(
      state: S,
      key: K,
      value: TypeOfStateItem<S, K>
    ) => void
    routingTo: (path: string) => void
    change: (signInStatus: SignInStatus) => void
    startLoading: () => void
    stopLoading: () => void
  }
}

/**
 * The composable object that represents the service itself.
 * @param initialPath
 * @returns
 */
export function createFrontendService(initialPath: string): FrontendService {
  const shared = reactive<SharedState>({
    actor: new Nobody(),
    routeLocation: initialPath,
    signInStatus: SignInStatus.unknown(),
    isLoading: false,
    sessionStoredError: null
  }) as SharedState // reactiveで型が壊れるので、再度型を指定する

  const { state: application, actions: applicationActions } =
    useApplicationStore()

  const { state: authentication, actions: authenticationActions } =
    useAuthenticationStore()

  const domainActionsMap: DomainActionsMap = {
    [R.keys.application]: applicationActions,
    [R.keys.authentication]: authenticationActions
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

  const service: FrontendService = {
    states: {
      shared,
      application,
      authentication
    },
    actions: {
      dispatch: <D extends DomainKeys, U extends StringKeyof<Requirements[D]>>(
        usecase: Usecase<D, U>,
        actor?: Actor
      ): Promise<Subscription | void> => {
        const _actor = actor || shared.actor
        console.info(
          `[DISPATCH] ${usecase.domain}.${usecase.name}.${usecase.course}.${usecase.scene} (${usecase.id})`
        )

        if (
          usecase.domain === R.keys.application &&
          usecase.name === R.application.keys.boot
        ) {
          const action = domainActionsMap[usecase.domain][usecase.name]
          return action(usecase, _actor, service)
        }

        // 初回表示時対応
        // signInStatus が不明の場合、signInUserでないと実行できないUsecaseがエラーになるので、
        // ステータスが変わるのを監視し、その後実行し直す
        // if (shared.signInStatus.case === SignInStatus.unknown) {
        //   console.info(
        //     "[DISPATCH] signInStatus が 不明のため、ユースケースの実行を保留します..."
        //   );
        //   let stopHandle: WatchStopHandle | null = null;
        //   return new Promise<void>((resolve) => {
        //     stopHandle = watch(shared.signInStatus, (newValue) => {
        //       if (newValue.case !== SignInStatus.unknown) {
        //         console.log(
        //           `[DISPATCH] signInStatus が "${newValue.case as string}" に変わったため、保留したユースケースを再開します...`
        //         );
        //         resolve();
        //       }
        //     });
        //   }).then(() => {
        //     stopHandle?.();
        //     return service.actions.dispatch(usecase);
        //   });
        // }

        const action = domainActionsMap[usecase.domain][usecase.name]
        return action(usecase, _actor, service)
      },
      set,
      setOneTime,
      routingTo: (path: string) => {
        set(shared, "routeLocation", path)
      },
      change: (signInStatus: SignInStatus) => {
        const prevStatus = shared.signInStatus.case
        const prevActor = shared.actor
        const prevActorName = prevActor.constructor.name

        set(shared, "signInStatus", signInStatus)

        switch (signInStatus.case) {
          case SignInStatus.keys.signIn: {
            // _shared.actor = new AuthorizedUser(signInStatus.userProperties);
            break
          }
          case SignInStatus.keys.signingIn: {
            set(shared, "actor", new AuthenticatedUser(signInStatus.account))
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

  return service
}

export const SERVICE_KEY = Symbol(
  "FrontendService"
) as InjectionKey<FrontendService>
