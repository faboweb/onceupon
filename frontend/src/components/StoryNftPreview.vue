<template>
  <div style="flex-direction: row; display: flex; padding: 0">
    <div
      class="multiple-nft-wrapper"
      style="height: 160px; display: flex; border-radius: 8px; overflow: hidden"
      :style="{
        width: props.extended ? '160px' : '110px',
      }"
      :class="{
        extended: props.extended,
      }"
    >
      <div
        :class="{
          multiple: props.nfts.length > 1,
        }"
      >
        <nft-element
          v-for="nft in displayNfts"
          :key="nft.image"
          style="display: inline-block"
          :nft="nft"
          :size="props.size || 'xl'"
          :half="props.nfts.length > 1"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from "vue";
import NftElement from "@/components/NftElement.vue";

const props = defineProps({
  nfts: Array,
  extended: Boolean,
  size: String,
});

const displayNfts = computed(() => {
  if (props.nfts.length === 1) {
    return props.nfts;
  }
  if (props.nfts.length === 2) {
    return [...props.nfts, props.nfts[1], props.nfts[0]];
  }
  if (props.nfts.length === 3) {
    return [...props.nfts, props.nfts[0]];
  }
  return props.nfts;
});
</script>

<style lang="scss">
.multiple-nft-wrapper {
  background: rgba(217, 217, 217, 0.8);

  ion-avatar:nth-child(odd) {
    margin-left: -25px;
  }
  ion-avatar:nth-child(even) {
    margin-right: -25px;
  }
  // ion-avatar:hover {
  //   transform: none;
  // }

  // &:hover {
  //   transform: scale(1.05);
  // }

  &.extended {
    ion-avatar {
      margin-left: 0;
    }
  }

  .multiple {
    display: flex;
    flex-wrap: wrap;

    ion-avatar {
      height: 80px;
      width: 80px;

      img {
        border-radius: 0;
      }
    }
  }
}
</style>