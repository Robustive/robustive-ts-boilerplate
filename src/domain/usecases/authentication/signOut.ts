import { Empty } from "@robustive/robustive-ts"

/**
 * usecase: サインアウトする
 */
export type SignOutScenes = {
  basics: {
    ユーザはサインアウトボタンを押下する: Empty
    トークンによるセッション管理の場合_システムはリフレッシュトークンを破棄する: Empty
  }
  alternatives: {
    セッションストアによるセッション管理の場合_システムはセッションを破棄する: Empty
  }
  goals: {
    システムはホーム画面を表示する: Empty
  }
}
