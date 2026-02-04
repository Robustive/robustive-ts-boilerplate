import { Actor } from "@domain/actors"
import { SignInStatus } from "@domain/models/authentication/user"
import { DomainKeys, R, Requirements, Usecase } from "@domain/usecases"
import { Nobody } from "@domain/actors/nobody"
import { AuthenticatedUser } from "@domain/actors/authenticatedUser"
import { Choreographies, DomainChoreographiesMap, OneTime, State, UsecaseResult } from "../interfaces"
import { ApplicationState, useApplicationStore } from "./application"
import { InjectionKey, reactive } from "vue"
import { RouteLocationRaw } from "vue-router"
import { Empty, Scenes, StringKeyof } from "@robustive/robustive-ts"
import { AuthenticationState, useAuthenticationStore } from "./authentication"
import { ScenarioDelegate } from "@frontend/scenarioDelegate"
import { ServiceErrorCode } from "@domain/errors"
import { handOverToBackend } from "@frontend/common"

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
  readonly sessionStoredError: OneTime<ServiceErrorCode>
}

export type TypeOfStateItem<S extends State, K extends keyof S> = S[K] extends infer V
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
  helpers: {
    trigger: <D extends DomainKeys, U extends StringKeyof<Requirements[D]>>(
      usecase: Usecase<D, U>,
      actor?: Actor
    ) => Promise<UsecaseResult<D, U>>
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
    navigateTo: (path: string) => void
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

  const { state: application, choreographies: applicationChoreographies } =
    useApplicationStore()

  const { state: authentication, choreographies: authenticationChoreographies } =
    useAuthenticationStore()

  const domainChoreographiesMap: DomainChoreographiesMap = {
    [R.keys.application]: applicationChoreographies,
    [R.keys.authentication]: authenticationChoreographies
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
    helpers: {
      trigger: <D extends DomainKeys, U extends StringKeyof<Requirements[D]>>(
        usecase: Usecase<D, U>,
        actor?: Actor
      ): Promise<UsecaseResult<D, U>> => {
        const _actor = actor || shared.actor
        console.info(
          `[TRIGGER] ${usecase.domain}.${usecase.name}.${usecase.course}.${usecase.scene} (${usecase.id})`
        )

        if (
          usecase.domain === R.keys.application &&
          usecase.name === R.application.keys.boot
        ) {
          const choreographies = domainChoreographiesMap[usecase.domain] as Choreographies<D>
          usecase.set(new ScenarioDelegate(choreographies[usecase.name](service, handOverToBackend)))
          return usecase.interactedBy(_actor)
        }

        // 初回表示時対応
        // signInStatus が不明の場合、signInUserでないと実行できないUsecaseがエラーになるので、
        // ステータスが変わるのを監視し、その後実行し直す
        // if (shared.signInStatus.case === SignInStatus.unknown) {
        //   console.info(
        //     "[TRIGGER] signInStatus が 不明のため、ユースケースの実行を保留します..."
        //   );
        //   let stopHandle: WatchStopHandle | null = null;
        //   return new Promise<void>((resolve) => {
        //     stopHandle = watch(shared.signInStatus, (newValue) => {
        //       if (newValue.case !== SignInStatus.unknown) {
        //         console.log(
        //           `[TRIGGER] signInStatus が "${newValue.case as string}" に変わったため、保留したユースケースを再開します...`
        //         );
        //         resolve();
        //       }
        //     });
        //   }).then(() => {
        //     stopHandle?.();
        //     return service.helpers.trigger(usecase);
        //   });
        // }

        const choreographies = domainChoreographiesMap[usecase.domain] as Choreographies<D>
        usecase.set(new ScenarioDelegate(choreographies[usecase.name](service, handOverToBackend)))
        return usecase.interactedBy(_actor)
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

  return service
}

export const SERVICE_KEY = Symbol(
  "FrontendService"
) as InjectionKey<FrontendService>
