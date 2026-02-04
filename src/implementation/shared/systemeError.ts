import { SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts"

type SystemErrorContext = {
  unreachable: { reason: string }
  unknownError: { debuggingLead: string, cause?: Error }
  implementationRequired: { specification: string }

  // server side
  outOfAsyncContext: { debuggingLead: string }

  // client side
  invalidPageId: { pageId: string }
}

export const SystemErrorCode = new SwiftEnum<SystemErrorContext>()
export type SystemErrorCode = SwiftEnumCases<SystemErrorContext>


export class SystemError extends Error {
  readonly name: string

  constructor(private _code: SystemErrorCode) {
    const { case: name, ...rest } = _code
    super(JSON.stringify(rest))
    this.name = name
    Object.setPrototypeOf(this, new.target.prototype)
  }

  get code(): SystemErrorCode {
    return this._code
  }
}