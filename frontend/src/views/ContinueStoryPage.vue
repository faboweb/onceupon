<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <template v-if="story">
        <section v-for="(section, i) in story.sections" :key="i">
          <ion-grid>
            <ion-row>
              <ion-col size="2">
                <img
                  v-for="nft in section.nfts"
                  :key="nft.tokenUri"
                  :src="nft.image"
                  :alt="nft.name"
                />
              </ion-col>
              <ion-col>
                {{ section.content }}
              </ion-col>
            </ion-row>
          </ion-grid>
        </section>
        <router-link :to="'/story/read/' + storyId + '/continue'">
          <ion-button>Continue Story</ion-button>
        </router-link>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonButton } from "@ionic/vue";
import { computed, onMounted } from "vue";
import { useStoryStore } from "@/store/story";
import { useRoute } from "vue-router";
const storyStore = useStoryStore();
const route = useRoute();

onMounted(async () => {
  storyStore.loadStories();
});

const storyId = route?.params.id;

const story = computed(() =>
  storyStore.stories?.find((story) => story.id === storyId)
);
</script>
