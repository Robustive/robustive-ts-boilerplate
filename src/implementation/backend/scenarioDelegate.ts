import { Actor } from "@domain/actors"
import { DomainKeys, Requirements, Scenes as ScenesInScenario } from "@domain/usecases"
import {
  AbstractActor,
  Context,
  DomainRequirements,
  Empty,
  IActor,
  IScenarioDelegate,
  NOCARE,
  Scenario,
  Scenes,
  StringKeyof
} from "@robustive/robustive-ts"
import { ResponseContext } from "@robustive/robustive-ts-express"
import { Request, Response } from "express"
import { SystemError, SystemErrorCode } from "@shared/systemeError"

export const NoImplementationNeeded = <A extends Actor, Z extends Scenes>(): Promise<ResponseContext<Z>> => {
  throw new SystemError(SystemErrorCode.unreachable({ reason: "no implementation needed" }))
}

export function ImplementationTodo(specification: string) {
  return <Z extends Scenes>(): Promise<ResponseContext<Z>> => {
    throw new SystemError(SystemErrorCode.implementationRequired({ specification }))
  }
}

export type Behavior<Z extends Scenes> = Z["alternatives"] extends Empty
  ? {
    [S in keyof Z["basics"]]: Z["basics"][S] extends Empty
    ? () => Promise<ResponseContext<Z>>
    : (associatedValues: Z["basics"][S]) => Promise<ResponseContext<Z>>
  }
  : {
    [S in keyof Z["basics"]]: Z["basics"][S] extends Empty
    ? () => Promise<ResponseContext<Z>>
    : (associatedValues: Z["basics"][S]) => Promise<ResponseContext<Z>>
  } & {
    [S in keyof Z["alternatives"]]: Z["alternatives"][S] extends Empty
    ? () => Promise<ResponseContext<Z>>
    : (associatedValues: Z["alternatives"][S]) => Promise<ResponseContext<Z>>
  }


export class ScenarioDelegate<D extends DomainKeys, U extends keyof Requirements[D], Z extends ScenesInScenario<D, U>>
  implements IScenarioDelegate<Z> {
  protected choreography: <A extends Actor>(
    req: Request,
    res: Response,
    actor: A,
    scenario: Scenario<Z>
  ) => Behavior<Z>
  protected rewind?: (error: Error) => void

  constructor(choreography: <A extends Actor>(
    req: Request,
    res: Response,
    actor: A,
    scenario: Scenario<Z>) => Behavior<Z>) {
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