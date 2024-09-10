import { Entity } from "@shared/interfaces"
import { Empty, SwiftEnum, SwiftEnumCases } from "robustive-ts"

export type Account = {
  email: string
  firstName: string
  lastName: string
  photoUrl: string
  accessToken: string
}

export type UserProperties = {
  // createdAt: Date
} & Account

/**
 * サインインステータス
 */
type SignInStatusContext = {
  signIn: { userProperties: UserProperties }
  signingIn: { account: Account; token: string }
  signOut: Empty
  signingOut: Empty
  unknown: Empty
}

export const SignInStatus = new SwiftEnum<SignInStatusContext>()
export type SignInStatus = SwiftEnumCases<SignInStatusContext>

export class User implements Entity {
  account: Account
  static requiredScope: string[] = ["https://www.googleapis.com/auth/contacts.readonly"]

  constructor(account: Account)
  constructor(userProperties: UserProperties)

  constructor(arg: Account | UserProperties) {
    this.account = arg
  }
}
