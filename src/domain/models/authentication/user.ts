import { Empty, SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts"
import { BasicClaims } from "."

import { AccountRole, Role } from "@domain/actors"
import { DisplayName, Email, UserId } from "./type"
import { Result } from "@domain/functional-utils/result"
import { AuthenticationErrorCode } from "@domain/errors/authentication"
import { ValidationErrorCode } from "@domain/errors/validation"

/**
 * サインインステータス
 */
type SignInStatusContext = {
  signIn: { account: Account; accessToken?: string }
  signOut: Empty
  unknown: Empty
}

export const SignInStatus = new SwiftEnum<SignInStatusContext>()
export type SignInStatus = SwiftEnumCases<SignInStatusContext>

const _UsageStatus = {
  created: 0,
  activated: 1
} as const

export type UsageStatus = typeof _UsageStatus[keyof typeof _UsageStatus]

export const UsageStatus = {
  ..._UsageStatus,
  tryFrom: (usageStatusNumber: number): Result<UsageStatus, ValidationErrorCode> => {
    switch (usageStatusNumber) {
      case UsageStatus.created:
        return Result.Ok(UsageStatus.created)
      case UsageStatus.activated:
        return Result.Ok(UsageStatus.activated)
      default:
        return Result.Err(ValidationErrorCode.UnknownValue({ field: "UsageStatus", value: usageStatusNumber.toString() }))
    }
  },
  unsafeFrom: (usageStatusNumber: number): UsageStatus => {
    switch (usageStatusNumber) {
      case UsageStatus.created:
        return UsageStatus.created
      case UsageStatus.activated:
        return UsageStatus.activated
      default:
        throw new Error(`Unknown usage status: ${usageStatusNumber}`)
    }
  }
} as const

export type Account = {
  readonly id: UserId
  readonly role: Role
  readonly usageStatus: UsageStatus
  readonly displayName: DisplayName
  readonly name: {
    readonly givenName: string
    readonly familyName: string
    readonly middleName?: string
  }
  readonly email: Email
  readonly photoUrl?: string
}

export const Account = {
  tryFromClaims: (
    claims: BasicClaims
  ): Result<Account, AuthenticationErrorCode> => {
    // Emailのバリデーション
    const emailResult = Email.tryFrom(claims.email)
    if (emailResult.isErr()) {
      return Result.Err(AuthenticationErrorCode.accountCreationFailed({ cause: emailResult.error }))
    }

    // DisplayNameのバリデーション
    const displayNameResult = DisplayName.tryFrom(claims.displayName)
    if (displayNameResult.isErr()) {
      return Result.Err(AuthenticationErrorCode.accountCreationFailed({ cause: displayNameResult.error }))
    }

    // 新しいValidatedAccountを作成
    const account: Account = {
      id: UserId.generate(),
      role: AccountRole.personal(),
      usageStatus: UsageStatus.created,
      displayName: displayNameResult.value,
      name: {
        givenName: claims.name.givenName,
        familyName: claims.name.familyName,
        middleName: claims.name.middleName
      },
      email: emailResult.value,
      photoUrl: claims.photoUrl
    }

    return Result.Ok(account)
  },
  tryFrom: (
    accountDto: AccountDto
  ): Result<Account, AuthenticationErrorCode> => {
    const userIdResult = UserId.tryFrom(accountDto.id)
    if (userIdResult.isErr()) {
      return Result.Err(AuthenticationErrorCode.accountCreationFailed({ cause: userIdResult.error }))
    }

    const roleResult = Role.tryFrom(accountDto.role)
    if (roleResult.isErr()) {
      return Result.Err(AuthenticationErrorCode.accountCreationFailed({ cause: roleResult.error }))
    }

    const usageStatusResult = UsageStatus.tryFrom(accountDto.usageStatus)
    if (usageStatusResult.isErr()) {
      return Result.Err(AuthenticationErrorCode.accountCreationFailed({ cause: usageStatusResult.error }))
    }

    // Emailのバリデーション
    const emailResult = Email.tryFrom(accountDto.email)
    if (emailResult.isErr()) {
      return Result.Err(AuthenticationErrorCode.accountCreationFailed({ cause: emailResult.error }))
    }

    // DisplayNameのバリデーション
    const displayNameResult = DisplayName.tryFrom(accountDto.displayName)
    if (displayNameResult.isErr()) {
      return Result.Err(AuthenticationErrorCode.accountCreationFailed({ cause: displayNameResult.error }))
    }

    // 新しいValidatedAccountを作成
    const account: Account = {
      id: userIdResult.value,
      role: roleResult.value,
      usageStatus: usageStatusResult.value,
      displayName: displayNameResult.value,
      name: accountDto.name,
      email: emailResult.value,
      photoUrl: accountDto.photoUrl
    }

    return Result.Ok(account)
  },
  unsafeFrom: (
    accountDto: AccountDto
  ): Account => {

    // 新しいValidatedAccountを作成
    const account: Account = {
      id: UserId.unsafeFrom(accountDto.id),
      role: Role.unsafeFrom(accountDto.role),
      usageStatus: UsageStatus.unsafeFrom(accountDto.usageStatus),
      displayName: DisplayName.unsafeFrom(accountDto.displayName),
      name: accountDto.name,
      email: Email.unsafeFrom(accountDto.email),
      photoUrl: accountDto.photoUrl
    }

    return account
  }
} as const

export type AccountDto = {
  readonly id: string
  readonly role: string
  readonly usageStatus: number
  readonly displayName: string
  readonly name: {
    readonly givenName: string
    readonly familyName: string
    readonly middleName?: string
  }
  readonly email: string
  readonly photoUrl?: string
}

export const AccountDto = {
  from: (
    account: Account
  ): AccountDto => {
    return {
      id: account.id,
      role: account.role.case,
      usageStatus: account.usageStatus,
      displayName: account.displayName,
      name: account.name,
      email: account.email,
      photoUrl: account.photoUrl
    }
  }
} as const
