<template>
  <ion-page>
    <ion-content>
      <nft-list :nfts="nfts" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from "@ionic/vue";
import { useRoute } from "vue-router";
import {
  useNameStore,
  useNavigationStore,
  useStoryStore,
  useWalletStore,
} from "../../store";
import { computed, onMounted, Ref, ref, defineProps, watch } from "vue";
import NftElement from "../../components/NftElement.vue";
import NftList from "@/components/NftList.vue";

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
      all[cur.id] = all[cur.id]
        ? {
            ...all[cur.id],
            sections: all[cur.id].sections + 1,
          }
        : {
            ...cur,
            sections: 1,
          };
      return all;
    }, {});
  return Object.values(countedNfts).sort((a, b) => a.sections - b.sections);
});
</script>

<style>
</style>