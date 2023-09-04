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
</style>
<style lang="scss">
.extended {
  .multiple {
    margin-left: 0px;
  }
}
.multiple {
  margin-left: -25px;
  display: flex;
  flex-wrap: wrap;
  margin-right: -25px;
  background: rgba(217, 217, 217, 0.8);

  ion-avatar {
    height: 76px;
    width: 76px;

    img {
      border-radius: 0;
    }
  }
}
</style>