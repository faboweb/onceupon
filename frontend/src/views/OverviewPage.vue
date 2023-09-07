<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-header>
      <ion-toolbar>
        <span
          slot="start"
          style="cursor: pointer"
          @click="router.push('/overview')"
        >
          Hello<br />
          <b v-if="authStore.user">{{
            authStore.user?.name ? "" + authStore.user?.name : ""
          }}</b>
          <b
            v-else
            @click="authStore.showSignInModal = true"
            style="cursor: pointer"
            >Sign In</b
          >
        </span>
        <div slot="end">
          <votes-indicator />
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-router-outlet />

      <mobile-footer style="margin-top: 4rem" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonToolbar,
  IonHeader,
  IonRouterOutlet,
} from "@ionic/vue";
import { onMounted } from "vue";
import { useStoryStore } from "@/store/story";
import { useAuthStore } from "../store";
import MobileFooter from "../components/overview/MobileFooter.vue";
import VotesIndicator from "../components/VotesIndicator.vue";
import { useRouter } from "vue-router";

const storyStore = useStoryStore();
const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await storyStore.loadStories();
});
</script>
<style scoped>
</style>
