import { App } from "vue"
import { createRouter, createWebHashHistory, Router } from "vue-router"
import { routes } from ".."

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export function loadRouter(app: App<Element>): Router {
  app.use(router)
  return router
}
