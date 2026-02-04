import Main from "./views/Main.vue"
import Home from "./views/Home.vue"
import Profile from "./views/Profile.vue"
import ProfileEdit from "./views/ProfileEdit.vue"
import { RouteRecordRaw } from "vue-router"
import { PageId } from "@domain/models/authentication/authorization"

export const Views: { [key in PageId]: RouteRecordRaw } = {
  [PageId.Main]: { name: PageId.Main, path: "/", component: Main },
  [PageId.Home]: { name: PageId.Home, path: "", component: Home },
  [PageId.Profile]: { name: PageId.Profile, path: "profile", component: Profile },
  [PageId.ProfileEdit]: { name: PageId.ProfileEdit, path: "profile/edit", component: ProfileEdit }
} as const

export type ViewNames = keyof typeof Views

export const routes = [
  {
    ...Views.Main,
    children: [Views.Home, Views.Profile, Views.ProfileEdit]
  }
  // { path: "/signin", component: SignIn },
  // { path: "/signup", component: SignUp }
]
