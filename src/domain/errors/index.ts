import { AuthenticationErrorCode } from "./authentication"
import { ValidationErrorCode } from "./validation"

export type ServiceErrorCode = AuthenticationErrorCode | ValidationErrorCode

export class ServiceError extends Error {
  readonly name: string

  constructor(private _code: ServiceErrorCode) {
    const { case: name, ...rest } = _code
    super(JSON.stringify(rest))
    this.name = name
    Object.setPrototypeOf(this, new.target.prototype)
  }

  get code(): ServiceErrorCode {
    return this._code
  }
}