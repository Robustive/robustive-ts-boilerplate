import { createBackendSignInChoreography } from "@backend/behaviors/authentication/signIn"
import { EventBus } from "@backend/eventBus"
import { ScenarioDelegate } from "@backend/scenarioDelegate"
import { DataSource } from "@dependencies/postgres"
import { PgUserCommand } from "@dependencies/postgres/repositories/users/userCommand"
import { PgUserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { IdentityProviderType } from "@domain/models/authentication"
import { R } from "@domain/usecases"
import { SignInScenes } from "@domain/usecases/authentication/signIn"
import { RequestHandler } from "express"
import { NOCARE } from "@robustive/robustive-ts"
import { HandleResultType, ResponseStatus } from "@robustive/robustive-ts-express"
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import { JwtSessionManager } from "@backend/sessionManagers/jwtSessionManager"

/**
 * Google OAuth によるコールバックで呼ばれる
 */
export function signInHandler<Context, Client>(
  providerType: IdentityProviderType,
  dataSource: DataSource<Context, Client>
): RequestHandler {

  return (req, res, next) => {
    const actor = req.session?.appSession?.actor

    if (!actor) {
      return next(new SystemError(SystemErrorCode.unreachable({ reason: "restoreAppSessionAndActor で設定されていないとおかしい" })))
    }

    const usecase = ((providerType: IdentityProviderType) => {
      // ip が増えたら分岐
      return R.authentication.signIn.basics.Googleからリダイレクトされた場合_システムはアプリセッションを開始する()
    })(providerType)

    console.info(`[TRIGGER] authentication.signIn`, { course: usecase.course, scene: usecase.scene }, actor)

    usecase.set(
      new ScenarioDelegate<"authentication", "signIn", SignInScenes>(
        createBackendSignInChoreography(
          dataSource,
          () => new Date(),
          new JwtSessionManager(new PgUserQuery()),
          new PgUserQuery(),
          new PgUserCommand()
        )
      )
    )

    return usecase.handleRequest(req, res, actor, (recursive: () => Promise<NOCARE>) => {
      return dataSource.asyncLocalStorage
        .run(dataSource.defaultState, () => {
          return recursive()
            .then((result) => {
              return dataSource.ensureClosed("robustiveHandler after recursive")
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
        console.info("[COMPLETION] authentication.signIn", result)
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