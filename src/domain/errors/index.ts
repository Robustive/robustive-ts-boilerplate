import { SwiftEnum, SwiftEnumCases } from "robustive-ts"

type SessionStoredErrorContext = {
  domainNotAllowed: { title: string; body: string; domain: string }
}

export const SessionStoredError = new SwiftEnum<SessionStoredErrorContext>()
export type SessionStoredError = SwiftEnumCases<SessionStoredErrorContext>
