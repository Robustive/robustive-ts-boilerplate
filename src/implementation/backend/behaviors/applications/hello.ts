import { Actor } from "@domain/actors"
import { R } from "@domain/usecases"
import { HelloScenes } from "@domain/usecases/application/hello"
import { Behavior, NoImplementationNeeded } from "@backend/scenarioDelegate"
import { Request, Response } from "express"
import { Scenario } from "@robustive/robustive-ts"
import { ResponseContext } from "@robustive/robustive-ts-express"
import { DataSource } from "@dependencies/postgres"
import { UserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { isAuthenticatedUser } from "@domain/actors/authenticatedUser"
import { Account } from "@domain/models/authentication/user"

export function createBackendHelloChoreography<Context, Client>(
  dataSource: DataSource<Context, Client>,
  userQuery: UserQuery
): (req: Request, res: Response, actor: Actor, scenario: Scenario<HelloScenes>) => Behavior<HelloScenes> {
  const { basics: B } = R.application.hello.keys
  return (req: Request, res: Response, actor: Actor, scenario: Scenario<HelloScenes>) => ({
    [B.ユーザはHelloを送る]: ({ hello: _ }: { hello: string }): Promise<ResponseContext<HelloScenes>> => {
      return scenario.just(scenario.basics.システムはActorを確認する())
    },
    [B.システムはActorを確認する]: (): Promise<ResponseContext<HelloScenes>> => {
      if (isAuthenticatedUser(actor)) {
        return scenario.just(scenario.basics.AuthenticatedUserの場合_システムはトランザクションを開始する())
      }
      return scenario.just(scenario.goals.Nobodyの場合_システムは返事をする({ reply: "Hello Nobody!" }))
    },
    [B.AuthenticatedUserの場合_システムはトランザクションを開始する]: async (): Promise<ResponseContext<HelloScenes>> => {
      await dataSource.begin()
      return scenario.just(scenario.basics.システムはユーザ情報を取得する())
    },
    [B.システムはユーザ情報を取得する]: (): Promise<ResponseContext<HelloScenes>> => {
      return userQuery.findById(actor.user.id)
        .then((_account) => {
          return scenario.just(scenario.basics.システムはトランザクションをロールバックする({ account: _account }))
        })
    },
    [B.システムはトランザクションをロールバックする]: async ({ account }: { account: Account }): Promise<ResponseContext<HelloScenes>> => {
      await dataSource.rollback()
      return scenario.just(scenario.goals.システムは返事をする({ reply: `Hello ${account.displayName}!` }))
    }
  })
}
