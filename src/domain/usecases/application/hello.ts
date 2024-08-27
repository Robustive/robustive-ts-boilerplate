import { Empty } from "robustive-ts"

/**
 * usecase: FrontendとBackendとの疎通確認
 */
export type HelloScenes = {
  basics: {
    フロントエンドはバックエンドにHelloを送る: { hello: string }
    バックエンドはフロントエンドからHelloを受け取る: { hello: string }
    バックエンドはフロンエンドに返事をする: { hello: string }
  }
  alternatives: Empty
  goals: {
    フロントエンドはバックエンドから返事を受け取る: { hello: string }
  }
}
