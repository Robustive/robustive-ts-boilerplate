import { AbstractActor, DomainRequirements } from "robustive-ts"
import { Actor } from "."

export class Service extends AbstractActor<null> {
  isAuthorizedTo = <R extends DomainRequirements>(
    domain: keyof R,
    usecase: keyof R[keyof R]
  ): boolean => {
    console.log("Service.isAuthorizedTo", domain, usecase)
    return true
  }
}
export const isService = (actor: Actor): actor is Service =>
  actor.constructor === Service
