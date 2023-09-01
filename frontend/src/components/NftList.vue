<template>
  <div style="display: flex; flex-direction: column">
    <div v-for="contract in contracts" :key="contract" style="margin-top: 1rem">
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
</template>

<script setup lang="ts">
import NftElement from "@/components/NftElement.vue";
import { useRoute } from "vue-router";
import { computed, onMounted, Ref, ref, defineProps, watch } from "vue";
import { getNftKey, useNftStore } from "../store/nfts";

const route = useRoute();
const nftStore = useNftStore();

const props = defineProps<{ nfts: any[] }>();
const contracts = computed(() => {
  return Array.from(new Set(props.nfts.map((nft) => nft.contract_address)));
});
const loadedNfts = ref([]);
watch(
  props.nfts,
  async () => {
    loadedNfts.value = await Promise.all(props.nfts.map(nftStore.getNft));
  },
  {
    immediate: true,
  }
);
</script>

<style>
</style>