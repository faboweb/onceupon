<template>
  <div
    style="width: 288px; flex: 1"
    :style="{
      width: extended ? 'auto' : '288px',
    }"
    class="story-element"
  >
    <div style="flex-direction: row; display: flex; padding: 0">
      <story-nft-preview :nfts="story.top_nfts" :extended="extended" />
      <div
        class="card"
        style="
          display: inline-block;
          height: 123px;
          margin-top: 14px;
          width: 100%;
          border-radius: 0 4px 4px 0;
        "
      >
        <b class="font-sm" style="white-space: nowrap">
          {{ story.name || "No title" }}
        </b>
        <div
          class="font-secondary"
          style="
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
        <p class="font-sm" style="max-height: 50px; margin-top: 0.5rem">
          {{ story.summary?.substr(0, extended ? 300 : 140) || "Loading" }}...
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
// import { formatDistance } from "date-fns";
import { useStoryStore } from "@/store";
import {
  IonIcon,
  IonCard,
  IonCardContent,
  IonCol,
  IonChip,
  IonLabel,
} from "@ionic/vue";
import StoryNftPreview from "./StoryNftPreview.vue";

const props = defineProps<{ story: any; extended?: boolean }>();

// const time = (story) => {
//   if (!story.lastUpdate) return "";
//   return formatDistance(new Date(story.lastUpdate), new Date(), {
//     addSuffix: true,
//   });
// };
</script>

<style scoped lang="scss">
.story-element {
  &:hover {
    filter: saturate(120%);
    .card {
      background: rgba(217, 217, 217, 0.4);
    }
  }
}
</style>
