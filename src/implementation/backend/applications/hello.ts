import { R } from "@domain/usecases"
import { HelloScenes } from "@domain/usecases/application/hello"
import { Behavior } from "@shared/scenarioDelegate"
import { Context, Scenario } from "robustive-ts"

export function createBackendHelloBehavior(
  scenario: Scenario<HelloScenes>
): Behavior<HelloScenes> {
  return {
    [R.application.hello.keys.basics.フロントエンドはバックエンドにHelloを送る]:
      ({ hello: _hello }: { hello: string }): Promise<Context<HelloScenes>> => {
        throw new Error("not implemented")
      },
    [R.application.hello.keys.basics
      .バックエンドはフロントエンドからHelloを受け取る]: ({
      hello: _hello
    }: {
      hello: string
    }): Promise<Context<HelloScenes>> => {
      return scenario.just(
        scenario.basics.バックエンドはフロンエンドに返事をする({
          hello: "Frontend"
        })
      )
    },
    [R.application.hello.keys.basics.バックエンドはフロンエンドに返事をする]: ({
      hello
    }: {
      hello: string
    }): Promise<Context<HelloScenes>> => {
      return scenario.just(
        scenario.goals.フロントエンドはバックエンドから返事を受け取る({
          hello
        })
      )
    }
  }
}
