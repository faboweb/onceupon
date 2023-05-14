<template>
  <ion-card>
    <nft-element
      v-if="section.nft"
      :nft="section.nft"
      style="float: left; padding: 0 0.5rem 0.5rem 0; box-sizing: content-box"
    />
    <p style="font-size: 14px; line-height: 21px; margin-top: 0">
      {{ content }}
    </p>
    <span
      style="
        font-size: 12px;
        color: gray;
        display: block;
        float: right;
        margin-top: 0.5rem;
      "
      >{{ name }} - {{ time }}</span
    >
    <slot name="buttons"></slot>
  </ion-card>
</template>

<script setup lang="ts">
import { useNameStore } from "@/store";
import { useWalletStore } from "@/store/wallet";
import { useNftStore } from "@/store/nfts";
import { useStoryStore } from "@/store/story";
import { IonGrid, IonRow, IonCol, IonCard } from "@ionic/vue";
import { formatDistance } from "date-fns";
import { computed, defineProps, onMounted } from "vue";
import NftElement from "./NftElement.vue";

const walletStore = useWalletStore();
const nftStore = useNftStore();
const nameStore = useNameStore();
const storyStore = useStoryStore();

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
});

const name = computed(() => nameStore.name(props.section.proposer));
const content = computed(() => storyStore.cidLookup[props.section.content_cid]);

onMounted(() => {
  nftStore.loadNft(props.section.nft);
  walletStore.getBlock(props.section.added);
});

const time = computed(() => {
  if (!walletStore.blocks[props.section.added]) return props.section.added;

  return formatDistance(
    new Date(walletStore.blocks[props.section.added].header.time),
    new Date(),
    { addSuffix: true }
  );
});
</script>
<style scoped>
ion-card {
  box-shadow: 5px 5px 50px rgba(192, 197, 214, 0.34);
  border-radius: 15px;
  padding: 10px;
}
</style>
