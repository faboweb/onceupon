<template>
  <div style="flex-direction: row; display: flex; padding: 0">
    <div
      class="multiple-nft-wrapper"
      style="height: 160px; display: flex; border-radius: 8px; overflow: hidden"
      :style="{
        width: props.extended ? '160px' : '110px',
      }"
      v-if="props.nfts.length > 0"
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
          v-for="nft in props.nfts"
          :key="nft.image"
          style="display: inline-block"
          :nft="nft"
          :size="props.nfts.length === 1 ? 'xl' : 'md'"
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
});
</script>

<style lang="scss">
.multiple-nft-wrapper {
  ion-avatar {
    margin-left: -25px;
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
    background: rgba(217, 217, 217, 0.8);

    ion-avatar {
      height: 80px !important;
      width: 80px !important;

      img {
        border-radius: 0;
      }
    }
  }
}
</style>