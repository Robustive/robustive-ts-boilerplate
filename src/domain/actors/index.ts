import { Nobody } from "./nobody"
import { AuthenticatedUser } from "./authenticatedUser"
import { Service } from "./service"
import { Empty, SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts"
import { Result } from "@domain/functional-utils/result"
import { ValidationErrorCode } from "@domain/errors/validation"

type AccountRoleContext = {
  anonymous: Empty
  personal: Empty
}
export const AccountRole = new SwiftEnum<AccountRoleContext>()
export type AccountRole = SwiftEnumCases<AccountRoleContext>

export type TeamId = string
type TeamRoleContext = {
  owner: { teamId: TeamId }
  admin: { teamId: TeamId }
  member: { teamId: TeamId }
  viewer: { teamId: TeamId }
}
export const TeamRole = new SwiftEnum<TeamRoleContext>()
export type TeamRole = SwiftEnumCases<TeamRoleContext>

type CollaborationRoleContext = {
  collaborator: { teamId?: TeamId, joinTeamId: TeamId }
  guest: { teamId?: TeamId, joinTeamId: TeamId }
}
export const CollaborationRole = new SwiftEnum<CollaborationRoleContext>()
export type CollaborationRole = SwiftEnumCases<CollaborationRoleContext>

type SystemRoleContext = {
  System: Empty
  Support: Empty
}
export const SystemRole = new SwiftEnum<SystemRoleContext>()
export type SystemRole = SwiftEnumCases<SystemRoleContext>

export type Role = AccountRole | TeamRole | CollaborationRole
export const Role = {
  tryFrom: (roleString: string): Result<Role, ValidationErrorCode> => {
    switch (roleString) {
      case AccountRole.keys.anonymous:
        return Result.Ok(AccountRole.anonymous())
      case AccountRole.keys.personal:
        return Result.Ok(AccountRole.personal())
      // case TeamRole.keys.owner:
      //   return Role.owner({ teamId: row.teamId })
      // case TeamRole.keys.admin:
      //   return Role.admin({ teamId: row.teamId })
      // case TeamRole.keys.member:
      //   return Role.member({ teamId: row.teamId })
      // case TeamRole.keys.viewer:
      //   return Role.viewer({ teamId: row.teamId })
      // case CollaborationRole.keys.collaborator:
      //   return Role.collaborator({ teamId: row.teamId, joinTeamId: row.joinTeamId })
      // case CollaborationRole.keys.guest:
      //   return Role.guest({ teamId: row.teamId, joinTeamId: row.joinTeamId })
      default:
        return Result.Err(ValidationErrorCode.UnknownValue({ field: "Role", value: roleString }))
    }
  },
  unsafeFrom: (roleString: string): Role => {
    switch (roleString) {
      case AccountRole.keys.anonymous:
        return AccountRole.anonymous()
      case AccountRole.keys.personal:
        return AccountRole.personal()
      default:
        throw new Error(`Unknown role: ${roleString}`)
    }
  }
}


export type Actor = Nobody | AuthenticatedUser | Service
