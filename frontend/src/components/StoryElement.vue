<template>
  <div
    style="display: inline-block; width: 288px; flex: 1; margin-bottom: 1rem"
    :style="{
      width: extended ? 'auto' : '288px',
    }"
  >
    <div style="flex-direction: row; display: flex; padding: 0">
      <story-nft-preview :nfts="story.top_nfts" :extended="extended" />
      <div
        style="
          display: inline-block;
          height: 123px;
          margin-top: 14px;
          width: 185px;
          background: rgba(217, 217, 217, 0.2);
          border-radius: 0 4px 4px 0;
          padding: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
        "
        :style="{
          width: story.top_nfts.length > 0 ? 'calc(100% - 101px)' : '100%',
        }"
      >
        <b style="margin-bottom: 0.2rem; font-size: 14px; white-space: nowrap">
          {{ story.name || "No title" }}
        </b>
        <div
          style="
            font-size: 14px;
            color: rgba(0, 0, 0, 0.4);
            display: block;
            text-align: left;
            display: flex;
            align-items: center;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
          "
        >
          <ion-icon :icon="heart" style="margin-right: 0.2rem"></ion-icon>

          <span>{{ story.likes }}</span>

          <ion-icon
            :icon="documents"
            style="margin-right: 0.2rem; margin-left: 0.5rem"
          ></ion-icon>

          <span>{{ story.sections }}</span>
          <ion-icon
            :icon="people"
            style="margin-right: 0.2rem; margin-left: 0.5rem"
          ></ion-icon>

          <span>{{ story.owners }}</span>
          <ion-icon
            :icon="checkmarkDoneCircle"
            style="margin-right: 0.2rem; margin-left: 0.5rem"
          ></ion-icon>

          <span>{{ story.proposals }}</span>
        </div>
        <p
          style="
            text-align: left;
            white-space: pre-wrap;
            text-overflow: ellipsis;
            overflow: hidden;
            max-height: 44px;
            font-size: 12px;
          "
        >
          {{ content?.substr(0, extended ? 300 : 140) || "Loading" }}...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import {
  listOutline,
  eyeOutline,
  documentOutline,
  heartOutline,
  people,
  checkmarkDoneCircle,
  documents,
  heart,
} from "ionicons/icons";
import { formatDistance } from "date-fns";
import { useNameStore, useStoryStore } from "@/store";
import {
  IonIcon,
  IonCard,
  IonCardContent,
  IonCol,
  IonChip,
  IonLabel,
} from "@ionic/vue";
import StoryNftPreview from "./StoryNftPreview.vue";

const nameStore = useNameStore();
const storyStore = useStoryStore();

const props = defineProps<{ story: any; extended?: boolean }>();

const time = (story) => {
  if (!story.lastUpdate) return "";
  return formatDistance(new Date(story.lastUpdate), new Date(), {
    addSuffix: true,
  });
};

const name = computed(() => nameStore.name(props.story.creator));
const content = computed(
  () => storyStore.cidLookup[props.story.first_section.content_cid]
);
</script>

<style scoped>
</style>
