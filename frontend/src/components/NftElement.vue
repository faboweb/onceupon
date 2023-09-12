<template>
  <ion-avatar
    :style="{
      height: imageSize + 'px',
      width: imageSize + 'px',
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
import { computed, defineProps } from "vue";
import { IonAvatar } from "@ionic/vue";
import { FALLBACK_AVATAR } from "../scripts/getAvatar";
const props = defineProps({
  nft: { type: Object },
  size: { type: String },
  half: { type: Boolean, default: false },
});

const sizeMap = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 160,
  xxl: 192,
};
const imageSize = computed(() => {
  const size = props.size ? sizeMap[props.size] : sizeMap.sm;
  return props.half ? size / 2 : size;
});
const { getNft } = useNftStore();
</script>

<style scoped>
/* ion-avatar:hover {
  transform: scale(1.05);
} */
</style>
