import { R } from "@domain/usecases"
import { HelloScenes } from "@domain/usecases/application/hello"
import { HandOverToBackend } from "@frontend/common"
import { Context, Scenario } from "@robustive/robustive-ts"
import { FrontendService, Mutation } from ".."
import { Behavior, Choreography } from "@frontend/scenarioDelegate"
import { NoImplementationNeeded } from "@shared/common"
import { Actor } from "@domain/actors"

export function createFrontendHelloChoreography(
  service: FrontendService,
  handOverToBackend: HandOverToBackend<HelloScenes, Scenario<HelloScenes>>
): Choreography<"application", "hello", HelloScenes> {
  const { basics: B, goals: G } = R.application.hello.keys
  const behavior = (actor: Actor, scenario: Scenario<HelloScenes>): Behavior<HelloScenes> => {
    return {
      [B.ユーザはHelloを送る]: ({ hello }: { hello: string }): Promise<Context<HelloScenes>> => {
        return handOverToBackend(
          actor,
          scenario.basics.ユーザはHelloを送る({
            hello
          }),
          scenario
        )
      },
      [B.システムはActorを確認する]: NoImplementationNeeded,
      [B.AuthenticatedUserの場合_システムはトランザクションを開始する]: NoImplementationNeeded,
      [B.システムはユーザ情報を取得する]: NoImplementationNeeded,
      [B.システムはトランザクションをロールバックする]: NoImplementationNeeded,
    }
  }

  const mutation: Mutation<HelloScenes> = {
    [G.システムは返事をする]: ({ reply }: { reply: string }) => {
      service.helpers.set(service.states.application, "replyFromBackend", reply)
    },
    [G.Nobodyの場合_システムは返事をする]: ({ reply }: { reply: string }) => {
      service.helpers.set(service.states.application, "replyFromBackend", reply)
    }
  }

  return {
    behavior,
    mutation
  }
}
