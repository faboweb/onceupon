<template>
  <div
    style="
      background: rgba(217, 217, 217, 0.2);
      border-radius: 8px;
      padding: 0.5rem;
      cursor: pointer;
      width: 186px;
      height: 123px;
      overflow: hidden;
      text-overflow: ellipsis;
    "
    @click="router.push('/story/' + proposal.story_id + '/read/')"
  >
    <b style="margin-bottom: 0.2rem; font-size: 14px; white-space: nowrap">
      {{ title }}
    </b>
    <span
      style="color: rgba(242, 103, 9, 0.6); font-size: 14px; display: block"
      >{{ caption }}</span
    >
    <p
      style="
        text-align: left;
        white-space: pre-wrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-height: 60px;
        font-size: 12px;
      "
    >
      {{ content }}
    </p>
  </div>
</template>

<script setup>
import { onMounted, defineProps, computed } from "vue";
import { useRouter } from "vue-router";
import { useStoryStore } from "../store";

const storyStore = useStoryStore();
const router = useRouter();

const props = defineProps({
  proposal: Object,
  caption: String,
});

const content = computed(() => {
  if (props.proposal.content_cid) {
    return storyStore.cidLookup[props.proposal.content_cid];
  } else {
    return props.proposal.content;
  }
});

const title = computed(() => {
  if (props.proposal.title) return props.proposal.title;
  return storyStore.stories.find((s) => s.id === props.proposal.story_id)?.name;
});

onMounted(() => {
  storyStore.loadStories();
});
</script>

<style>
</style>