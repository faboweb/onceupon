<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-header style="box-shadow: none">
      <ion-toolbar style="height: 40px">
        <a
          slot="start"
          style="margin-left: 1rem; cursor: pointer"
          @click="router.push('/')"
        >
          {{ "<" }} Back
        </a>
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
          overflow: 'hidden',
        }"
      />
      <div style="position: initial; height: calc(100% - 155px)">
        <div slot="top" class="tab-bar">
          <router-link :to="'/story/' + storyId + '/read'">
            <ion-button
              class="font-sm"
              fill="clear"
              :class="{
                active: route.path.startsWith('/story/' + storyId + '/read'),
              }"
              @click.passive="scrollOffset = 0"
            >
              <ion-label>Story</ion-label>
            </ion-button>
          </router-link>

          <router-link :to="'/story/' + storyId + '/proposals'">
            <ion-button
              class="font-sm"
              fill="clear"
              :class="{
                active: route.path.startsWith(
                  '/story/' + storyId + '/proposals'
                ),
              }"
              @click.passive="scrollOffset = 0"
            >
              <ion-label>Proposals</ion-label>
            </ion-button>
          </router-link>

          <router-link :to="'/story/' + storyId + '/nfts'">
            <ion-button
              class="font-sm"
              fill="clear"
              :class="{
                active: route.path.startsWith('/story/' + storyId + '/nfts'),
              }"
              @click.passive="scrollOffset = 0"
            >
              <ion-label>NFTs</ion-label>
            </ion-button>
          </router-link>

          <router-link :to="'/story/' + storyId + '/owners'">
            <ion-button
              class="font-sm"
              fill="clear"
              :class="{
                active: route.path.startsWith('/story/' + storyId + '/owners'),
              }"
              @click.passive="scrollOffset = 0"
            >
              <ion-label>Owners</ion-label>
            </ion-button>
          </router-link>
        </div>

        <router-view
          :style="{
            height: `calc(100% + ${160 - offset}px)`,
          }"
        />
      </div>
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
  useIonRouter,
  IonHeader,
  IonToolbar,
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
  return scrollOffset.value > 160 ? 0 : 160 - scrollOffset.value;
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
    router.push("/");
    return;
  }
  voteStore.loadVotes(storyId);

  story.value.sections.forEach((proposal) => {
    nameStore.getName(proposal.proposer);
  });

  listenScroll("story", (event) => {
    scrollOffset.value = event.detail.scrollTop;
  });
});
</script>
<style lang="scss" scoped>
.active {
  border-bottom: 2px solid black;
  font-weight: 700;
  color: black;
}
ion-tab-button::part(native):hover {
  color: var(--main-color) !important;
}
ion-button {
  font-weight: normal;
  color: black !important;
  border-radius: 0;
  width: 100%;

  --background: transparent;
  --border-radius: none;

  button {
    width: 100%;
  }
}
.tab-bar {
  background: #fffdf2;
  z-index: 10000;
  height: 40px;
  padding-left: 4rem;
  padding-right: 4rem;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid
    var(
      --ion-tab-bar-border-color,
      var(--ion-border-color, var(--ion-color-step-150, rgba(0, 0, 0, 0.07)))
    );
  justify-content: center;
  padding-left: 4rem;
  padding-right: 4rem;

  > * {
    flex: 1;
  }
}
</style>