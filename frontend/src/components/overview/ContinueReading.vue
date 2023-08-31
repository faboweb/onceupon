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
      <span>Continue where you left off</span>
    </div>
    <div>
      <div
        v-for="(proposal, i) of continueStore.proposals"
        :key="i"
        style="
          background: rgba(217, 217, 217, 0.2);
          border-radius: 0 4px 4px 0;
          padding: 0.5rem;
          cursor: pointer;
          width: 154px;
          height: 100px;
        "
        @click="router.push('/story/' + proposal.storyId + '/read/')"
      >
        <b style="margin-bottom: 0.2rem; font-size: 14px; white-space: nowrap">
          {{ proposal.title }}
        </b>
        <span style="color: rgba(242, 103, 9, 0.6); font-size: 14px"
          >Proposal</span
        >
        <p
          style="
            text-align: left;
            white-space: pre-wrap;
            text-overflow: ellipsis;
            overflow: hidden;
            max-height: 70px;
            font-size: 12px;
          "
        >
          {{ proposal.content.substr(0, 140) }}...
        </p>
      </div>
    </div>
  </div>
  <div v-else>
    <div
      style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        margin-top: 1rem;
      "
    >
      <span>Become a writer</span>
    </div>
    <div v-if="randomStoryEnding">
      <div
        style="
          background: rgba(217, 217, 217, 0.2);
          border-radius: 0 4px 4px 0;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          width: 186px;
          height: 123px;
          overflow: hidden;
          text-overflow: ellipsis;
        "
        @click="router.push('/story/' + randomStory.id + '/read/')"
      >
        <b style="margin-bottom: 0.2rem; font-size: 12px; white-space: nowrap">
          {{ randomStory.name }}
        </b>
        <span style="color: rgba(0, 128, 0, 0.6); font-size: 12px"
          >Continue the story</span
        >
        <p
          style="
            text-align: left;
            white-space: pre-wrap;
            text-overflow: ellipsis;
            overflow: hidden;
            max-height: 70px;
            font-size: 12px;
            margin-top: 4px;
          "
        >
          {{ randomStoryEnding }}
        </p>
      </div>
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

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useContinueStore } from "../../store/continue";
import { useStoryStore } from "../../store";
import { useRouter } from "vue-router";

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
  const lastSectionEnding = lastSectionContent.substr(-140).trim();
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