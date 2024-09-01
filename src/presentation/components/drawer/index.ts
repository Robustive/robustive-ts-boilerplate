import { Empty, SwiftEnum, SwiftEnumCases } from "robustive-ts"
import {
  RouteLocationAsRelativeGeneric,
  RouteLocationAsPathGeneric
} from "vue-router"
export const DrawerContentType = {
  subheader: "subheader",
  divider: "divider",
  link: "link",
  group: "group"
} as const

export type DrawerContentType =
  (typeof DrawerContentType)[keyof typeof DrawerContentType]

// これだと入力補完が利かないので
// type DrawerItems = {
//     [DrawerContentType.subheader]: { title: string };
//     [DrawerContentType.divider]: Empty;
//     [DrawerContentType.link]: { title: string; href: string };
//     [DrawerContentType.group]: { title: string, children: DrawerItems[] };
// };
// こうする
type DrawerItemContext = {
  subheader: { title: string }
  divider: Empty
  link: {
    title: string
    href: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric
  }
  group: { title: string; children: DrawerItem[] }
}

export const DrawerItem = new SwiftEnum<DrawerItemContext>()
export type DrawerItem = SwiftEnumCases<DrawerItemContext>
