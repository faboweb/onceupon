<template>
  <div>
    <ion-content>
      <nft-list :nfts="nfts" />
    </ion-content>
  </div>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from "@ionic/vue";
import { useRoute } from "vue-router";
import { useStoryStore } from "../../store";
import { computed, onMounted, ref } from "vue";
import NftList from "@/components/NftList.vue";
import { getNftKey } from "../../store/nfts";

const storyStore = useStoryStore();
const route = useRoute();

const story = ref();
const storyId = String(route?.params.id);

onMounted(async () => {
  story.value = await storyStore.getStory(storyId);
});

const nfts = computed(() => {
  if (!story.value) return [];

  const countedNfts = story.value.sections
    .map((section) => section.nft)
    .filter((nft) => !!nft)
    .reduce((all, cur) => {
      all[getNftKey(cur)] = all[getNftKey(cur)]
        ? {
            ...all[getNftKey(cur)],
            sections: all[getNftKey(cur)].sections + 1,
          }
        : {
            ...cur,
            sections: 1,
          };
      return all;
    }, {});
  const nfts = Object.values(countedNfts).sort(
    (a, b) => a.sections - b.sections
  );
  return nfts;
});
</script>

<style>
</style>