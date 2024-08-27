import Main from "./views/Main.vue"
import Home from "./views/Home.vue"

export const routes = [
  {
    path: "/",
    component: Main,
    children: [{ path: "", component: Home }]
  }
]
