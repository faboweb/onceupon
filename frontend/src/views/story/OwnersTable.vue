<template>
  <div>
    <div class="font-secondary" style="padding: 1rem; text-align: center">
      Authors get 100 points per section. Voters get 1 point per vote.
    </div>
    <ion-list>
      <template v-if="story && loaded">
        <ion-item
          v-for="share of shares.sort((a, b) => b.balance - a.balance)"
          :key="share.user"
          style="cursor: pointer"
          @click="router.push('/profile/' + share.user)"
        >
          <author
            :image="nameStore.names[share.user]?.image"
            style="margin-right: 1rem"
          />
          <ion-label>
            <b>{{ nameStore.name(share.user) }}</b>
            <p>{{ share.user }}</p>
          </ion-label>
          <ion-label slot="end"> {{ share.balance }}</ion-label>
        </ion-item>
      </template>
      <template v-else>
        <ion-item v-for="i in [0, 1, 2]" :key="i">
          <ion-thumbnail slot="start">
            <ion-skeleton-text :animated="true"></ion-skeleton-text>
          </ion-thumbnail>
          <ion-label>
            <ion-skeleton-text
              :animated="true"
              style="width: 50%"
            ></ion-skeleton-text>
            <ion-skeleton-text
              :animated="true"
              style="width: 50%"
            ></ion-skeleton-text>
          </ion-label>
          <ion-label slot="end">
            <ion-skeleton-text
              :animated="true"
              style="width: 50px"
            ></ion-skeleton-text
          ></ion-label>
        </ion-item>
      </template>
    </ion-list>
  </div>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonList,
  IonItem,
  IonLabel,
  IonContent,
  onIonViewWillEnter,
  IonSkeletonText,
  IonThumbnail,
  useIonRouter,
} from "@ionic/vue";
import { computed, onMounted, Ref, ref } from "vue";
import { useStoryStore } from "@/store/story";
import { useRoute, useRouter } from "vue-router";
import { useNameStore, useNavigationStore } from "@/store";
import Author from "@/components/Author.vue";

const storyStore = useStoryStore();
const navigationStore = useNavigationStore();
const nameStore = useNameStore();
const route = useRoute();
const router = useRouter();
const storyId = String(route?.params.id);
const story: Ref<any> = ref(null);
const loaded = ref(false);

onMounted(async () => {
  story.value = await storyStore.getStory(storyId);
  navigationStore.backTo = "/stories";

  await storyStore.loadShares(storyId);
  loaded.value = true;
});

const shares = computed(() => {
  return storyStore.shares[storyId];
});
</script>
<style scoped>
ion-skeleton-text {
  border-radius: 10px;
}
</style>
