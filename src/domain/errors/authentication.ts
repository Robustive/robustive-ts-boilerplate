import { SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts"
import { ValidationErrorCode } from "./validation";

type AuthenticationErrorContext = {
  domainNotAllowed: { title: string; body: string; domain: string }
  accountCreationFailed: { cause: ValidationErrorCode }
  doubleSubmitVerifyFailed: { title: string; body: string }
  pageAccessControlNotDefined: { role: string }
}

export const AuthenticationErrorCode = new SwiftEnum<AuthenticationErrorContext>()
export type AuthenticationErrorCode = SwiftEnumCases<AuthenticationErrorContext>
