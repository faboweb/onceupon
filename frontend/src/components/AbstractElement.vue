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
    @click="router.push('/story/' + proposal.storyId + '/read/')"
  >
    <b style="margin-bottom: 0.2rem; font-size: 14px; white-space: nowrap">
      {{ proposal.title }}
    </b>
    <span style="color: rgba(242, 103, 9, 0.6); font-size: 14px">{{
      caption
    }}</span>
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
      {{ content.substr(0, 140) }}...
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStoryStore } from "../store";

const storyStore = useStoryStore();

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
</script>

<style>
</style>