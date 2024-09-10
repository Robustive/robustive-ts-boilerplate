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

export interface ApplicationStore extends StoreComposable<ApplicationState, "application"> {}

export function useApplicationStore(): ApplicationStore {
  const state = reactive<ApplicationState>({
    drawerItems: [
      DrawerItem.subheader({ title: "Header1" }),
      DrawerItem.link({ title: "Home", href: "/" }),
      DrawerItem.link({ title: "Page1", href: "/page1" }),
      DrawerItem.link({ title: "Page2", href: "/page2" }),
      DrawerItem.link({ title: "Page3", href: "/page3" }),
      DrawerItem.divider(),
      DrawerItem.subheader({ title: "Header2" }),
      DrawerItem.group({
        title: "Menu Group",
        children: [
          DrawerItem.link({ title: "Home", href: "/group" }),
          DrawerItem.link({ title: "Page1", href: "/group/page1" }),
          DrawerItem.link({ title: "Page2", href: "/group/page2" }),
          DrawerItem.link({ title: "Page3", href: "/group/page3" })
        ]
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
        usecase.set(new ScenarioDelegate(createFrontendBootChoreography(service)))
        return usecase.interactedBy(actor).then((_) => {})
      },
      [R.application.keys.hello]: (
        usecase: Usecase<"application", "hello">,
        actor: Actor,
        service: FrontendService
      ): Promise<void> => {
        usecase.set(new ScenarioDelegate(createFrontendHelloChoreography(service)))
        return usecase.interactedBy(actor).then((_) => {})
      }
    }
  }
}
