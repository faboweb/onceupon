<template>
  <div style="display: flex; flex-direction: column">
    <div
      style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        margin-top: 1rem;
      "
    >
      <span>Top authors of the month</span>
      <span style="opacity: 0.3; cursor: pointer" @click="seeAll = true"
        >See all</span
      >
    </div>
    <div v-if="loaded" style="display: flex">
      <nft-element
        class="author"
        v-for="author in authors"
        :size="69"
        :key="author.user"
        :nft="getAvatar(author.user)"
        style="margin-right: 1rem; cursor: pointer"
        @click="router.push('/profile/' + author.user)"
      />
    </div>
    <div v-else style="display: flex">
      <ion-skeleton-text
        v-for="(x, i) in new Array(5)"
        :key="i"
        style="
          border-radius: 50%;
          height: 69px;
          width: 69px;
          margin-right: 1rem;
        "
        :animated="true"
      ></ion-skeleton-text>
    </div>

    <ion-modal
      :is-open="seeAll"
      @will-dismiss="seeAll = false"
      style="--height: 100%"
    >
      <ion-content
        style="display: flex; flex-direction: column"
        class="ion-padding"
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
          "
        >
          <span>Authors</span>
          <div
            style="
              text-align: right;
              width: 100%;
              padding-right: 1rem;
              padding-top: 0.5rem;
              font-size: 24px;
            "
          >
            <ion-icon
              :icon="closeOutline"
              style="cursor: pointer"
              @click="seeAll = false"
            ></ion-icon>
          </div>
        </div>
        <template v-if="loaded">
          <div
            style="display: flex; cursor: pointer"
            v-for="author in authors"
            @click="
              router.push('/profile/' + author.user);
              seeAll = false;
            "
            :key="author"
          >
            <nft-element
              class="author"
              :size="69"
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
                <span style="font-size: 14px; color: rgba(0, 0, 0, 0.6)">
                  {{ shortAddress(author.user) }} - {{ author.shares }} Shares
                  in {{ author.stories }} Stories
                </span>
              </p>
            </div>
          </div>
        </template>
        <template v-else>
          <ion-skeleton-text
            v-for="(x, i) in new Array(5)"
            :key="i"
            style="
              border-radius: 50%;
              height: 69px;
              width: 69px;
              margin-right: 1rem;
            "
            :animated="true"
          ></ion-skeleton-text>
        </template>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup>
import StoryElement from "@/components/StoryElement.vue";
import { computed, onMounted, ref, watch } from "vue";
import { useNameStore, useStoryStore } from "../../store";
import { getAvatar } from "@/scripts/getAvatar";
import NftElement from "@/components/NftElement.vue";
import { useRouter } from "vue-router";
import { IonContent, IonIcon, IonModal, IonSkeletonText } from "@ionic/vue";
import { closeOutline } from "ionicons/icons";
import { shortAddress } from "../../store/names";

const storyStore = useStoryStore();
const router = useRouter();
const nameStore = useNameStore();

const seeAll = ref(false);
const loaded = ref(false);
const loadedAll = ref(false);
const authors = ref([]);

watch(seeAll, async () => {
  if (seeAll.value && !loadedAll.value) {
    authors.value = await storyStore.loadAuthors();
    loadedAll.value = true;
  }
});

onMounted(async () => {
  authors.value = await storyStore.loadAuthors(5);
  loaded.value = true;
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