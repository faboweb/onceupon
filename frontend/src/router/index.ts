import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: () => import("@/views/OverviewPage.vue"),
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
        component: () => import("@/views/story/OwnersTable.vue"),
        name: "owners",
      },
      {
        path: "read",
        component: () => import("@/views/story/ReadStory.vue"),
        name: "read",
      },
      {
        path: "proposals",
        component: () => import("@/views/story/ProposalsOverview.vue"),
        name: "proposals",
      },
      {
        path: "nfts",
        component: () => import("@/views/story/NftOverview.vue"),
        name: "nfts",
      },
    ],
  },
  {
    path: "/story/:id/continue",
    component: () => import("@/views/ContinueStoryPage.vue"),
  },
  {
    path: "/profile/:address",
    component: () => import("@/views/ProfilePage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
