import { describe, it, expect } from "vitest"
import { R, Requirements } from "@domain/usecases"
import { Nobody } from "@domain/actors/nobody"
import { createFrontendHelloChoreography } from "@frontend/stores/application/hello"
import { createBackendHelloChoreography } from "@backend/behaviors/applications/hello"
import { createMockFrontendService } from "../harness/mockFrontendService"
import { MockDataSource } from "../harness/mockDataSource"
import { MockUserQuery } from "../harness/repository/users/mockUserQuery"
import { MockBackendScenarioDelegate, MockFrontendScenarioDelegate } from "../harness/scenarioDelegate"
import { mockHandOverToBackend } from "../harness/mockHandOverToBackend"
import { Context, Courses, InteractResult, InteractResultType, NOCARE, Scenario, Scenes } from "@robustive/robustive-ts"
import { HelloScenes } from "@domain/usecases/application/hello"
import { Actor } from "@domain/actors"
import { AuthenticatedUser } from "@domain/actors/authenticatedUser"
import { Account } from "@domain/models/authentication/user"

describe(R.application.keys.hello, () => {
  const U = R.application.hello

  const resultMap = new Map<string, {
    frontend?: InteractResult<Requirements, "application", "hello", Actor, HelloScenes>,
    backend?: InteractResult<Requirements, "application", "hello", Actor, HelloScenes>
  }>()

  const mockBackend = <Z extends Scenes>(scenario: Scenario<Z>, actor: Actor, context: Context<Z>): Promise<Context<Z>> => {
    const req = {}
    const res = {}
    const dataSource = new MockDataSource()
    const choreography = createBackendHelloChoreography(
      dataSource,
      new MockUserQuery()
    )
    const { course, scene, ...associatedValues } = context
    console.info(`[B][TRIGGER] ${scenario.domain}.${scenario.usecase} (${scenario.id})`, associatedValues, actor)
    const usecase = (U[course as Courses] as any)[scene](associatedValues, scenario.id)
    usecase.set(new MockBackendScenarioDelegate<"application", "hello", HelloScenes>(choreography))
    return usecase.handleRequest(req, res, actor, (recursive: () => Promise<NOCARE>) => {
      return dataSource.asyncLocalStorage
        .run(dataSource.defaultState, () => {
          return recursive()
            .then((result) => {
              return dataSource.ensureClosed(`${scenario.domain}.${scenario.usecase} at robustiveHandler after recursive`)
                .then((_result) => {
                  if (_result.isErr()) {
                    console.error(_result.error)
                  }
                  return result
                })
            })
        })
    })
      .then((result: any) => {
        resultMap.set(scenario.id, { backend: result })
        console.info(`[B][COMPLETION] ${scenario.domain}.${scenario.usecase} (${scenario.id})`, result)
        if (result.type === InteractResultType.success) {
          return result.lastSceneContext
        }
        throw new Error("バックエンドでエラーが発生")
      })
  }

  const choreography = createFrontendHelloChoreography(
    createMockFrontendService(),
    mockHandOverToBackend(mockBackend)
  )

  describe("Nobody Actor", async () => {
    describe(U.keys.basics.ユーザはHelloを送る, async () => {
      const usecase = U.basics.ユーザはHelloを送る({ hello: "Test!" })
      const actor = new Nobody()

      usecase.set(new MockFrontendScenarioDelegate(choreography))

      console.info(
        `[F][TRIGGER] ${usecase.domain}.${usecase.name}.${usecase.course}.${usecase.scene} (${usecase.id})`
      )
      await usecase.interactedBy(actor)
        .then(result => {
          resultMap.set(usecase.id, { ...resultMap.get(usecase.id), frontend: result })
        })

      it(`should be "システムはActorを確認する,Nobodyの場合_システムは返事をする"`, () => {
        const result = resultMap.get(usecase.id)
        expect(result?.frontend?.type).toBe(InteractResultType.success)
        expect(result?.frontend?.performedScenario.map(s => s.scene).join(",")).toBe("ユーザはHelloを送る,Nobodyの場合_システムは返事をする")

        expect(result?.backend?.type).toBe(InteractResultType.success)
        expect(result?.backend?.performedScenario.map(s => s.scene).join(",")).toBe("ユーザはHelloを送る,システムはActorを確認する,Nobodyの場合_システムは返事をする")
        if (result?.backend?.type === InteractResultType.success) {
          expect(result?.backend?.lastSceneContext.reply).toBe("Hello Nobody!")
        }
      })
    })
  })

  describe("AuthenticatedUser Actor", async () => {
    describe(U.keys.basics.ユーザはHelloを送る, async () => {
      const usecase = U.basics.ユーザはHelloを送る({ hello: "Test!" })
      const account = Account.unsafeFrom({
        id: "019bee13-9046-765b-962e-e53d458ae646",
        role: "personal",
        usageStatus: 0,
        displayName: "斉藤 祐輔",
        name: {
          givenName: "祐輔",
          familyName: "斉藤",
        },
        email: "yusuke.saito@jibunstyle.com",
        photoUrl: "https://lh3.googleusercontent.com/a/ACg8ocIq2MUkJkFoXh4tL8zLH7wnWe6G9ENTz3DYBybii45YWka7Q2Wm=s96-c"
      })
      const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWJlZTEzLTkwNDYtNzY1Yi05NjJlLWU1M2Q0NThhZTY0NiIsInR5cCI6ImFjY2VzcyIsImlhdCI6MTc2OTg1NTgwOSwiZXhwIjoxNzY5ODU2NDA5fQ.8eagiy1k6EjCea6vrJ1ILqYIZYVW468d1HIr9cC9SAo"
      const actor = new AuthenticatedUser(account, accessToken)

      usecase.set(new MockFrontendScenarioDelegate(choreography))

      console.info(
        `[F][TRIGGER] ${usecase.domain}.${usecase.name}.${usecase.course}.${usecase.scene} (${usecase.id})`
      )
      await usecase.interactedBy(actor)
        .then(result => {
          resultMap.set(usecase.id, { ...resultMap.get(usecase.id), frontend: result })
        })

      it(`should be "システムはActorを確認する,AuthenticatedUserの場合_システムはトランザクションを開始する,システムはユーザ情報を取得する,システムはトランザクションをロールバックする,システムは返事をする"`, () => {
        const result = resultMap.get(usecase.id)
        expect(result?.frontend?.type).toBe(InteractResultType.success)
        expect(result?.frontend?.performedScenario.map(s => s.scene).join(",")).toBe("ユーザはHelloを送る,システムは返事をする")

        expect(result?.backend?.type).toBe(InteractResultType.success)
        expect(result?.backend?.performedScenario.map(s => s.scene).join(",")).toBe("ユーザはHelloを送る,システムはActorを確認する,AuthenticatedUserの場合_システムはトランザクションを開始する,システムはユーザ情報を取得する,システムはトランザクションをロールバックする,システムは返事をする")
        if (result?.backend?.type === InteractResultType.success) {
          expect(result?.backend?.lastSceneContext.reply).toBe("Hello 斉藤 祐輔!")
        }
      })
    })
  })
})