import { PageId, RoleAuthorizationRules } from "@domain/models/authentication/authorization"
import { AccountRole, Actor } from "."
import { AbstractActor, DomainRequirements } from "@robustive/robustive-ts"

export class Nobody extends AbstractActor<null> {

  isAuthorizedTo<R extends DomainRequirements>(
    domain: keyof R,
    usecase: keyof R[keyof R]
  ): boolean {
    console.log("Nobody.isAuthorizedTo:", domain, usecase)
    return true
  }

  canAccessPage(pageId: PageId): boolean {
    return RoleAuthorizationRules.canRoleAccessPage(AccountRole.anonymous(), pageId)
  }

  // isAuthorizedTo(domain: DomainKeys, usecase: UsecaseKeys): boolean {
  //   console.log(domain, usecase)
  //   // if (domain === R.keys.application && usecase === R.application.keys.boot) {
  //   //   return true;
  //   // }
  //   // if (
  //   //   domain === R.keys.authentication &&
  //   //   (usecase === R.authentication.keys.signIn ||
  //   //     usecase === R.authentication.keys.signUp)
  //   // ) {
  //   //   return true;
  //   // }
  //   return true
  // }
}

export const isNobody = (actor: Actor): actor is Nobody =>
  actor.constructor === Nobody
