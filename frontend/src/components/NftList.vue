<template>
  <div class="wrap-list">
    <div v-for="contract in contracts" :key="contract" style="margin-top: 1rem">
      <span class="font-header heading">{{
        loadedNfts.find((nft) => nft.contract_address === contract)?.collection
      }}</span>
      <div
        v-for="nft in loadedNfts.filter(
          (nft) => nft.contract_address === contract
        )"
        :key="getNftKey(nft)"
      >
        <nft-element
          :nft="nft"
          size="lg"
          @click="click(nft)"
          :style="{
            cursor: clickable ? 'pointer' : 'default',
          }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import NftElement from "@/components/NftElement.vue";
import { computed, ref, defineProps, watch, defineEmits } from "vue";
import { getNftKey, useNftStore } from "../store/nfts";

const nftStore = useNftStore();

const props = defineProps<{ nfts: any[]; clickable?: boolean }>();
const emits = defineEmits(["click"]);
const contracts = computed(() => {
  return Array.from(new Set(props.nfts.map((nft) => nft.contract_address)));
});
const loadedNfts = ref([]);
watch(
  () => props.nfts,
  async () => {
    loadedNfts.value = await Promise.all(props.nfts.map(nftStore.getNft));
  },
  {
    immediate: true,
  }
);

const click = (nft) => {
  emits("click", nft);
};
</script>

<style>
</style>