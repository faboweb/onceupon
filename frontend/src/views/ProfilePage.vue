<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-content>
      <div style="padding-top: 1rem; padding-bottom: 10rem">
        <div
          style="position: absolute; right: 0.5rem"
          :style="{
            visibility: self ? 'visible' : 'hidden',
          }"
        >
          <ion-button
            fill="flat"
            @click="authStore.signOut()"
            style="color: rgb(242, 103, 9)"
            >Sign Out</ion-button
          >
        </div>
        <!-- <div v-else style="text-align: right">
      <ion-button>Follow</ion-button>
    </div> -->
        <div
          style="
            justify-content: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          "
        >
          <author :image="profilePicture" size="md" />
          <div
            @click="goMintscan()"
            style="
              cursor: pointer;
              display: flex;
              flex-direction: column;
              text-align: center;
            "
          >
            <b class="font-lg" style="margin-top: 1rem">{{ profileName }}</b>
            <span
              class="font-secondary"
              v-if="profileName !== shortAddress(address)"
              >{{ shortAddress(address) }}</span
            >
          </div>
          <span class="font-secondary"
            >{{ contributions.length }} Contributions -
            {{ author.shares }} Shares in {{ author.stories }} Stories
          </span>
        </div>
        <div style="margin-top: 1rem">
          <div
            class="font-header"
            style="margin-top: 2rem"
            v-if="!(contributionsLoaded && contributions.length === 0)"
          >
            {{ self ? "My " : "" }}Contributions
          </div>
          <div
            style="display: flex; flex-direction: row"
            v-if="!contributionsLoaded"
          >
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
          </div>

          <div
            style="
              display: flex;
              margin-top: 0.5rem;
              flex-wrap: wrap;
              gap: 1rem;
            "
          >
            <abstract-element
              :proposal="section"
              v-for="section of contributions"
              caption="Section"
              :key="section.section_id"
              style="flex: 1"
            />
          </div>
        </div>
        <div v-if="!doneLoadingLikes || likes.length > 0">
          <div class="font-header" style="margin-top: 2rem">
            {{ self ? "My " : "" }}Likes
          </div>
          <div
            style="display: flex; flex-direction: row; margin-top: 0.5rem"
            v-if="!doneLoadingLikes"
          >
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
              :animated="true"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
              :animated="true"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
              :animated="true"
            ></ion-skeleton-text>
          </div>
          <div
            v-else
            style="
              display: flex;
              margin-top: 0.5rem;
              flex-wrap: wrap;
              gap: 1rem;
            "
          >
            <abstract-element
              v-for="section of loadedLikes"
              :key="section.section_id"
              :proposal="section"
              caption="Section"
              style="flex: 1"
            />
          </div>
        </div>
        <div v-if="!doneLoadingNfts || loadedNfts.length > 0">
          <div class="font-header" style="margin-top: 2rem">
            {{ self ? "My " : "" }} Linked Nfts
          </div>
          <div
            style="display: flex; flex-direction: row; margin-top: 0.5rem"
            v-if="!doneLoadingNfts"
          >
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
              :animated="true"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
              :animated="true"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
              :animated="true"
            ></ion-skeleton-text>
          </div>
          <div
            v-else
            style="
              display: flex;
              margin-top: 0.5rem;
              flex-wrap: wrap;
              gap: 1rem;
            "
          >
            <nft-list :nfts="loadedNfts" />
          </div>
        </div>
      </div>

      <mobile-footer />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore, useNameStore, useStoryStore } from "../store";
import NftList from "../components/NftList.vue";
import MobileFooter from "../components/overview/MobileFooter.vue";
import AbstractElement from "../components/AbstractElement.vue";
import { IonPage, IonContent, IonSkeletonText, IonButton } from "@ionic/vue";
import { useLikeStore } from "../store/likes";
import { useNftStore } from "../store/nfts";
import { shortAddress } from "@/store/names";
import Author from "../components/Author.vue";

const route = useRoute();
const address = String(route?.params.address);

const authStore = useAuthStore();
const nameStore = useNameStore();
const storyStore = useStoryStore();
const likeStore = useLikeStore();
const nftStore = useNftStore();
const likes = ref();
const author = ref({
  stories: 0,
  shares: 0,
});
const loadedLikes = ref([]);
const doneLoadingLikes = ref(false);
const loadedNfts = ref([]);
const doneLoadingNfts = ref(false);

const profileName = computed(() => {
  return nameStore.name(address);
});
const profilePicture = computed(() => {
  return nameStore.names[address]?.image;
});

const self = computed(() => {
  return authStore.user?.address === address;
});

const contributions = computed(() => {
  const contributions = storyStore.contributions[address];
  if (!contributions) return [];
  return contributions.map((c) => ({
    ...c,
    content: storyStore.cidLookup[c.content_cid],
    story: storyStore.stories[c.story_id],
  }));
});
const contributionsLoaded = computed(() => {
  return storyStore.contributions[address] !== undefined;
});

const goMintscan = () => {
  window.location.href = "https://www.mintscan.io/stargaze/accounts/" + address;
};

watch(
  () => address,
  async () => {
    doneLoadingLikes.value = false;
    doneLoadingNfts.value = false;
    loadedLikes.value = [];
    loadedNfts.value = [];

    // nameStore.getName(address);
    storyStore.loadContributions(address);
    storyStore.getAuthor(address).then((_author) => (author.value = _author));
    nftStore.getLinkedNfts(address).then((nfts) => {
      loadedNfts.value = nfts;
      doneLoadingNfts.value = true;
    });
    likes.value = await likeStore.getLikes(address); // TODO update likes on like
    Promise.all(
      likes.value.map(async ({ story_id, section_id }) => {
        const story = await storyStore.getStory(story_id);
        const section = story.sections.find(
          (section) => section.section_id === section_id
        );
        loadedLikes.value.push(section);
      })
    ).then(() => {
      doneLoadingLikes.value = true;
    });
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  storyStore.loadStories();
});
</script>
<style scoped>
.author img {
  border-radius: 50%;
}
</style>