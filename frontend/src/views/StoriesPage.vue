<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <h1>Hello{{ walletStore.name ? ", " + walletStore.name : "" }}!</h1>
      <a
        href="https://twitter.com/OnceUponNft?ref_src=twsrc%5Etfw"
        class="twitter-follow-button"
        data-show-count="false"
        style="position: absolute; top: 2rem; right: 1rem"
        >Get Updates</a
      >
      <div
        style="
          padding: 1rem;
          font-size: 14px;
          background-color: #f2cc8f6b;
          margin-bottom: 1rem;
          border-radius: 8px;
        "
      >
        OnceUpon invites you to write a story together with the community. While
        everyone participating will own the story.
        <br />
        You have a favorite NFT? Finally it can go on amazing adventures
        together with other NFTs.
      </div>
      <h1>Stories</h1>
      <div
        style="
          text-align: center;
          flex-wrap: wrap;
          display: flex;
          flex-direction: column;
        "
        class="story-outer"
      >
        <router-link
          v-for="story in storyStore.stories?.sort(
            (a, b) => b.last_section - a.last_section
          )"
          :key="story.id"
          :to="'/story/' + story.id + '/read'"
          style="display: flex; flex: 1; text-decoration: none; width: 100%"
        >
          <Story :story="story" />
        </router-link>
      </div>
      <router-link :to="'/story/new'">
        <ion-fab-button
          style="float: right; position: fixed; right: 10px; bottom: 74px"
        >
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </router-link>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonFabButton, IonIcon } from "@ionic/vue";
import { add } from "ionicons/icons";
import { onMounted } from "vue";
import { useStoryStore } from "@/store/story";
import Story from "../components/StoryElement.vue";
import { useWalletStore } from "../store/wallet";

const storyStore = useStoryStore();
const walletStore = useWalletStore();

onMounted(async () => {
  await storyStore.loadStories();
});
</script>
<style scoped>
.story-outer:not(:last-child) ion-card {
  border-bottom: none;
}
</style>
