<template>
  <ion-card
    style="
      display: inline-block;
      min-width: 150px;
      flex: 1;
      margin-bottom: 1rem;
    "
  >
    <ion-card-content style="flex-direction: row; display: flex; padding: 0">
      <div
        style="margin-right: 0.5rem; width: 93px; display: inline-block"
        v-if="story.top_nfts.length > 0"
      >
        <nft-element
          v-for="nft in story.top_nfts"
          :key="nft.image"
          style="display: inline-block"
          :style="{
            height: story.top_nfts.length > 1 ? '50%' : '100%',
            width: '100%',
          }"
          :nft="nft"
          :size="93"
        />
      </div>
      <div style="display: inline-block;"
    :style="{
      width: story.top_nfts.length > 0 ? 'calc(100% - 101px)' : '100%',
    }">
        <span
          style="font-size: 12px; color: gray; display: block; text-align: left"
          >{{ name }} - {{ time(story) }}</span
        >
        <h1 style="margin-bottom: 0.2rem; font-size: 20px">
          {{ story.name || "No title" }}
        </h1>
        <p style="text-align: left; white-space: pre-wrap;">
          {{ content.substr(0, 140) || "Loading" }}...
        </p>
        <div>
          <!-- <div style="flex-direction: row; display: flex">
            <ion-chip disabled>
              <ion-icon :icon="listOutline"></ion-icon>
              <ion-label>{{ story.sections }}</ion-label>
            </ion-chip>
            <ion-chip disabled>
              <ion-icon :icon="eyeOutline"></ion-icon>
              <ion-label>{{ story.owners }}</ion-label>
            </ion-chip>
            <ion-chip disabled>
              <ion-icon :icon="documentOutline"></ion-icon>
              <ion-label>{{ story.proposals }}</ion-label>
            </ion-chip>
          </div> -->
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import { listOutline, eyeOutline, documentOutline } from "ionicons/icons";
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
import NftElement from "./NftElement.vue";

const nameStore = useNameStore();
const storyStore = useStoryStore();

const props = defineProps<{ story: any }>();

const time = (story) => {
  if (!story.lastUpdate) return "";
  return formatDistance(new Date(story.lastUpdate), new Date(), {
    addSuffix: true,
  });
};

const name = computed(() => nameStore.name(props.story.creator));
const content = computed(() => props.story.first_section || storyStore.cidLookup[props.story.first_section_cid]);
</script>

<style scoped>
ion-card {
  box-shadow: 5px 5px 50px rgba(192, 197, 214, 0.34);
  border-radius: 15px;
  padding: 10px;
}
ion-card:hover {
  box-shadow: 5px 5px 50px rgba(192, 197, 214, 0.5);
}
</style>
