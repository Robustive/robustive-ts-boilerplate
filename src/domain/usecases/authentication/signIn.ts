import { AuthenticationEnvelope } from "@domain/models/authentication"
import { Account } from "@domain/models/authentication/user"
import { Empty } from "@robustive/robustive-ts"
import { SystemError } from "@shared/systemeError"

/**
 * usecase: サインインする
 */
export type SignInScenes = {
  basics: {
    ユーザはサインインボタンを押下する: Empty
    GoogleOAuthの場合_システムはGoogleOAuthを行う: Empty
    Googleからリダイレクトされた場合_システムはアプリセッションを開始する: Empty
    トークンによるセッション管理の場合_システムはアカウントを取得する: Empty
    アカウントがある場合_システムはリフレッシュトークン発行する: { account: Account }
    システムはトップページへリダイレクトする: Empty
  }
  alternatives: {
    セッションストアによるセッション管理の場合_システムはセッションを開始する: Empty
    アカウントがあるがGoogleOpenIdと紐づいていない場合_システムはアカウントとの紐づけを行う: { account: Account, envelope: AuthenticationEnvelope }
    紐づけに成功した場合_システムはリフレッシュトークン発行する: { account: Account }
    アカウントがない場合_システムはアカウントを発行する: { envelope: AuthenticationEnvelope }
    アカウントの発行に成功した場合_システムはリフレッシュトークン発行する: { account: Account }
  }
  goals: {
    システムはトップページを表示する: Empty
    アカウントの発行に失敗した場合_システムはエラーを表示する: { error: SystemError }
  }
}
