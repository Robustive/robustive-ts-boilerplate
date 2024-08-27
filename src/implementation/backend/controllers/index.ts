import { Actor } from "@domain/actors"
import { DomainKeys, R, Requirements, Usecase } from "@domain/usecases"
import { Context, StringKeyof } from "robustive-ts"
import { Express, Request } from "express"
import {
  DomainActionsMap,
  HandOverContext,
  VariousPatterns
} from "@backend/interfaces"
import { Account } from "@domain/models/authentication/user"
import { AuthenticatedUser } from "@domain/actors/authenticatedUser"
import { Nobody } from "@domain/actors/nobody"
import { BootScenes } from "@domain/usecases/application/boot"
import { stepThoughUntil } from "@backend/common"
import { HelloScenes } from "@domain/usecases/application/hello"
import { createBackendBootBehavior } from "@backend/applications/boot"

import { createBackendSignInBehavior } from "@backend/authentication/signIn"
import { SignInScenes } from "@domain/usecases/authentication/signIn"
import { ExRequest } from "@backend/main"
import { config } from "@shared/config"
import { createBackendSignOutBehavior } from "@backend/authentication/signOut"
import { ScenarioDelegate } from "@shared/scenarioDelegate"
import { createBackendHelloBehavior } from "@backend/applications/hello"

export function createBackendService(app: Express) {
  const domainActionsMap: DomainActionsMap = {
    [R.keys.application]: {
      [R.application.keys.boot]: (
        usecase: Usecase<"application", "boot">,
        actor: Actor
      ): Promise<Context<BootScenes>> => {
        usecase.set(new ScenarioDelegate(createBackendBootBehavior))
        return usecase.progress(actor)
      },
      [R.application.keys.hello]: (
        usecase: Usecase<"application", "hello">,
        actor: Actor
      ): Promise<Context<HelloScenes>> => {
        usecase.set(new ScenarioDelegate(createBackendHelloBehavior))
        return stepThoughUntil<HelloScenes>(
          "goals",
          R.application.hello.keys.goals
            .フロントエンドはバックエンドから返事を受け取る,
          usecase,
          actor
        )
      }
    },
    [R.keys.authentication]: {
      [R.authentication.keys.signIn]: (
        usecase: Usecase<"authentication", "signIn">,
        actor: Actor
      ): Promise<Context<SignInScenes>> => {
        usecase.set(new ScenarioDelegate(createBackendSignInBehavior))
        return usecase.progress(actor)
      },
      [R.authentication.keys.signOut]: (
        usecase: Usecase<"authentication", "signOut">,
        actor: Actor
      ): Promise<Context<SignInScenes>> => {
        usecase.set(new ScenarioDelegate(createBackendSignOutBehavior))
        return usecase.progress(actor)
      }
    }
  }

  const dispatch = <
    D extends DomainKeys,
    U extends StringKeyof<Requirements[D]>
  >(
    usecase: Usecase<D, U>,
    actor?: Actor
  ): Promise<Context<VariousPatterns>> => {
    const action = domainActionsMap[usecase.domain][usecase.name]
    return action(usecase, actor)
  }

  app.get(
    `/${config.BACKEND_GLOBAL_PREFIX}/domain/:domain/usecase/:usecase/course/:course/scene/:scene`,
    (req: Request<HandOverContext>, res) => {
      const { domain, usecase, course, scene } = req.params
      const { id, ...associatedValues } = req.query

      const actor = ((user: Account | undefined): Actor => {
        return user ? new AuthenticatedUser(user) : new Nobody()
      })(req.user)

      // CourseSelector<Requirements, D, StringKeyof<Requirements[D]>>
      const courseSelector = R[domain][usecase]
      // Usecase<D, StringKeyof<Requirements[D]>>
      const scenario = courseSelector[course][scene](
        domain === "application" && usecase === "boot"
          ? { ...associatedValues, session: { ...req.session } }
          : { ...associatedValues },
        id,
        true
      )

      console.info(
        `[DISPATCH] ${domain}.${usecase} (${id})`,
        associatedValues,
        actor
      )

      return dispatch(scenario, actor).then((result) => {
        delete (req as ExRequest<HandOverContext>).session.hasError
        return res.send(result)
      })
    }
  )
}
