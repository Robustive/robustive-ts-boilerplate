import { Context, Scenes } from "@robustive/robustive-ts"

export const CSRF_COOKIE_NAME = "csrf_token"
export const CSRF_HEADER_NAME = "X-CSRF-Token"

export const NoImplementationNeeded = <Z extends Scenes>(): Promise<Context<Z>> => {
    throw new Error("no implementation needed")
}