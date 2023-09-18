<template>
  <overview-page-wrapper>
    <ion-page>
      <ion-content>
        <ion-badge
          v-if="['twitter', 'google'].includes(authStore.signInMethod)"
          style="white-space: break-spaces; margin-bottom: 1rem"
        >
          You are currently signed in with a Web2 account. OnceUpon manages your
          account. You will soon be able to convert your account to a Web3
          account.
        </ion-badge>
        <!-- <iframe :hidden="!configStore.showVideo" width="100%" height="315" src="https://www.youtube.com/embed/TT7CIizVjPg?controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      <small style="float: right; cursor: pointer; color: rgb(115,115,115);" @click="configStore.setConfig('showVideo', !configStore.showVideo)">{{configStore.showVideo ? 'Hide' : 'Show'}} video</small> -->

        <top-stories style="margin-top: 1.5rem" />
        <top-authors style="margin-top: 1.5rem" />
        <continue-reading style="margin-top: 1.5rem" />
      </ion-content>
    </ion-page>
  </overview-page-wrapper>
</template>

<script setup lang="ts">
import { IonBadge, IonPage, IonContent } from "@ionic/vue";
import TopStories from "@/components/overview/TopStories.vue";
import TopAuthors from "@/components/overview/TopAuthors.vue";
import ContinueReading from "@/components/overview/ContinueReading.vue";
import { useAuthStore } from "../../store";
import OverviewPageWrapper from "../OverviewPageWrapper.vue";

const authStore = useAuthStore();
</script>

<style>
</style>