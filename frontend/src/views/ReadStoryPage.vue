<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-header style="box-shadow: none">
      <ion-toolbar style="--border-color: none; height: 40px">
        <router-link to="/overview">
          <a slot="start" style="margin-left: 1rem; cursor: pointer">
            {{ "<" }} Back
          </a>
        </router-link>
        <div slot="end">
          <votes-indicator />
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding" :scroll-y="false">
      <story-header
        :story="overviewStory"
        ref="storyHeader"
        :style="{
          height: offset + 'px',
        }"
      />
      <!-- Listen to before and after tab change events -->
      <ion-tabs
        style="position: initial; margin-top: 1rem; height: calc(100% - 155px)"
      >
        <ion-tab-bar
          slot="top"
          style="height: 40px; padding-left: 4rem; padding-right: 4rem"
        >
          <ion-tab-button
            class="font-sm"
            tab="read"
            :class="{
              active: route.path === '/story/' + storyId + '/read',
            }"
            :href="'/story/' + storyId + '/read'"
            @click.passive="scrollOffset = 0"
          >
            <ion-label>Story</ion-label>
          </ion-tab-button>

          <ion-tab-button
            class="font-sm"
            tab="proposals"
            :class="{
              active: route.path === '/story/' + storyId + '/proposals',
            }"
            :href="'/story/' + storyId + '/proposals'"
            @click.passive="scrollOffset = 0"
          >
            <ion-label>Proposals</ion-label>
          </ion-tab-button>

          <ion-tab-button
            class="font-sm"
            tab="nfts"
            :class="{
              active: route.path === '/story/' + storyId + '/nfts',
            }"
            :href="'/story/' + storyId + '/nfts'"
            @click.passive="scrollOffset = 0"
          >
            <ion-label>NFTs</ion-label>
          </ion-tab-button>

          <ion-tab-button
            class="font-sm"
            tab="owners"
            :class="{
              active: route.path === '/story/' + storyId + '/owners',
            }"
            :href="'/story/' + storyId + '/owners'"
            @click.passive="scrollOffset = 0"
          >
            <ion-label>Owners</ion-label>
          </ion-tab-button>
        </ion-tab-bar>

        <!-- Use v-slot:bottom with Vue ^2.6.0 -->
        <ion-router-outlet
          :style="{
            height: `calc(100% + ${160 - offset}px)`,
          }"
        ></ion-router-outlet>
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
} from "@ionic/vue";
import { computed, onMounted, ref, Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNameStore, useStoryStore } from "../store";
import StoryHeader from "../components/story/StoryHeader.vue";
import VotesIndicator from "../components/VotesIndicator.vue";
import { useVotesStore } from "../store/votes";
// import { useScroll } from "@vueuse/core";
import { listenScroll } from "@/scripts/scroll";

const storyStore = useStoryStore();
const nameStore = useNameStore();
const voteStore = useVotesStore();

const route = useRoute();
const router = useRouter();
const scrollOffset = ref(0);

const offset = computed(() => {
  return scrollOffset.value > 120 ? 40 : 160 - scrollOffset.value;
});

const storyId = String(route?.params.id);
const story: Ref<any> = ref(null);
const storyHeader = ref();

const overviewStory = computed(() => {
  return storyStore.stories.find((s) => s.id === storyId);
});

onMounted(async () => {
  try {
    storyStore.loadStories();
    story.value = await storyStore.getStory(storyId);
  } catch (error) {
    console.error(error);
    router.push("/overview");
    return;
  }
  voteStore.loadVotes(storyId);

  story.value.sections.forEach((proposal) => {
    nameStore.getName(proposal.proposer);
  });

  listenScroll("story/read", (event) => {
    scrollOffset.value = event.detail.scrollTop;
  });
});
</script>
<style lang="scss" scoped>
.tab-selected {
  border-bottom: 2px solid black;
  font-weight: 700;
  color: black;
}
ion-tab-button::part(native):hover {
  color: var(--main-color) !important;
}
</style>