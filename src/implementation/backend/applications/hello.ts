import { BackendService } from "@backend/controllers"
import { R } from "@domain/usecases"
import { HelloScenes } from "@domain/usecases/application/hello"
import { Behavior, Choreography } from "@shared/scenarioDelegate"
import { Context, IActor, NOCARE, Scenario } from "robustive-ts"

export function createBackendHelloChoreography(_service: BackendService): Choreography<HelloScenes> {
  const behavior = <A extends IActor<NOCARE>>(
    scenario: Scenario<HelloScenes>
  ): Behavior<A, HelloScenes> => {
    return {
      [R.application.hello.keys.basics.フロントエンドはバックエンドにHelloを送る]: (_actor: A, {
        hello: _hello
      }: {
        hello: string
      }): Promise<Context<HelloScenes>> => {
        throw new Error("not implemented")
      },
      [R.application.hello.keys.basics.バックエンドはフロントエンドからHelloを受け取る]: (_actor: A, {
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
      [R.application.hello.keys.basics.バックエンドはフロンエンドに返事をする]: (_actor: A, {
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

  return {
    behavior
  }
}
