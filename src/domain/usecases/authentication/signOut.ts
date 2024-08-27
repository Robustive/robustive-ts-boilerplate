import { Empty } from "robustive-ts"

/**
 * usecase: サインアウトする
 */
export type SignOutScenes = {
  basics: {
    ユーザはサインアウトボタンを押下する: Empty
    システムはサインインセッションを破棄する: Empty
  }
  alternatives: Empty
  goals: {
    システムはホーム画面を表示する: Empty
  }
}
