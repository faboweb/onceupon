<template>
  <div style="display: flex; flex-direction: column">
    <div
      style="display: flex; justify-content: space-between; margin-bottom: 1rem"
    >
      <span>Top stories of the month</span>
      <span style="opacity: 0.3; cursor: pointer" @click="seeAll = true"
        >See all</span
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

    <ion-modal
      :is-open="seeAll"
      @will-dismiss="seeAll = false"
      style="--height: 100%"
    >
      <ion-content
        style="display: flex; flex-direction: column"
        class="ion-padding"
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
          "
        >
          <span>Stories</span>
          <div
            style="
              text-align: right;
              width: 100%;
              padding-right: 1rem;
              padding-top: 0.5rem;
              font-size: 24px;
            "
          >
            <ion-icon
              :icon="closeOutline"
              style="cursor: pointer"
              @click="seeAll = false"
            ></ion-icon>
          </div>
        </div>
        <template v-if="storyStore.stories.length > 0">
          <story-element
            v-for="story in storyStore.stories"
            :key="story.id"
            :story="story"
            style="margin-right: 1rem; cursor: pointer"
            @click="router.push('/story/' + story.id + '/read/')"
            :extended="true"
          />
        </template>
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
    </ion-modal>
  </div>
</template>

<script setup>
import StoryElement from "@/components/StoryElement.vue";
import { IonContent, IonIcon, IonModal, IonSkeletonText } from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStoryStore } from "../../store";
import { closeOutline } from "ionicons/icons";

const storyStore = useStoryStore();
const router = useRouter();

const seeAll = ref(false);
</script>

<style>
</style>