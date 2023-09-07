<template>
  <div style="flex-direction: row; display: flex; padding: 0">
    <story-nft-preview
      :nfts="story.top_nfts"
      :extended="true"
      v-if="story?.top_nfts.length > 0"
    />
    <ion-skeleton-text
      style="width: 124px; height: 124px"
      v-else
      :animated="!story"
    />
    <div style="display: flex; flex-direction: column; margin-left: 1rem">
      <template v-if="story">
        <b class="font-lg" style="margin-bottom: 0.5rem">{{ story.name }}</b>
        <div class="story-info-row font-secondary">
          <ion-icon :icon="heartOutline" style="margin-right: 4px"></ion-icon>

          <b style="margin-right: 4px; color: black">{{ story.likes || 0 }}</b>
          <span>Likes</span>
        </div>
        <div class="story-info-row font-secondary">
          <ion-icon :icon="listOutline" style="margin-right: 4px"></ion-icon>

          <b style="margin-right: 4px; color: black">{{ story.sections }}</b>
          <span>Sections</span>
        </div>
        <div class="story-info-row font-secondary">
          <ion-icon :icon="eyeOutline" style="margin-right: 4px"></ion-icon>

          <b style="margin-right: 4px; color: black">{{ story.owners }}</b>
          <span>Owners</span>
        </div>
        <div class="story-info-row font-secondary">
          <ion-icon
            :icon="documentOutline"
            style="margin-right: 4px"
          ></ion-icon>

          <b style="margin-right: 4px">{{ story.proposals }}</b>
          <span>Proposals</span>
        </div>
      </template>
      <template v-else>
        <ion-skeleton-text
          style="width: 200px; height: 20px; margin-bottom: 0.5rem"
          :animated="true"
        />
        <ion-skeleton-text
          style="width: 100px; height: 20px; margin-bottom: 0.5rem"
          :animated="true"
        />
        <ion-skeleton-text
          style="width: 100px; height: 20px; margin-bottom: 0.5rem"
          :animated="true"
        />
        <ion-skeleton-text
          style="width: 100px; height: 20px; margin-bottom: 0.5rem"
          :animated="true"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import StoryNftPreview from "../StoryNftPreview.vue";
import {
  listOutline,
  eyeOutline,
  documentOutline,
  heartOutline,
} from "ionicons/icons";

const props = defineProps(["story"]);
const story = computed(() => {
  return props.story;
});
</script>

<style>
.story-info-row {
  line-height: 20px;
  display: flex;
  align-items: center;
}
</style>