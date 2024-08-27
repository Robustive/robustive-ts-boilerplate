import { SessionStoredError } from "@domain/errors"
import { Account } from "@domain/models/authentication/user"

import { Empty } from "robustive-ts"

/**
 * usecase: サービスの利用開始
 */
export type BootScenes = {
  basics: {
    ユーザはサイトを開く: Empty
    システムはサインインセッションを確認する: {
      session: {
        passport: { user?: Account }
        hasError?: SessionStoredError
      } | null
    }
  }
  alternatives: Empty
  goals: {
    サインインセッションがある場合_システムはホーム画面を表示する: {
      account: Account
    }
    サインインセッションがない場合_システムはサインイン画面を表示する: Empty
    セッションにエラー情報がある場合_システムはホーム画面にエラー表示する: {
      sessionStoredError: SessionStoredError
    }
  }
}
