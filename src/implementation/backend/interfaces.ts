import { Actor } from "@domain/actors"
import {
  DomainKeys,
  Requirements,
  Usecase,
  UsecaseKeys
} from "@domain/usecases"
import {
  Context,
  Courses,
  InferScenesInScenario,
  StringKeyof
} from "robustive-ts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariousPatterns = any

export type HandOverContext = {
  domain: DomainKeys
  usecase: UsecaseKeys
  course: Courses
  scene: string
}

/**
 * backendと戻り値が違うので共通化していない
 * backend では実行結果の Context をAPIのレスポンスとして返している
 */
export type Action<
  D extends DomainKeys,
  U extends StringKeyof<Requirements[D]>
> = (
  usecase: Usecase<D, U>,
  actor: Actor
) => Promise<Context<InferScenesInScenario<Usecase<D, U>>>>

export type Actions<D extends DomainKeys> = {
  [U in StringKeyof<Requirements[D]>]: Action<D, U>
}

export type DomainActionsMap = {
  [D in DomainKeys]: Actions<D>
}
