import { Actor, Role } from "."
import { AbstractActor, DomainRequirements } from "@robustive/robustive-ts"
import { Account } from "@domain/models/authentication/user"
import { PageId, RoleAuthorizationRules } from "@domain/models/authentication/authorization"

export class AuthenticatedUser extends AbstractActor<Account> {

  /**
   * バックエンドがトークンベースのアプリセッション管理を選択している場合、サインイン後にアクセストークトンが返される。
   * @param account 
   * @param accessToken 
   */
  constructor(account: Account | null = null, private _accessToken?: string) {
    super(account)
  }

  get account(): Account {
    return this.user!
  }

  get role(): Role {
    return this.account.role
  }

  get accessToken(): string | undefined {
    return this._accessToken
  }

  isAuthorizedTo<R extends DomainRequirements>(
    domain: keyof R,
    usecase: keyof R[keyof R]
  ): boolean {
    console.log("AuthenticatedUser.isAuthorizedTo:", domain, usecase)
    return true
  }

  canAccessPage(pageId: PageId): boolean {
    return RoleAuthorizationRules.canRoleAccessPage(this.role, pageId)
  }
}

export const isAuthenticatedUser = (actor: Actor): actor is AuthenticatedUser =>
  actor.constructor === AuthenticatedUser
