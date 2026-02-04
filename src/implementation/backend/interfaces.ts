import { Actor } from "@domain/actors"
import {
  DomainKeys,
  Requirements,
  Usecase,
  UsecaseKeys
} from "@domain/usecases"
import {
  Context,
  Courses,
  InferScenes,
  StringKeyof
} from "@robustive/robustive-ts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariousPatterns = any

export type HandOverContext = {
  domain: DomainKeys
  usecase: UsecaseKeys
  course: Courses
  scene: string
}

/**
 * frontendと戻り値が違うので共通化していない
 * backend では実行結果の Context をAPIのレスポンスとして返している
 */
export type Action<
  D extends DomainKeys,
  U extends StringKeyof<Requirements[D]>
> = (
  usecase: Usecase<D, U>,
  actor: Actor,
) => Promise<Context<InferScenes<Requirements, D, U>>>

export type Actions<D extends DomainKeys> = {
  [U in StringKeyof<Requirements[D]>]: Action<D, U>
}

export type DomainActionsMap = {
  [D in DomainKeys]: Actions<D>
}

import { Strategy as OpenIDConnectStrategy } from "passport-openidconnect"
import { AuthenticateOptions } from "passport"
import { AuthenticationEnvelope } from "@domain/models/authentication"

export type CustomVerifyCallback = (err?: Error | null, authenticationEnvelope?: AuthenticationEnvelope, info?: any) => void

export interface IdentityProvider {
  strategy: OpenIDConnectStrategy
  redirectAuthenticationOptions: AuthenticateOptions | null
  callbackAuthenticationOptions: AuthenticateOptions | null
}

