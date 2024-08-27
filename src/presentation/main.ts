import { R } from "@domain/usecases"
import { SignInStatus } from "@domain/models/authentication/user"
import { SERVICE_KEY, createFrontendService } from "@frontend/stores"
import { setHandOverSettings } from "@frontend/common"

import App from "./App.vue"

import { createApp, watch } from "vue"
import { loadRouter } from "./plugins/vueRouter"
import { loadVuetify } from "./plugins/vuetify"
import { config } from "@shared/config"

setHandOverSettings({
  url: `http://localhost:3001/${config.BACKEND_GLOBAL_PREFIX}`
})
const app = createApp(App)
const router = loadRouter(app)
loadVuetify(app)

router.isReady().then(() => {
  const initialPath = router.currentRoute.value.path
  const service = createFrontendService(initialPath)
  app.provide(SERVICE_KEY, service)

  /* Setup for Routing */
  watch(
    () => service.states.shared.routeLocation,
    (newValue, oldValue) => {
      console.info("★☆★☆★ RouteLocation:", oldValue, "--->", newValue)
      router.replace(newValue).finally(() => {
        service.actions.stopLoading()
      })
    }
  )

  router.beforeEach((to, from) => {
    if (
      service.states.shared.routeLocation !== to.path &&
      service.states.shared.routeLocation === from.path
    ) {
      console.warn(
        "!!!!! RouteLocation was changed directly by the user, e.g. from the address bar.",
        from.path,
        "--->",
        to.path
      )
      service.actions.routingTo(to.path)
      return false
    }
    return true
  })

  if (service.states.shared.signInStatus.case === SignInStatus.keys.unknown) {
    service.actions
      .dispatch(R.application.boot.basics.ユーザはサイトを開く())
      .catch((e) => console.error(e))
  }

  app.mount("#app")
})
