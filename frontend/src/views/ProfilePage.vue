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
          <nft-element
            :nft="profilePicture"
            :size="89"
            style="height: 89px; width: 89px"
            class="author"
          />
          <b style="margin-top: 1rem; font-size: 18px">{{ profileName }}</b>
          <span style="font-size: 14px; color: rgba(0, 0, 0, 0.6)"
            >{{ contributions.length }} Contributions -
            {{ author.shares }} Shares in {{ author.stories }} Stories
          </span>
        </div>
        <div style="margin-top: 1rem">
          <div
            style="font-size: 16px; color: rgba(0, 0, 0, 0.6); margin-top: 2rem"
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
          <div
            style="font-size: 16px; color: rgba(0, 0, 0, 0.6); margin-top: 2rem"
          >
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
          <div
            style="font-size: 16px; color: rgba(0, 0, 0, 0.6); margin-top: 2rem"
          >
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
import { useRoute, useRouter } from "vue-router";
import {
  useAuthStore,
  useNameStore,
  useStoryStore,
  useWalletStore,
} from "../store";
import NftElement from "../components/NftElement.vue";
import NftList from "../components/NftList.vue";
import MobileFooter from "../components/overview/MobileFooter.vue";
import AbstractElement from "../components/AbstractElement.vue";
import { IonPage, IonContent } from "@ionic/vue";
import { useLikeStore } from "../store/likes";
import add from "date-fns/esm/fp/add/index";
import { useNftStore } from "../store/nfts";
import { getNftKey } from "@/store/nfts";

const route = useRoute();
const address = String(route?.params.address);

const authStore = useAuthStore();
const nameStore = useNameStore();
const storyStore = useStoryStore();
const likeStore = useLikeStore();
const nftStore = useNftStore();
const router = useRouter();
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
  return nameStore.avatar(address);
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

watch(
  () => address,
  async () => {
    doneLoadingLikes.value = false;
    doneLoadingNfts.value = false;
    loadedLikes.value = [];
    loadedNfts.value = [];

    nameStore.getName(address);
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
ion-button {
  background: rgba(242, 103, 9, 1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
}
</style>
<style scoped>
.author img {
  border-radius: 50%;
}
</style>