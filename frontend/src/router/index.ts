import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/stories",
  },
  {
    path: "/stories",
    component: () => import("@/views/StoriesPage.vue"),
  },
  {
    path: "/story/new",
    component: () => import("@/views/NewStoryPage.vue"),
  },
  {
    path: "/story/:id",
    component: () => import("@/views/ReadStoryPage.vue"),
    children: [
      {
        path: "owners",
        component: () => import("@/views/OwnersTable.vue"),
        name: "owners",
      },
      {
        path: "read",
        component: () => import("@/views/ReadStory.vue"),
        name: "read",
      },
    ],
  },
  {
    path: "/story/:id/continue",
    component: () => import("@/views/ContinueStoryPage.vue"),
  },
  // {
  //   path: "/profile",
  //   component: () => import("@/views/ProfilePage.vue"),
  // },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
