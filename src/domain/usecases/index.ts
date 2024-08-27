import { BootScenes } from "./application/boot"
import { HelloScenes } from "./application/hello"
import {
  AllUsecases,
  AllUsecasesOverDomain,
  Robustive,
  Scenario,
  Usecase as UsecaseOrg
} from "robustive-ts"
import { SignInScenes } from "./authentication/signIn"
import { SignOutScenes } from "./authentication/signOut"

export const requirements = {
  application: {
    boot: Scenario<BootScenes>,
    hello: Scenario<HelloScenes>
  },
  authentication: {
    signIn: Scenario<SignInScenes>,
    signOut: Scenario<SignOutScenes>
  }
} as const

export const R = new Robustive(requirements)

export type Requirements = typeof requirements
export type DomainKeys = keyof Requirements
export type UsecaseKeys = {
  [D in DomainKeys]: {
    [U in keyof Requirements[D]]: U
  }[keyof Requirements[D]]
}[DomainKeys]

export type Usecases = AllUsecasesOverDomain<Requirements>
export type UsecasesOf<D extends DomainKeys> = AllUsecases<Requirements, D>
export type Usecase<
  D extends DomainKeys,
  U extends keyof Requirements[D]
> = UsecaseOrg<Requirements, D, U>

export type UsecaseLog<D extends DomainKeys> = {
  id: string
  executing: {
    domain: D
    usecase: UsecaseKeys
  }
  startAt: Date
}
