import { R } from "@domain/usecases"
import { HelloScenes } from "@domain/usecases/application/hello"
import { handOverToBackend } from "@frontend/common"
import { Context, Scenario } from "robustive-ts"
import { FrontendService, Mutation } from ".."
import { Behavior, Choreography } from "@shared/scenarioDelegate"

export function createFrontendHelloChoreography(
  service: FrontendService
): Choreography<HelloScenes> {
  const { basics, goals } = R.application.hello.keys
  const behavior = (scenario: Scenario<HelloScenes>): Behavior<HelloScenes> => {
    return {
      [basics.フロントエンドはバックエンドにHelloを送る]: ({
        hello
      }: {
        hello: string
      }): Promise<Context<HelloScenes>> => {
        return handOverToBackend(
          scenario.basics.バックエンドはフロントエンドからHelloを受け取る({
            hello
          }),
          scenario
        )
      },
      [basics.バックエンドはフロントエンドからHelloを受け取る]: ({
        hello: _hello
      }: {
        hello: string
      }): Promise<Context<HelloScenes>> => {
        throw new Error("not implemented")
      },
      [basics.バックエンドはフロンエンドに返事をする]: ({
        hello: _hello
      }: {
        hello: string
      }): Promise<Context<HelloScenes>> => {
        throw new Error("not implemented")
      }
    }
  }

  const mutation: Mutation<HelloScenes> = {
    [goals.フロントエンドはバックエンドから返事を受け取る]: ({
      hello
    }: {
      hello: string
    }) => {
      const reply = hello
      service.actions.set(service.states.application, "replyFromBackend", reply)
    }
  }

  return {
    behavior,
    mutation
  }
}
