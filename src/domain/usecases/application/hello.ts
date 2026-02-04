import { Account } from "@domain/models/authentication/user"
import { Empty } from "@robustive/robustive-ts"

/**
 * usecase: FrontendとBackendとの疎通確認
 */
export type HelloScenes = {
  basics: {
    ユーザはHelloを送る: { hello: string }
    システムはActorを確認する: Empty
    AuthenticatedUserの場合_システムはトランザクションを開始する: Empty
    システムはユーザ情報を取得する: Empty,
    システムはトランザクションをロールバックする: { account: Account }
  }
  alternatives: Empty
  goals: {
    システムは返事をする: { reply: string }
    Nobodyの場合_システムは返事をする: { reply: string }
  }
}
