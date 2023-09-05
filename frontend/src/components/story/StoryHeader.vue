<template>
  <div style="flex-direction: row; display: flex; padding: 0">
    <div
      style="
        width: 124px;
        height: 124px;
        display: flex;
        justify-content: space-between;
      "
      v-if="story?.top_nfts.length > 0"
    >
      <nft-element
        v-for="nft in story.top_nfts"
        :key="nft.image"
        style="display: inline-block"
        :style="{
          height: story.top_nfts.length > 1 ? '45px' : '100%',
          width: story.top_nfts.length > 1 ? '45px' : '100%',
          maxHeight: '100%',
        }"
        :nft="nft"
        :size="93"
      />
    </div>
    <ion-skeleton-text
      style="width: 124px; height: 124px"
      v-else
      :animated="!story"
    />
    <div
      style="
        display: flex;
        flex-direction: column;
        margin-left: 1rem;
        font-size: 12px;
      "
    >
      <template v-if="story">
        <b style="font-size: 18px; margin-bottom: 0.5rem">{{ story.name }}</b>
        <div style="line-height: 20px; display: flex; align-items: center">
          <ion-icon :icon="heartOutline" style="margin-right: 4px"></ion-icon>

          <b style="margin-right: 4px">{{ story.likes || 0 }}</b>
          <span style="color: rgba(0, 0, 0, 0.4)">Likes</span>
        </div>
        <div style="line-height: 20px; display: flex; align-items: center">
          <ion-icon :icon="listOutline" style="margin-right: 4px"></ion-icon>

          <b style="margin-right: 4px">{{ story.sections }}</b>
          <span style="color: rgba(0, 0, 0, 0.4)">Sections</span>
        </div>
        <div style="line-height: 20px; display: flex; align-items: center">
          <ion-icon :icon="eyeOutline" style="margin-right: 4px"></ion-icon>

          <b style="margin-right: 4px">{{ story.owners }}</b>
          <span style="color: rgba(0, 0, 0, 0.4)">Owners</span>
        </div>
        <div style="line-height: 20px; display: flex; align-items: center">
          <ion-icon
            :icon="documentOutline"
            style="margin-right: 4px"
          ></ion-icon>

          <b style="margin-right: 4px">{{ story.proposals }}</b>
          <span style="color: rgba(0, 0, 0, 0.4)">Proposals</span>
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

<script setup>
import { computed, defineProps } from "vue";
import NftElement from "../NftElement.vue";
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
</style>