<template>
  <ion-page>
    <ion-content
      style="display: flex; flex-direction: column"
      class="ion-padding"
    >
      <div
        v-if="storyStore.stories.length > 0"
        style="display: flex; flex-direction: column; gap: 1rem"
      >
        <story-element
          v-for="story in storyStore.stories"
          :key="story.id"
          :story="story"
          style="margin-right: 1rem; cursor: pointer"
          @click="router.push('/story/' + story.id + '/read/')"
          :extended="true"
        />
      </div>
      <template v-else>
        <ion-skeleton-text
          v-for="(x, i) in new Array(4)"
          :key="i"
          style="
            border-radius: 4px;
            height: 151px;
            width: 103px;
            margin-right: 1rem;
          "
          :animated="true"
        ></ion-skeleton-text>
      </template>
    </ion-content>
  </ion-page>
</template>
  
  <script setup lang="ts">
import StoryElement from "@/components/StoryElement.vue";
import { IonPage, IonContent, IonSkeletonText, useIonRouter } from "@ionic/vue";
import { useStoryStore } from "../../store";
import { useRouter } from "vue-router";

const storyStore = useStoryStore();
const router = useRouter();
</script>
  
  <style>
</style>