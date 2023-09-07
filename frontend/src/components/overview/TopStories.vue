<template>
  <div style="display: flex; flex-direction: column">
    <div
      style="display: flex; justify-content: space-between; margin-bottom: 1rem"
    >
      <span class="header font-header">Top stories of the month</span>
      <a
        class="font-secondary"
        style="cursor: pointer; font-size: 16px"
        @click="router.push('/overview/stories')"
        >See all</a
      >
    </div>
    <div v-if="storyStore.stories.length > 0" style="display: flex">
      <story-element
        v-for="story in storyStore.stories"
        :key="story.id"
        :story="story"
        style="margin-right: 1rem; cursor: pointer; flex: inherit"
        @click="router.push('/story/' + story.id + '/read/')"
      />
    </div>
    <div v-else style="display: flex">
      <ion-skeleton-text
        v-for="(x, i) in new Array(3)"
        :key="i"
        style="
          border-radius: 4px;
          height: 151px;
          width: 103px;
          margin-right: 1rem;
        "
        :animated="true"
      ></ion-skeleton-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import StoryElement from "@/components/StoryElement.vue";
import { IonContent, IonIcon, IonSkeletonText } from "@ionic/vue";
import { useRouter } from "vue-router";
import { useStoryStore } from "../../store";

const storyStore = useStoryStore();
const router = useRouter();
</script>

<style>
</style>