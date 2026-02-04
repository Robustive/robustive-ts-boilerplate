import "@robustive/robustive-ts-express"

import { Actor } from "@domain/actors";
import { DomainKeys, Requirements, Scenes as ScenesInScenario } from "@domain/usecases"
import { Behavior, Choreography, Mutation } from "@frontend/scenarioDelegate";
import {
  AbstractActor,
  Context,
  DomainRequirements,
  IActor,
  InteractResult,
  InteractResultType,
  IScenarioDelegate,
  NOCARE,
  Scenario,
  StringKeyof
} from "@robustive/robustive-ts"

import { Request, Response } from "express"
import { Behavior as BackendBehavior } from "@backend/scenarioDelegate";
import { ResponseContext } from "@robustive/robustive-ts-express"

export class MockFrontendScenarioDelegate<D extends DomainKeys, U extends keyof Requirements[D], Z extends ScenesInScenario<D, U>>
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
      `[F][COMPLETION] ${String(withResult.domain)}.${String(withResult.usecase)} (${withResult.id})`,
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

export class MockBackendScenarioDelegate<D extends DomainKeys, U extends keyof Requirements[D], Z extends ScenesInScenario<D, U>>
  implements IScenarioDelegate<Z> {
  protected choreography: <A extends Actor>(
    req: Request,
    res: Response,
    actor: A,
    scenario: Scenario<Z>
  ) => BackendBehavior<Z>
  protected rewind?: (error: Error) => void

  constructor(choreography: <A extends Actor>(
    req: Request,
    res: Response,
    actor: A,
    scenario: Scenario<Z>) => BackendBehavior<Z>) {
    this.choreography = choreography
  }

  proceedUntilResponse<A extends IActor<NOCARE>>(
    req: Request,
    res: Response,
    { scene, course: _c, ...associatedValues }: Context<Z>,
    actor: A,
    scenario: Scenario<Z>
  ): Promise<ResponseContext<Z>> {
    return this.choreography(req, res, actor as Actor, scenario)[scene](associatedValues as NOCARE) // TODO: Fix any
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
}