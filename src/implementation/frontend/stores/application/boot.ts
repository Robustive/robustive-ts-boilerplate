import { R } from "@domain/usecases"
import { BootScenes } from "@domain/usecases/application/boot"
import { Context, IActor, NOCARE, Scenario } from "robustive-ts"
import { FrontendService, Mutation } from ".."
import { Account, SignInStatus } from "@domain/models/authentication/user"
import { handOverToBackend } from "@frontend/common"
import { SessionStoredError } from "@domain/errors"
import { Behavior, Choreography } from "@shared/scenarioDelegate"

export function createFrontendBootChoreography(service: FrontendService): Choreography<BootScenes> {
  const { basics, goals } = R.application.boot.keys

  const behavior = <A extends IActor<NOCARE>>(scenario: Scenario<BootScenes>): Behavior<A, BootScenes> => {
    return {
      [basics.ユーザはサイトを開く]: (_actor: A): Promise<Context<BootScenes>> => {
        return scenario.just(
          scenario.basics.システムはサインインセッションを確認する({
            session: null
          })
        )
      },
      [basics.システムはサインインセッションを確認する]: (_actor: A, {
        session
      }: {
        session: {
          passport: { user?: Account }
          hasError?: SessionStoredError
        } | null
      }): Promise<Context<BootScenes>> => {
        return handOverToBackend(
          scenario.basics.システムはサインインセッションを確認する({ session }),
          scenario
        )
      }
    }
  }

  const mutation: Mutation<BootScenes> = {
    [goals.サインインセッションがある場合_システムはホーム画面を表示する]: ({
      account
    }: {
      account: Account
    }) => {
      service.actions.change(
        SignInStatus.signIn({
          userProperties: account
        })
      )
      console.log("サインインセッションあり", account)
    },
    [goals.サインインセッションがない場合_システムはサインイン画面を表示する]: () => {
      service.actions.change(SignInStatus.signOut())
      console.log("サインインセッションなし")
      // service.actions.routingTo("/signin")
    },
    [goals.セッションにエラー情報がある場合_システムはホーム画面にエラー表示する]: ({
      sessionStoredError
    }: {
      sessionStoredError: SessionStoredError
    }) => {
      service.actions.change(SignInStatus.signOut())
      console.log("セッションにサインインエラーあり")
      service.actions.setOneTime(service.states.shared, "sessionStoredError", sessionStoredError)
    }
  }

  return {
    behavior,
    mutation
  }
}
