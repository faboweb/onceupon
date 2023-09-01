<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-content>
      <div style="padding-top: 1rem">
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

          <div style="display: flex; margin-top: 0.5rem; flex-wrap: wrap">
            <div
              v-for="(section, i) of contributions"
              :key="i"
              style="
                background: rgba(217, 217, 217, 0.2);
                border-radius: 8px;
                padding: 0.5rem;
                cursor: pointer;
                width: 186px;
                height: 123px;
                margin-right: 1rem;
                overflow: hidden;
                text-overflow: ellipsis;
                flex-grow: 1;
                margin-bottom: 0.5rem;
              "
              @click="router.push('/story/' + section.story_id + '/read/')"
            >
              <b
                style="
                  margin-bottom: 0.2rem;
                  font-size: 14px;
                  white-space: nowrap;
                "
              >
                {{ section.story?.name }}
              </b>
              <span style="color: rgba(242, 103, 9, 0.6); font-size: 14px"
                >Section</span
              >
              <p
                style="
                  text-align: left;
                  white-space: pre-wrap;
                  text-overflow: ellipsis;
                  overflow: hidden;
                  max-height: 70px;
                  font-size: 12px;
                "
              >
                {{ section.content }}...
              </p>
            </div>
          </div>
        </div>
        <!-- <div>
          <div
            style="font-size: 16px; color: rgba(0, 0, 0, 0.6); margin-top: 2rem"
          >
            {{ self ? "My " : "" }}Likes
          </div>
          <div style="display: flex; flex-direction: row">
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
        </div> -->
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
import MobileFooter from "../components/overview/MobileFooter.vue";
import { IonPage, IonContent } from "@ionic/vue";
import { useLikeStore } from "../store/likes";

const route = useRoute();
const address = String(route?.params.address);

const authStore = useAuthStore();
const nameStore = useNameStore();
const storyStore = useStoryStore();
const likeStore = useLikeStore();
const router = useRouter();
const likes = ref([]);

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
    nameStore.getName(address);
    storyStore.loadContributions(address);
    likes.value = await likeStore.getLikes(address);
  },
  {
    immediate: true,
  }
);
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