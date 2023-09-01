<template>
  <div style="flex-direction: row; display: flex; padding: 0">
    <div
      style="
        width: 103px;
        height: 151px;
        display: flex;
        justify-content: space-between;
        border-radius: 8px;
        overflow: hidden;
      "
      :style="{
        width: props.extended ? '151px' : '103px',
      }"
      v-if="props.nfts.length > 0"
    >
      <div
        :style="{
          //marginLeft: !props.extended ? '-25px' : '',
          maxWidth: !props.extended ? 'inherit' : '100%',
        }"
      >
        <nft-element
          v-for="nft in props.nfts"
          :key="nft.image"
          style="display: inline-block"
          :style="{
            height: props.nfts.length > 1 ? '45px' : '100%',
            width: props.nfts.length > 1 ? '45px' : '100%',
            maxHeight: '100%',
          }"
          :nft="nft"
          :size="93"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from "vue";
import NftElement from "@/components/NftElement.vue";

const props = defineProps({
  nfts: Array,
  extended: Boolean,
});
</script>

<style>
</style>