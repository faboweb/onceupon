<template>
  <div style="display: flex; flex-direction: column">
    <div
      style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        margin-top: 1rem;
      "
    >
      <span class="header font-header">Top authors of the month</span>
      <a
        class="font-secondary"
        style="cursor: pointer; font-size: 16px"
        @click="router.push('/overview/authors')"
        >See all</a
      >
    </div>
    <div v-if="loaded" style="display: flex">
      <nft-element
        class="author"
        v-for="author in authors"
        size="sm"
        :key="author.user"
        :nft="getAvatar(author.user)"
        style="margin-right: 1rem; cursor: pointer"
        @click="router.push('/profile/' + author.user)"
      />
    </div>
    <div v-else style="display: flex">
      <ion-skeleton-text
        v-for="(x, i) in new Array(5)"
        :key="i"
        style="
          border-radius: 50%;
          height: 69px;
          width: 69px;
          margin-right: 1rem;
        "
        :animated="true"
      ></ion-skeleton-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useNameStore, useStoryStore } from "../../store";
import { getAvatar } from "@/scripts/getAvatar";
import NftElement from "@/components/NftElement.vue";
import { useRouter } from "vue-router";
import { IonContent, IonIcon, IonSkeletonText } from "@ionic/vue";

const storyStore = useStoryStore();
const router = useRouter();

const loaded = ref(false);
const authors = ref([]);

onMounted(async () => {
  authors.value = await storyStore.loadAuthors(5);
  loaded.value = true;
});
</script>

<style>
.user img {
  border-radius: 50%;
}
.author img {
  border-radius: 50%;
}
</style>