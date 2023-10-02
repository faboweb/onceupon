<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-header>
      <ion-toolbar>
        <span
          slot="start"
          style="cursor: pointer"
          @click="() => router.replace('/')"
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
        <ion-title
          v-if="title"
          style="
            text-align: center;
            margin-left: auto;
            margin-right: auto;
            display: block;
          "
          >{{ title }}</ion-title
        >
        <div slot="end">
          <votes-indicator />
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <slot />

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
  useIonRouter,
} from "@ionic/vue";
import { onMounted, defineProps } from "vue";
import { useStoryStore } from "@/store/story";
import { useAuthStore } from "../store";
import MobileFooter from "../components/overview/MobileFooter.vue";
import VotesIndicator from "../components/VotesIndicator.vue";

const storyStore = useStoryStore();
const authStore = useAuthStore();
const router = useIonRouter();

const props = defineProps({
  title: String,
});

onMounted(async () => {
  await storyStore.loadStories();
});
</script>
