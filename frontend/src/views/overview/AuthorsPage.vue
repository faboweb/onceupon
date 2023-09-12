<template>
  <ion-page>
    <ion-content
      style="display: flex; flex-direction: column"
      class="ion-padding"
    >
      <b class="heading font-header" style="margin-bottom: 2rem">All Authors</b>
      <div
        v-if="authors.length > 0"
        style="display: flex; flex-direction: column; gap: 1rem"
      >
        <div
          style="display: flex; cursor: pointer"
          v-for="author in authors"
          @click="router.push('/profile/' + author.user)"
          :key="author"
        >
          <nft-element
            class="author"
            size="sm"
            :nft="getAvatar(author.user)"
            style="margin-right: 1rem; cursor: pointer"
          />
          <div
            style="
              justify-content: center;
              display: flex;
              flex-direction: column;
            "
          >
            <b>{{ nameStore.name(author.user) }}</b>
            <p
              v-if="nameStore.name(author.user) !== author.user"
              style="margin-top: 0.5rem"
            >
              <span class="font-secondary">
                {{ shortAddress(author.user) }} - {{ author.shares }} Shares in
                {{ author.stories }} Stories
              </span>
            </p>
          </div>
        </div>
      </div>
      <template v-else>
        <ion-skeleton-text
          v-for="(x, i) in new Array(5)"
          :key="i"
          style="
            border-radius: 50%;
            height: 69px;
            width: 69px;
            margin-top: 2rem;
          "
          :animated="true"
        ></ion-skeleton-text>
      </template> </ion-content
  ></ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useNameStore, useStoryStore } from "../../store";
import { getAvatar } from "@/scripts/getAvatar";
import NftElement from "@/components/NftElement.vue";
import { useRouter } from "vue-router";
import { IonPage, IonContent, IonSkeletonText } from "@ionic/vue";
import { shortAddress } from "../../store/names";

const storyStore = useStoryStore();
const router = useRouter();
const nameStore = useNameStore();

const authors = ref([]);

onMounted(async () => {
  authors.value = await storyStore.loadAuthors();
});
</script>

<style>
.user img {
  border-radius: 50%;
}
.author img {
  border-radius: 50%;
}
</style>