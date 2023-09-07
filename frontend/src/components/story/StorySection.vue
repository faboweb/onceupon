<template>
  <div style="width: 100%">
    <nft-element
      v-if="section.nft"
      size="lg"
      :nft="section.nft"
      style="
        float: right;
        padding: 0 0 0.5rem 0.5rem;
        box-sizing: content-box;
        cursor: pointer;
      "
      @click.prevent="selectedNft = section.nft"
    />
    <div
      class="icon-button icon-xl"
      style="float: left; padding-right: 0.5rem; margin-top: 2px"
      :class="{
        active: liked,
      }"
      @click="likeStore.toggleLike(section)"
      v-if="authStore.isSignedIn && authStore.signInMethod !== 'keplr'"
    >
      <ion-icon :icon="liked ? heart : heartOutline"></ion-icon>
    </div>
    <p
      style="white-space: break-spaces"
      :class="{
        'skeleton-offset': section.nft,
      }"
    >
      <span v-if="content">
        {{ content }}
      </span>
      <template v-else>
        <ion-skeleton-text :animated="true"></ion-skeleton-text>
        <ion-skeleton-text :animated="true"></ion-skeleton-text>
        <ion-skeleton-text :animated="true"></ion-skeleton-text>
        <ion-skeleton-text :animated="true"></ion-skeleton-text>
      </template>
    </p>
    <span
      class="font-secondary font-sm"
      style="display: block; float: right; margin-top: 0.5rem; cursor: pointer"
      @click="router.push('/profile/' + props.section.proposer)"
      >{{ name }} - {{ time }}</span
    >
    <div style="display: flex; margin-top: 2rem">
      <slot name="buttons"></slot>
    </div>
    <ion-modal
      :is-open="!!selectedNft"
      @ionModalDidDismiss="selectedNft = null"
      @click="selectedNft = null"
    >
      <ion-content>
        <nft-element
          :nft="selectedNft"
          style="height: 100%; width: 100%; max-height: none"
        />
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { useNameStore } from "@/store";
import { useWalletStore } from "@/store/wallet";
import { useNftStore } from "@/store/nfts";
import { useStoryStore } from "@/store/story";
import { useLikeStore } from "@/store/likes";
import { IonGrid, IonRow, IonCol, IonCard, useIonRouter } from "@ionic/vue";
import { formatDistance } from "date-fns";
import { computed, defineProps, onMounted, ref } from "vue";
import NftElement from "../NftElement.vue";
import { useAuthStore, useNetworkStore } from "../../store";
import { heart, heartOutline } from "ionicons/icons";

const walletStore = useWalletStore();
const authStore = useAuthStore();
const nftStore = useNftStore();
const nameStore = useNameStore();
const storyStore = useStoryStore();
const router = useIonRouter();
const networkStore = useNetworkStore();
const likeStore = useLikeStore();

const selectedNft = ref();

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
});

const name = computed(() => nameStore.name(props.section.proposer));
const content = computed(() => storyStore.cidLookup[props.section.content_cid]);
const liked = computed(() => likeStore.like(props.section));

onMounted(() => {
  props.section.nft &&
    nftStore.loadNft(networkStore.currentNetwork, props.section.nft);
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
<style scoped lang="scss">
ion-skeleton-text {
  line-height: 25px;
  margin-top: 8px;
}
.skeleton-offset ion-skeleton-text {
  width: calc(100% - 133px);
}
</style>
