import { RequestHandler } from "express"
import { Actor } from "@domain/actors"
import { DomainKeys, R } from "@domain/usecases"
import { createBackendBootChoreography } from "@backend/behaviors/applications/boot"
import { createBackendHelloChoreography } from "@backend/behaviors/applications/hello"
import { ScenarioDelegate } from "@backend/scenarioDelegate"
import { Courses, NOCARE } from "@robustive/robustive-ts"
import { HandleResultType, ResponseStatus } from "@robustive/robustive-ts-express"
import { createBackendSignOutChoreography } from "@backend/behaviors/authentication/signOut"
import { HttpMethod } from "@shared/interfaces"
import { DataSource } from "@dependencies/postgres"
import { PgUserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import { EventBus } from "@backend/eventBus"
import { JwtSessionManager } from "@backend/sessionManagers/jwtSessionManager"

export type ContextParams = {
  domain: DomainKeys
  usecase: string
  course: Courses
  scene: string
  associatedValues: Record<string, unknown>
}

export type RobustiveContext = {
  requestId: string
  scenarioId: string
  context: ContextParams
  actor: Actor

  // 便利枠：ログ/トレース/計測など
  startedAt: number

  // 例：下流層に渡したい依存（logger/db等）
  dependencies: {
    logger: (msg: string, extra?: Record<string, unknown>) => void
  }
}

declare global {
  namespace Express {
    interface Request {
      context?: RobustiveContext
    }
  }
}

export function robustiveHandler<Context, Client>(
  dataSource: DataSource<Context, Client>
): RequestHandler {

  const domainChoreographiesMap = {
    [R.keys.application]: {
      [R.application.keys.boot]: createBackendBootChoreography(
        new JwtSessionManager(new PgUserQuery()),
        EventBus.shared,
        new PgUserQuery()
      ),
      [R.application.keys.hello]: createBackendHelloChoreography(dataSource, new PgUserQuery())
    },
    [R.keys.authentication]: {
      [R.authentication.keys.signOut]: createBackendSignOutChoreography()
    }
  }

  return (req, res, next) => {
    const { domain, usecase, course, scene } = req.params as Partial<ContextParams>
    const { id, ..._associatedValues } = req.method === HttpMethod.GET ? req.query : req.body

    // サインイン済みの場合、req.session.user が設定されている
    const actor = req.session?.appSession?.actor

    if (!actor) {
      return next(new SystemError(SystemErrorCode.unreachable({ reason: "restoreAppSessionAndActor で設定されていないとおかしい" })))
    }

    const courseSelector = R[domain][usecase] // as CourseSelector<R, D, U>
    const scenarioFactory = courseSelector[course] // as ScenarioFactory<R, D, U, C>
    const associatedValues = domain === "application" && usecase === "boot"
      ? { ..._associatedValues, session: { ...req.session } }
      : { ..._associatedValues }
    const _usecase = scenarioFactory[scene](associatedValues, id)

    console.info(`[TRIGGER] ${domain}.${usecase} (${id})`, associatedValues, actor)

    const choreography = domainChoreographiesMap[domain][usecase]
    _usecase.set(new ScenarioDelegate(choreography))

    return _usecase.handleRequest(req, res, actor, (recursive: () => Promise<NOCARE>) => {
      return dataSource.asyncLocalStorage
        .run(dataSource.defaultState, () => {
          return recursive()
            .then((result) => {
              return dataSource.ensureClosed(`${domain}.${usecase} at robustiveHandler after recursive`)
                .then((_result) => {
                  if (_result.isErr()) {
                    console.error(_result.error)
                  }
                  return result
                })
            })
        })
    })
      .then((result) => {
        console.info(`[COMPLETION] ${domain}.${usecase} (${id})`, result)
        if (result.type === HandleResultType.success) {
          const response = result.lastSceneContext
          if (response.status && response.status.case === ResponseStatus.keys.responded) {
            return res.end()
          }
          return res.status(response.status?.statusCode || 200).send(response)

        } else {
          return res.status(500).send()
        }
      })
  }
}