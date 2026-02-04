import { AbstractActor, DomainRequirements } from "@robustive/robustive-ts"
import { Actor } from "."
import { PageId } from "@domain/models/authentication/authorization"

export class Service extends AbstractActor<null> {

  isAuthorizedTo<R extends DomainRequirements>(
    domain: keyof R,
    usecase: keyof R[keyof R]
  ): boolean {
    console.log("Service.isAuthorizedTo", domain, usecase)
    return true
  }

  canAccessPage(_pageId: PageId): boolean {
    // サービスアクターは全てのページにアクセス可能
    return true
  }
}

export const isService = (actor: Actor): actor is Service =>
  actor.constructor === Service
