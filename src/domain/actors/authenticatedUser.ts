import { Actor } from "."
import { Account } from "../models/authentication/user"
import { AbstractActor, DomainRequirements } from "robustive-ts"

export class AuthenticatedUser extends AbstractActor<Account> {
  isAuthorizedTo = <R extends DomainRequirements>(
    domain: keyof R,
    usecase: keyof R[keyof R]
  ): boolean => {
    console.log("AuthenticatedUser.isAuthorizedTo:", domain, usecase)
    return true
  }
}
export const isAuthenticatedUser = (actor: Actor): actor is AuthenticatedUser =>
  actor.constructor === AuthenticatedUser
