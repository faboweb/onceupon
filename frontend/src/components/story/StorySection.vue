<template>
  <div style="width: 100%">
    <nft-element
      v-if="section.nft"
      :nft="section.nft"
      :size="120"
      style="float: right; padding: 0 0 0.5rem 0.5rem; box-sizing: content-box; cursor: pointer;     height: 120px;
    width: 120px;"
      @click.prevent="selectedNft = section.nft"
    />
    <p style="font-size: 14px; line-height: 21px; margin-top: 0; white-space: break-spaces;" :class="{
      'skeleton-offset': !content
    }">
      <span v-if="content">
        {{ content }}
      </span>
      <template v-else>
        <ion-skeleton-text
          :animated="true"
        ></ion-skeleton-text>
        <ion-skeleton-text
          :animated="true"
        ></ion-skeleton-text>
        <ion-skeleton-text
          :animated="true"
        ></ion-skeleton-text>
        <ion-skeleton-text
          :animated="true"
       ></ion-skeleton-text>
      </template>
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
    <div style="display: flex;
    margin-top: 2rem;">
      <slot name="buttons"></slot>
    </div>
    <ion-modal :is-open="!!selectedNft" @ionModalDidDismiss="selectedNft = null">
      <ion-content>
        <nft-element :nft="selectedNft" style="height: 100%; width: 100%; max-height: none;" />
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { useNameStore } from "@/store";
import { useWalletStore } from "@/store/wallet";
import { useNftStore } from "@/store/nfts";
import { useStoryStore } from "@/store/story";
import { IonGrid, IonRow, IonCol, IonCard } from "@ionic/vue";
import { formatDistance } from "date-fns";
import { computed, defineProps, onMounted, ref } from "vue";
import NftElement from "../NftElement.vue";

const walletStore = useWalletStore();
const nftStore = useNftStore();
const nameStore = useNameStore();
const storyStore = useStoryStore();

const selectedNft = ref();

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
.skeleton-offset ion-skeleton-text {
  width: calc(100% - 100px);
  margin-left: 82px;
}
</style>
