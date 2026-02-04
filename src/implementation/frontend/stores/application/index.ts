import { R } from "@domain/usecases"
import { State, StoreComposable } from "../../interfaces"
import { reactive } from "vue"
import { createFrontendBootChoreography } from "./boot"
import { createFrontendHelloChoreography } from "./hello"
import { DrawerItem } from "@presentation/components/drawer"

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

  // const acces = Object.keys(R.application.keys).reduce((actions, usecase) => {
  //   actions[usecase] = usecase
  //   return actions
  // }, {} as Actions<"application">)

  return {
    state,
    choreographies: {
      [R.application.keys.boot]: createFrontendBootChoreography,
      [R.application.keys.hello]: createFrontendHelloChoreography
    }
  }
}
