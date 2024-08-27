import { Actor } from "@domain/actors"
import { DomainKeys, Requirements, Usecase } from "@domain/usecases"
import { StringKeyof } from "robustive-ts"
import { FrontendService } from "./stores"

export interface State {}

export type OneTime<T> = (() => T) | null

/**
 * backendと戻り値が違うので共通化していない
 * backend では実行結果の Context をAPIのレスポンスとして返しているが、
 * frontend では dispatch の呼び出し元に Context を返したくない（値の更新は store で行う）
 * ので Promise<void> としている
 */
export type Action<
  D extends DomainKeys,
  U extends StringKeyof<Requirements[D]>
> = (
  usecase: Usecase<D, U>,
  actor: Actor,
  service: FrontendService
) => Promise<void>

export type Actions<D extends DomainKeys> = {
  [U in StringKeyof<Requirements[D]>]: Action<D, U>
}

export type DomainActionsMap = {
  [D in DomainKeys]: Actions<D>
}

export interface StoreComposable<T extends State, D extends DomainKeys> {
  readonly state: T
  actions: Actions<D>
}
