<template>
  <ion-page>
    <ion-header style="box-shadow: none">
      <ion-toolbar style="--border-color: none; height: 40px">
        <span
          slot="start"
          style="margin-left: 1rem; cursor: pointer"
          @click="router.push('/')"
        >
          {{ "<" }} Back
        </span>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding" scroll-y="false">
      <story-header :story="overviewStory" />
      <!-- Listen to before and after tab change events -->
      <ion-tabs
        style="position: initial; margin-top: 1rem; height: calc(100% - 130px)"
      >
        <ion-tab-bar
          slot="top"
          style="height: 40px; padding-left: 4rem; padding-right: 4rem"
        >
          <ion-tab-button
            style="font-size: 14px"
            tab="read"
            :class="{
              active: route.path === '/story/' + storyId + '/read',
            }"
            :href="'/story/' + storyId + '/read'"
          >
            <ion-label>Story</ion-label>
          </ion-tab-button>

          <ion-tab-button
            style="font-size: 14px"
            tab="proposals"
            :class="{
              active: route.path === '/story/' + storyId + '/proposals',
            }"
            :href="'/story/' + storyId + '/proposals'"
          >
            <ion-label>Proposals</ion-label>
          </ion-tab-button>

          <ion-tab-button
            style="font-size: 14px"
            tab="nfts"
            :class="{
              active: route.path === '/story/' + storyId + '/nfts',
            }"
            :href="'/story/' + storyId + '/nfts'"
          >
            <ion-label>NFTs</ion-label>
          </ion-tab-button>

          <ion-tab-button
            style="font-size: 14px"
            tab="owners"
            :class="{
              active: route.path === '/story/' + storyId + '/owners',
            }"
            :href="'/story/' + storyId + '/owners'"
          >
            <ion-label>Owners</ion-label>
          </ion-tab-button>
        </ion-tab-bar>

        <!-- Use v-slot:bottom with Vue ^2.6.0 -->
        <ion-router-outlet></ion-router-outlet>
      </ion-tabs>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonTabBar,
  IonTabs,
  IonTabButton,
  IonLabel,
  IonRouterOutlet,
  loadingController,
} from "@ionic/vue";
import { computed, onMounted, ref, Ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNameStore, useStoryStore } from "../store";
import StoryHeader from "../components/story/StoryHeader.vue";

const storyStore = useStoryStore();
const nameStore = useNameStore();

const route = useRoute();
const router = useRouter();

const storyId = String(route?.params.id);
const story: Ref<any> = ref(null);

const overviewStory = computed(() => {
  return storyStore.stories.find((s) => s.id === storyId);
});

const loadData = async () => {
  loadData();
};

onMounted(async () => {
  try {
    storyStore.loadStories();
    story.value = await storyStore.getStory(storyId);
  } catch (error) {
    console.error(error);
    router.push("/stories");
    return;
  }
  storyStore.loadVotes(storyId);

  story.value.sections.forEach((proposal) => {
    nameStore.getName(proposal.proposer);
  });
});
</script>
<style>
.tab-selected {
  border-bottom: 2px solid black;
  font-weight: 700;
  color: black;
}
</style>
