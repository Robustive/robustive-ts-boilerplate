import { Empty } from "robustive-ts"

/**
 * usecase: サインインする
 */
export type SignInScenes = {
  basics: {
    ユーザはサインインボタンを押下する: Empty
    システムはGoogleOAuthを行う: Empty
  }
  alternatives: Empty
  goals: {
    GoogleOAuthでリダイレクトするためここには到達しない: Empty
  }
}
