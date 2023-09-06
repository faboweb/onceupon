<template>
  <ion-avatar
    :style="{
      'max-height': size + 'px',
    }"
  >
    <img
      v-if="nft && getNft(nft) && getNft(nft).image"
      :src="getNft(nft).image"
      :alt="getNft(nft).name"
      @error="(e) => (e.target.src = FALLBACK_AVATAR)"
    />
    <img
      v-else
      alt="NFT not found"
      src="https://ionicframework.com/docs/img/demos/avatar.svg"
    />
  </ion-avatar>
</template>

<script setup lang="ts">
import { useNftStore } from "@/store/nfts";
import { defineProps } from "vue";
import { IonAvatar } from "@ionic/vue";
import { FALLBACK_AVATAR } from "../scripts/getAvatar";
defineProps({
  nft: { type: Object },
  size: { type: Number, default: 64 },
});
const { getNft } = useNftStore();
</script>

<style scoped>
/* ion-avatar {
  max-width: 100%;
  height: auto;
} */
</style>
