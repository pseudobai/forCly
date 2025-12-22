import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/home/index.vue"),
    },
    {
      path: "/test",
      name: "test",
      component: () => import("../views/test/index.vue"),
    },
    {
      path: "/agree",
      name: "agree",
      component: () => import("../views/agree/index.vue"),
    },
    {
      path: "/flowers",
      name: "flowers",
      component: () => import("../views/flowers/index.vue"),
    },
  ],
});

export default router;
