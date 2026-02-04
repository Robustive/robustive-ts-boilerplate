import { ServiceErrorCode } from "@domain/errors"
import { Account } from "@domain/models/authentication/user"
import { Empty } from "@robustive/robustive-ts"

/**
 * usecase: サービスの利用開始
 */
export type BootScenes = {
  basics: {
    ユーザはサイトを開く: Empty
    システムはサインインセッションを確認する: Empty
    トークンによるセッションの場合_システムはCSRFトークンを検証する: { isResubmission: boolean }
    CSRFトークンが有効な場合_システムはアクセストークンを確認する: Empty
    アクセストークンがない場合_システムはリフレッシュトークンを検証する: Empty
    リフレッシュトークンが有効な場合_システムはアクセストークンを発行する: { account: Account }
  }
  alternatives: {
    CSRFトークンが無効な場合_システムはCSRFトークンを要求する: Empty
    アクセストークンがある場合_システムはアクセストークンを検証する: { accessToken: string }
    アクセストークンが無効の場合_システムはリフレッシュトークンを検証する: Empty

  }
  goals: {
    システムはホーム画面を表示する: { account: Account, accessToken: string }
    アクセストークンが有効な場合_システムはホーム画面を表示する: { account: Account, accessToken: string }
    リフレッシュトークンがないあるいは無効な場合_システムはサインイン画面を表示する: Empty
    セッションストアによるセッション管理でセッションがある場合_システムはホーム画面を表示する: { account: Account }
    セッションストアによるセッション管理でセッションがない場合_システムはサインイン画面を表示する: Empty
    セッションにエラー情報がある場合_システムはホーム画面にエラー表示する: { errorCode: ServiceErrorCode }
  }
}
