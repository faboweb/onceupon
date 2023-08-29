<template>
  <ion-page>
    <ion-content>
      <div style="display: flex; flex-direction: column">
        <div
          v-for="contract in contracts"
          :key="contract"
          style="margin-top: 1rem"
        >
          <span
            style="
              font-size: 14px;
              color: rgba(0, 0, 0, 0.4);
              margin-bottom: 0.5rem;
              display: block;
            "
            >{{
              loadedNfts.find((nft) => nft.contract_address === contract)
                ?.collection
            }}</span
          >
          <div
            v-for="nft in loadedNfts.filter(
              (nft) => nft.contract_address === contract
            )"
            :key="getNftKey(nft)"
          >
            <nft-element
              :nft="nft"
              :size="100"
              style="height: 100px; width: 100px"
            />
          </div>
        </div>
      </div>
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
import { getNftKey, useNftStore } from "../../store/nfts";

const storyStore = useStoryStore();
const route = useRoute();
const nftStore = useNftStore();

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
const contracts = computed(() => {
  return Array.from(new Set(nfts.value.map((nft) => nft.contract_address)));
});
const loadedNfts = ref([]);
watch(nfts, async () => {
  loadedNfts.value = await Promise.all(
    nfts.value.map(async (nft) => ({
      ...(await nftStore.getNft(nft)),
      sections: nft.sections,
    }))
  );
});
</script>

<style>
</style>