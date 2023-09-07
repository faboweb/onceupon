<template>
  <div
    style="display: flex; flex-direction: column"
    v-if="continueStore.proposals.length"
  >
    <div
      style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        margin-top: 1rem;
      "
    >
      <span class="header font-header">Continue where you left off</span>
    </div>
    <div>
      <abstract-element
        v-for="(proposal, i) of continueStore.proposals"
        :key="i"
        :proposal="proposal"
        caption="Proposal"
      />
    </div>
  </div>
  <div v-else class="display: flex; flex-direction: column;">
    <div
      style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        margin-top: 1rem;
      "
    >
      <span class="header font-header">Become a writer</span>
    </div>
    <div v-if="randomStoryEnding" style="display: flex; flex-direction: row">
      <abstract-element
        :proposal="{
          title: randomStory.name,
          content: randomStoryEnding,
          story_id: randomStory.id,
        }"
        caption="Continue the story"
        style="flex: 1"
      />
    </div>
    <div v-else>
      <ion-skeleton-text
        style="height: 123px; width: 186px; border-radius: 4px"
        :animated="true"
      >
      </ion-skeleton-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useContinueStore } from "../../store/continue";
import { useStoryStore } from "../../store";
import { useRouter } from "vue-router";
import AbstractElement from "../AbstractElement.vue";
import { IonSkeletonText } from "@ionic/vue";

const storyStore = useStoryStore();
const continueStore = useContinueStore();
const router = useRouter();

const randomStoryIndex = ref();
const randomStoryEnding = ref();
const randomStory = ref();

watch(randomStory, async () => {
  const lastSection =
    randomStory.value.sections[randomStory.value.sections.length - 1];
  await storyStore.loadContent([lastSection.content_cid]);
  const lastSectionContent = storyStore.cidLookup[lastSection.content_cid];
  const lastSectionEnding = lastSectionContent.trim();
  randomStoryEnding.value = lastSectionEnding;
});

watch(
  () => storyStore.stories,
  () => {
    if (storyStore.stories.length === 0) return;
    randomStoryIndex.value = Math.floor(
      Math.random() * storyStore.stories.length
    );
    const story = storyStore.stories[randomStoryIndex.value];
    if (story) {
      storyStore
        .getStory(story.id)
        .then((story) => (randomStory.value = story));
    }
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  continueStore.loadProposals();
});
</script>

<style>
</style>