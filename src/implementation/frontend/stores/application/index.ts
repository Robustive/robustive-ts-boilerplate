import { R, Usecase } from "@domain/usecases"
import { Actor } from "@domain/actors"
import { State, StoreComposable } from "../../interfaces"
import { reactive } from "vue"
import { createFrontendBootChoreography } from "./boot"
import { createFrontendHelloChoreography } from "./hello"
import { DrawerItem } from "@presentation/components/drawer"
import { FrontendService } from ".."
import { ScenarioDelegate } from "@shared/scenarioDelegate"

export interface ApplicationState extends State {
  readonly drawerItems: DrawerItem[]
  readonly replyFromBackend: string | undefined
}

export interface ApplicationStore
  extends StoreComposable<ApplicationState, "application"> {}

export function useApplicationStore(): ApplicationStore {
  const state = reactive<ApplicationState>({
    drawerItems: [
      DrawerItem.header({ title: "Header1" }),
      DrawerItem.link({ title: "Menu1", href: "/menu1" }),
      DrawerItem.divider(),
      DrawerItem.header({ title: "Header2" }),
      DrawerItem.group({
        title: "Menu Group",
        children: Array<DrawerItem>()
      })
    ],
    replyFromBackend: undefined
  })

  return {
    state,
    actions: {
      [R.application.keys.boot]: (
        usecase: Usecase<"application", "boot">,
        actor: Actor,
        service: FrontendService
      ): Promise<void> => {
        usecase.set(
          new ScenarioDelegate(createFrontendBootChoreography(service))
        )
        return usecase.interactedBy(actor).then((_) => {})
      },
      [R.application.keys.hello]: (
        usecase: Usecase<"application", "hello">,
        actor: Actor,
        service: FrontendService
      ): Promise<void> => {
        usecase.set(
          new ScenarioDelegate(createFrontendHelloChoreography(service))
        )
        return usecase.interactedBy(actor).then((_) => {})
      }
    }
  }
}
