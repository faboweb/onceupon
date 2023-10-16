<template>
  <ion-avatar
    :style="{
      height: imageSize + 'px',
      width: imageSize + 'px',
    }"
  >
    <img
      v-if="image"
      :src="image"
      alt="Profile Picture"
      @error="
        (e) =>
          (e.target.src =
            'https://ionicframework.com/docs/img/demos/avatar.svg')
      "
    />
    <img
      v-else
      alt="Image not found"
      src="https://ionicframework.com/docs/img/demos/avatar.svg"
    />
  </ion-avatar>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import { IonAvatar } from "@ionic/vue";
const props = defineProps({
  image: { type: String },
  size: { type: String },
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
  return size;
});
</script>

<style scoped>
/* ion-avatar:hover {
  transform: scale(1.05);
} */
img {
  border-radius: 50%;
}
</style>
