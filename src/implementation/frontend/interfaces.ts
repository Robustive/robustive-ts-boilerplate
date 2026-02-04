import { Actor } from "@domain/actors"
import { DomainKeys, Requirements, Scenes } from "@domain/usecases"
import { InferScenes, InteractResult, StringKeyof } from "@robustive/robustive-ts"
import { Choreography } from "@frontend/scenarioDelegate"
import { FrontendService } from "./stores"
import { HandOverToBackend } from "./common"
import { Scenario } from "@robustive/robustive-ts"

export interface State { }

export type OneTime<T> = (() => T) | null

export type UsecaseResult<D extends DomainKeys, U extends StringKeyof<Requirements[D]>> = InteractResult<Requirements, D, U, Actor, InferScenes<Requirements, D, U>>

// /**
//  * backendと戻り値が違うので共通化していない
//  * backend では実行結果の Context をAPIのレスポンスとして返している
//  */
// export type Action<
//   D extends DomainKeys,
//   U extends StringKeyof<Requirements[D]>
// > = (
//   usecase: Usecase<D, U>,
//   actor: Actor,
//   service: FrontendService
// ) => Promise<UsecaseResult<D, U>>

// export type Actions<D extends DomainKeys> = {
//   [U in StringKeyof<Requirements[D]>]: Action<D, U>
// }

// export type DomainActionsMap = {
//   [D in DomainKeys]: Actions<D>
// }

export type Choreographies<D extends DomainKeys> = {
  [U in StringKeyof<Requirements[D]>]: (service: FrontendService, handOverToBackend: HandOverToBackend<Scenes<D, U>, Scenario<Scenes<D, U>>>) => Choreography<D, U, Scenes<D, U>>
}

export interface StoreComposable<T extends State, D extends DomainKeys> {
  readonly state: T
  choreographies: Choreographies<D>
}

export type DomainChoreographiesMap = {
  [D in DomainKeys]: Choreographies<D>
}