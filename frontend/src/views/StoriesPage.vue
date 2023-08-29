<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <h1>Hello{{ authStore.user?.name ? ", " + authStore.user?.name : "" }}!</h1>
      <div style="position: absolute; top: 2rem; right: 1rem">
        <a
          href="https://twitter.com/OnceUponNft?ref_src=twsrc%5Etfw"
          class="twitter-follow-button"
          data-show-count="false"
          style="margin-right: 0.5rem"
          >Updates</a
        >
        <a class="telegram-button" href="https://t.me/+-QjBZgq-shY5MGIy" target="_blank">
            <i></i>
            <span>Chat</span>
        </a>
      </div>
      <ion-badge v-if="['twitter', 'google'].includes(authStore.signInMethod)" style="white-space: break-spaces;">
        You are currently signed in with a Web2 account. OnceUpon manages your account. You will soon be able to convert your account to a Web3 account.
      </ion-badge>
      <iframe :hidden="!configStore.showVideo" width="100%" height="315" src="https://www.youtube.com/embed/TT7CIizVjPg?controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      <small style="float: right; cursor: pointer; color: rgb(115,115,115);" @click="configStore.setConfig('showVideo', !configStore.showVideo)">{{configStore.showVideo ? 'Hide' : 'Show'}} video</small>
      
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
          v-for="story in sortedStories"
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
import { computed, onMounted } from "vue";
import { useStoryStore } from "@/store/story";
import Story from "../components/StoryElement.vue";
import { useWalletStore } from "../store/wallet";
import { useAuthStore, useConfigStore } from "../store";

const storyStore = useStoryStore();
const walletStore = useWalletStore();
const configStore = useConfigStore();
const authStore = useAuthStore();

onMounted(async () => {
  await storyStore.loadStories();
});

const sortedStories = computed(() =>{
  if (!storyStore.stories) return [];
  if (storyStore.stories[0].last_update) {
    return storyStore.stories?.sort(
      (a, b) => b.last_update - a.last_update
    );
  } else {
    return storyStore.stories?.sort(
      (a, b) => b.last_section - a.last_section
    );
  }
});
</script>
<style scoped>
.story-outer:not(:last-child) ion-card {
  border-bottom: none;
}
.telegram-button{
  background-color: #1b95e0;
  color: #fff;
  border-radius: 4px;
  height: 28px;
  font-weight: 500;
  font-size: 13px;
  line-height: 24px;
  padding: 6px 8px 8px 8px;
  text-decoration: none;
}

.telegram-button:hover{
    background-color: #007dbb;
}

.telegram-button:active{
    background-color: #026698;
}

.telegram-button i{
    display: inline-block;
    height: 12px;
    width: 14px;
    vertical-align: middle;
    margin-right: 8px;
    
    background: url('https://telegram.org/img/oauth/tg_button_large.png') no-repeat;
    background-size: contain;
}

.telegram-button span{
    display: inline-block;
    vertical-align: top;
}
</style>
