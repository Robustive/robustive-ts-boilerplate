import { R } from "@domain/usecases"
import { Context, Scenario } from "@robustive/robustive-ts"
import { FrontendService, Mutation } from ".."
import { SignInScenes } from "@domain/usecases/authentication/signIn"
import { Behavior, Choreography } from "@frontend/scenarioDelegate"
import { Actor } from "@domain/actors"
import { NoImplementationNeeded } from "@shared/common"

export function createFrontendSignInChoreography(
  _service: FrontendService
): Choreography<"authentication", "signIn", SignInScenes> {
  const { basics: B, alternatives: A, goals: G } = R.authentication.signIn.keys

  const behavior = (_actor: Actor, scenario: Scenario<SignInScenes>): Behavior<SignInScenes> => {
    return {
      [B.ユーザはサインインボタンを押下する]: (): Promise<Context<SignInScenes>> => {
        window.location.href = "/auth/google"
        return scenario.just(scenario.basics.GoogleOAuthの場合_システムはGoogleOAuthを行う())
      },
      [B.GoogleOAuthの場合_システムはGoogleOAuthを行う]: NoImplementationNeeded,
      [B.Googleからリダイレクトされた場合_システムはアプリセッションを開始する]: NoImplementationNeeded,
      [B.トークンによるセッション管理の場合_システムはアカウントを取得する]: NoImplementationNeeded,
      [B.アカウントがある場合_システムはリフレッシュトークン発行する]: NoImplementationNeeded,
      [B.システムはトップページへリダイレクトする]: NoImplementationNeeded,
      [A.セッションストアによるセッション管理の場合_システムはセッションを開始する]: NoImplementationNeeded,
      [A.アカウントがあるがGoogleOpenIdと紐づいていない場合_システムはアカウントとの紐づけを行う]: NoImplementationNeeded,
      [A.紐づけに成功した場合_システムはリフレッシュトークン発行する]: NoImplementationNeeded,
      [A.アカウントがない場合_システムはアカウントを発行する]: NoImplementationNeeded,
      [A.アカウントの発行に成功した場合_システムはリフレッシュトークン発行する]: NoImplementationNeeded
    }
  }

  const mutation: Mutation<SignInScenes> = {
    [G.システムはトップページを表示する]: () => {
      console.log("★ GoogleOAuthでリダイレクトするためここには到達しない")
    },
    [G.アカウントの発行に失敗した場合_システムはエラーを表示する]: ({ error }) => {
      console.error("アカウントの発行で失敗", error)
    }
  }

  return {
    behavior,
    mutation
  }
}
