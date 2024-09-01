import { R } from "@domain/usecases"
import { SignInStatus } from "@domain/models/authentication/user"
import { SERVICE_KEY, createFrontendService } from "@frontend/stores"
import { setHandOverSettings } from "@frontend/common"

import App from "./App.vue"

import { createApp } from "vue"
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
  const service = createFrontendService(router)
  app.provide(SERVICE_KEY, service)

  /* Setup for Routing */
  router.beforeEach((to, from) => {
    if (
      service.states.shared.routeLocation !== to.path &&
      service.states.shared.routeLocation === from.path
    ) {
      console.warn(
        "RouteLocation was changed directly, e.g. from <v-list-item :to='...'/>, the address bar or browser back (current:",
        from.path,
        "--->",
        to.path,
        ")."
      )
      service.actions.navigateTo(to.path, true)
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
