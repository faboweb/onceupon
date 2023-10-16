<template>
  <div
    style="
      display: flex;
      justify-content: center;
      position: fixed;
      bottom: 2rem;
      width: 100%;
    "
  >
    <div
      style="
        display: flex;
        background: var(--second-color);
        padding: 0.5rem 2rem;
        justify-content: space-between;
        align-items: center;
        color: white;
        border-radius: 8px;
        max-width: 100%;
        width: 400px;
      "
    >
      <span
        :style="{
          opacity: route.path === '/overview' ? 1 : 0.6,
        }"
        @click="ionRouter.push('/overview')"
        style="cursor: pointer"
        >Explore</span
      >
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        "
        @click="ionRouter.push('/story/new')"
      >
        <div
          style="
            position: relative;
            top: -2rem;
            background: var(--main-color);
            border-radius: 8px;
            height: 43px;
            width: 43px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: -1.5rem;
            font-size: 30px;
          "
        >
          <ion-icon :icon="add"></ion-icon>
        </div>

        <span
          :style="{
            opacity: route.path === '/story/new' ? 1 : 0.6,
          }"
          >Create</span
        >
      </div>
      <span
        :style="{
          opacity:
            route.path === '/profile/' + authStore.user?.address ? 1 : 0.6,
        }"
        @click="clickProfile()"
        style="cursor: pointer"
        >Profile</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIonRouter, IonIcon } from "@ionic/vue";
import { add } from "ionicons/icons";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../store";
const route = useRoute();
const ionRouter = useRouter();
const authStore = useAuthStore();

const clickProfile = () => {
  if (!authStore.isSignedIn) {
    authStore.showSignInModal = true;
  } else {
    ionRouter.push("/profile/" + authStore.user?.address);
  }
};
</script>

<style>
</style>