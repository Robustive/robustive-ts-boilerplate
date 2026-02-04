import { R } from "@domain/usecases"
import { BootScenes } from "@domain/usecases/application/boot"
import { Context, Scenario } from "@robustive/robustive-ts"
import { FrontendService, Mutation } from ".."
import { SignInStatus, UsageStatus } from "@domain/models/authentication/user"
import { handOverToBackend } from "@frontend/common"
import { Behavior, Choreography } from "@frontend/scenarioDelegate"
import { Actor } from "@domain/actors"
import { ServiceErrorCode } from "@domain/errors"
import { Account } from "@domain/models/authentication/user"
import { HttpMethod } from "@shared/interfaces"
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, NoImplementationNeeded } from "@shared/common"
import { getCookie } from "@frontend/common"
import { Views } from "@presentation/index"

export function createFrontendBootChoreography(
  service: FrontendService
): Choreography<"application", "boot", BootScenes> {
  const { basics: B, alternatives: A, goals: G } = R.application.boot.keys

  const behavior = (actor: Actor, scenario: Scenario<BootScenes>): Behavior<BootScenes> => {
    return {
      [B.ユーザはサイトを開く]: (): Promise<Context<BootScenes>> => {
        return scenario.just(
          scenario.basics.システムはサインインセッションを確認する()
        )
      },
      [B.システムはサインインセッションを確認する]: (): Promise<Context<BootScenes>> => {
        const csrf = getCookie(CSRF_COOKIE_NAME)
        return handOverToBackend(
          actor,
          scenario.basics.システムはサインインセッションを確認する(),
          scenario,
          {
            method: HttpMethod.POST_TO_REJECT_REQUESTS_WITHOUT_USER_INTERACTION_AS_PART_OF_CSRF_PROTECTION,
            headers: csrf ? { [CSRF_HEADER_NAME]: csrf } : {}
          }
        )
      },
      [B.トークンによるセッションの場合_システムはCSRFトークンを検証する]: NoImplementationNeeded,
      [B.CSRFトークンが有効な場合_システムはアクセストークンを確認する]: NoImplementationNeeded,
      [B.アクセストークンがない場合_システムはリフレッシュトークンを検証する]: NoImplementationNeeded,
      [B.リフレッシュトークンが有効な場合_システムはアクセストークンを発行する]: NoImplementationNeeded,
      [A.CSRFトークンが無効な場合_システムはCSRFトークンを要求する]: (): Promise<Context<BootScenes>> => {
        const csrf = getCookie(CSRF_COOKIE_NAME)
        return handOverToBackend(
          actor,
          scenario.basics.トークンによるセッションの場合_システムはCSRFトークンを検証する({ isResubmission: true }),
          scenario,
          {
            method: HttpMethod.POST_TO_REJECT_REQUESTS_WITHOUT_USER_INTERACTION_AS_PART_OF_CSRF_PROTECTION,
            headers: csrf ? { [CSRF_HEADER_NAME]: csrf } : {}
          }
        )
      },
      [A.アクセストークンがある場合_システムはアクセストークンを検証する]: NoImplementationNeeded,
      [A.アクセストークンが無効の場合_システムはリフレッシュトークンを検証する]: NoImplementationNeeded,
    }
  }

  const mutation: Mutation<BootScenes> = {
    [G.システムはホーム画面を表示する]: ({ account, accessToken }: { account: Account, accessToken: string }) => {
      service.helpers.change(SignInStatus.signIn({ account, accessToken }))
      if (account.usageStatus === UsageStatus.created) {
        service.helpers.navigateTo(`${Views.Main.path}${Views.ProfileEdit.path}?welcome=true`)
      }
    },
    [G.アクセストークンが有効な場合_システムはホーム画面を表示する]: ({ account, accessToken }: { account: Account, accessToken: string }) => {
      service.helpers.change(SignInStatus.signIn({ account, accessToken }))
    },
    [G.リフレッシュトークンがないあるいは無効な場合_システムはサインイン画面を表示する]: () => {
      service.helpers.change(SignInStatus.signOut())
      // service.helpers.navigateTo("/signin")
    },
    [G.セッションストアによるセッション管理でセッションがある場合_システムはホーム画面を表示する]: ({ account }: { account: Account }) => {
      service.helpers.change(SignInStatus.signIn({ account }))
    },
    [G.セッションストアによるセッション管理でセッションがない場合_システムはサインイン画面を表示する]: () => {
      service.helpers.change(SignInStatus.signOut())
      // service.helpers.navigateTo("/signin")
    },
    [G.セッションにエラー情報がある場合_システムはホーム画面にエラー表示する]:
      ({ errorCode }: { errorCode: ServiceErrorCode }) => {
        service.helpers.change(SignInStatus.signOut())
        console.log("セッションにサインインエラーあり")
        service.helpers.setOneTime(service.states.shared, "sessionStoredError", errorCode)
      }
  }

  return {
    behavior,
    mutation
  }
}
