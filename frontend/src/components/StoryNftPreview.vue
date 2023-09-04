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
        :class="{
          multiple: props.nfts.length > 1,
        }"
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

<style scoped lang="scss">
ion-avatar {
  width: 100%;
  height: 100%;
}

.multiple {
  margin-left: -24px;
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
  margin-right: -24px;

  ion-avatar {
    height: 73px;
    width: 73px;
  }
}
</style>