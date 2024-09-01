import Main from "./views/Main.vue"
import Home from "./views/Home.vue"
import Page1 from "./views/Page1.vue"
import Page2 from "./views/Page2.vue"
import Page3 from "./views/Page3.vue"

export const routes = [
  {
    path: "/",
    component: Main,
    children: [
      { path: "", component: Home }
      /* path: "" と一緒に他の子を定義すると、その他の子が active な時、Homeも同時に active になってしまうので分けている   */
      // { path: "page1", component: Page1 },
      // { path: "page2", component: Page2 },
      // { path: "page3", component: Page3 }
    ]
  },
  {
    path: "/",
    component: Main,
    children: [
      { path: "page1", component: Page1 },
      { path: "page2", component: Page2 },
      { path: "page3", component: Page3 }
    ]
  },
  {
    path: "/group",
    component: Main,
    children: [{ path: "", component: Home }]
  },
  {
    path: "/group",
    component: Main,
    children: [
      { path: "page1", component: Page1 },
      { path: "page2", component: Page2 },
      { path: "page3", component: Page3 }
    ]
  }
]
