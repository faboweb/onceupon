<template>
  <div
    class="card clickable"
    style="cursor: pointer; min-width: 186px; height: 123px"
    @click="router.push('/story/' + proposal.story_id + '/read/')"
  >
    <b class="font-sm" style="white-space: nowrap">
      {{ title }}
    </b>
    <span
      class="font-sm font-primary"
      style="display: block"
      :style="{
        color,
      }"
      >{{ caption }}</span
    >
    <p style="max-height: 55px">
      {{ content }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineProps, computed } from "vue";
import { useRouter } from "vue-router";
import { useStoryStore } from "../store";

const storyStore = useStoryStore();
const router = useRouter();

const props = defineProps({
  proposal: Object,
  caption: String,
  color: String,
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

<style scoped lang="scss">
p {
  @extend .font-sm;
}
</style>