import { Actor } from "@domain/actors"
import { DomainKeys, Requirements, Scenes as ScenesInScenario } from "@domain/usecases"
import {
  AbstractActor,
  Context,
  DomainRequirements,
  Empty,
  IActor,
  InteractResult,
  InteractResultType,
  IScenarioDelegate,
  NOCARE,
  Scenario,
  Scenes,
  StringKeyof
} from "@robustive/robustive-ts"

export type Behavior<Z extends Scenes> = Z["alternatives"] extends Empty
  ? {
    [S in keyof Z["basics"]]: Z["basics"][S] extends Empty
    ? () => Promise<Context<Z>>
    : (associatedValues: Z["basics"][S]) => Promise<Context<Z>>
  }
  : {
    [S in keyof Z["basics"]]: Z["basics"][S] extends Empty
    ? () => Promise<Context<Z>>
    : (associatedValues: Z["basics"][S]) => Promise<Context<Z>>
  } & {
    [S in keyof Z["alternatives"]]: Z["alternatives"][S] extends Empty
    ? () => Promise<Context<Z>>
    : (associatedValues: Z["alternatives"][S]) => Promise<Context<Z>>
  }

export type Mutation<Z extends Scenes> = {
  [S in keyof Z["goals"]]: Z["goals"][S] extends Empty
  ? () => void
  : (associatedValues: Z["goals"][S]) => void
}

export type Choreography<D extends DomainKeys, U extends keyof Requirements[D], Z extends ScenesInScenario<D, U>> = {
  behavior: <A extends Actor>(actor: A, scenario: Scenario<Z>) => Behavior<Z>
  mutation: Mutation<Z>
  rewind?: (error: Error) => void
}

export class ScenarioDelegate<D extends DomainKeys, U extends keyof Requirements[D], Z extends ScenesInScenario<D, U>>
  implements IScenarioDelegate<Z> {
  protected behavior: <A extends Actor>(actor: A, scenario: Scenario<Z>) => Behavior<Z>
  protected mutation?: Mutation<Z>
  protected rewind?: (error: Error) => void

  // frontend用
  constructor(choreography: Choreography<D, U, Z>) {
    this.behavior = choreography.behavior
    this.mutation = choreography.mutation
    this.rewind = choreography.rewind
  }

  next<A extends IActor<NOCARE>>(
    { scene, course: _c, ...associatedValues }: Context<Z>,
    actor: A,
    scenario: Scenario<Z>
  ): Promise<Context<Z>> {
    return this.behavior(actor as Actor, scenario)[scene](associatedValues as NOCARE) // TODO: Fix any
  }

  authorize<
    A extends IActor<NOCARE>,
    R extends DomainRequirements,
    D extends StringKeyof<R>,
    U extends StringKeyof<R[D]>
  >(actor: A, domain: D, usecase: U): boolean {
    const isAuthorizedTo = (actor as unknown as AbstractActor<unknown>)
      .isAuthorizedTo
    if (isAuthorizedTo === undefined) return true
    return isAuthorizedTo(domain, usecase)
  }

  complete<
    A extends IActor<NOCARE>,
    R extends DomainRequirements,
    D extends keyof R,
    U extends keyof R[D]
  >(withResult: InteractResult<R, D, U, A, Z>): void {
    // TODO: usecaseの実行結果をログに残す
    console.info(
      `[COMPLETION] ${String(withResult.domain)}.${String(withResult.usecase)} (${withResult.id})`,
      withResult
    )

    if (withResult.type === InteractResultType.success) {
      const {
        course: __,
        scene,
        ...associatedValues
      } = withResult.lastSceneContext
      this.mutation?.[scene](associatedValues as NOCARE) // TODO: fix any
    } else {
      this.rewind?.(withResult.error)
    }
  }
}
