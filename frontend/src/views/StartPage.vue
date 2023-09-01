<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-header>
      <ion-toolbar style="margin-bottom: 1rem">
        <div
          slot="start"
          style="color: rgba(2, 55, 67, 1); display: flex; align-items: center"
        >
          <b style="font-size: 32px; font-weight: 900; margin-right: 3rem"
            >ONCE UPON</b
          >
          <div class="links">
            <a href="/overview" style="margin-right: 1rem">Explore</a>
            <a href="/story/new">Write Stories</a>
          </div>
        </div>
        <div slot="end">
          <ion-button
            v-if="!authStore.isSignedIn"
            style="--background: rgba(2, 55, 67, 1)"
            @click="authStore.showSignInModal = true"
            >Login</ion-button
          >
          <ion-button v-else @click="router.push('/overview')"
            >Explore App</ion-button
          >
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content style="text-align: center">
      <div>
        <img
          src="@/../public/assets/onceupon-logo-feather-lite.png"
          alt=""
          style="width: 160px; height: 160px"
        />
      </div>
      <b style="font-size: 40px; color: rgba(1, 40, 49, 1)"
        >A world of stories awaits!</b
      >
      <p
        style="
          color: rgba(204, 111, 0, 1);
          font-size: 24px;
          margin-bottom: 20px;
        "
      >
        Where stories come alive and you can unleash your imagination to read,
        share, and write your own magical tales!
      </p>
      <ion-button style="margin-bottom: 42px" @click="router.push('/overview')"
        >Explore app</ion-button
      >
      <div>
        <iframe
          :hidden="!configStore.showVideo"
          width="100%"
          height="315"
          src="https://www.youtube.com/embed/TT7CIizVjPg?controls=0"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          style="max-width: 702px"
        ></iframe>
        <small
          style="float: right; cursor: pointer; color: rgb(115, 115, 115)"
          @click="configStore.setConfig('showVideo', !configStore.showVideo)"
          >{{ configStore.showVideo ? "Hide" : "Show" }} video</small
        >
      </div>
      <div
        style="
          background: rgba(255, 245, 233, 1);
          border: 1px solid rgba(204, 111, 0, 1);
          margin-top: 135px;
          padding-top: 2rem;
          padding-bottom: 2rem;
          border-radius: 8px;
        "
      >
        <div style="display: flex; flex-direction: row; margin-bottom: 2rem">
          <img
            src="@/../public/assets/stack_books-lite.png"
            alt=""
            style="width: 250px; height: 250px; margin-top: -100px"
          />
          <div style="flex: 66%; text-align: left; color: rgba(1, 40, 49, 1)">
            <b style="font-size: 28px; margin-bottom: 8px">For readers</b>
            <p style="margin-bottom: 16px">
              Where readers and writers come together to celebrate the magic of
              storytelling.
            </p>
            <ion-button @click="router.push('/overview')"
              >Read a story</ion-button
            >
          </div>
        </div>
        <div
          style="display: flex; flex-direction: row; color: rgba(1, 40, 49, 1)"
        >
          <div style="flex: 66%; text-align: right">
            <b style="font-size: 28px; margin-bottom: 8px">For writers</b>
            <p style="margin-bottom: 16px">
              Where readers and writers come together to celebrate the magic of
              storytelling.
            </p>
            <ion-button @click="router.push('/story/new')"
              >Write a story</ion-button
            >
          </div>
          <img
            src="@/../public/assets/typewriter-lite.png"
            alt=""
            style="width: 250px; height: 250px; margin-bottom: -100px"
          />
        </div>
      </div>

      <template v-if="story">
        <b
          style="
            font-size: 32px;
            color: rgba(1, 40, 49, 1);

            margin-bottom: 20px;
            display: block;
            margin-top: 86px;
          "
          >Featured story</b
        >
        <div
          style="
            background: rgba(255, 245, 233, 1);
            border: 1px solid rgba(204, 111, 0, 1);
            padding-top: 2rem;
            padding-bottom: 2rem;
            display: flex;
            flex-direction: row;
            padding-left: 1rem;
            padding-right: 1rem;
            border-radius: 8px;
          "
        >
          <story-nft-preview
            :nfts="story?.top_nfts"
            :extended="true"
            style="margin-right: 1rem"
          />
          <div
            style="
              display: flex;
              flex-direction: column;
              text-align: left;
              color: rgba(1, 40, 49, 1);
            "
          >
            <b style="font-size: 20px">{{ story.name }}</b>
            <div>
              <span
                style="font-size: 14px; cursor: pointer"
                @click="router.push('/profile/' + story.creator)"
                >By {{ nameStore.name(story.creator) }}</span
              >
              - <span style="font-size: 14px">{{ story.owners }} Owners</span>
            </div>
            <p style="margin-bottom: 1rem">{{ content.substr(0, 240) }}...</p>
            <div>
              <ion-button
                style="--background: rgba(242, 103, 9, 1)"
                @click="router.push('/story/' + story.id + '/read/')"
                >Continue reading</ion-button
              >
              <ion-button
                fill="clear"
                style="color: rgba(242, 103, 9, 1)"
                @click="router.push('/overview')"
                >Explore more stories</ion-button
              >
            </div>
          </div>
        </div>
      </template>

      <!-- <b
        style="
          font-size: 32px;
          color: rgba(1, 40, 49, 1);

          margin-bottom: 46px;
          display: block;
          margin-top: 86px;
        "
        >Leaderboard</b
      >
      <div
        style="
          background: rgba(255, 245, 233, 1);
          border: 1px solid rgba(204, 111, 0, 1);
          padding-top: 2rem;
          padding-bottom: 2rem;
          border-radius: 8px;
        "
      ></div> -->

      <login-modal />
      <div
        style="
          display: flex;
          justify-content: space-between;
          box-shadow: none;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          margin-top: 3rem;
        "
      >
        <div>
          <div style="display: flex; flex-direction: column; text-align: left">
            <b>ONCE UPON</b>
            <span style="font-size: 14px">Own your story</span>
          </div>
        </div>
        <div>
          <div class="links">
            <a href="/overview" style="margin-right: 1rem">Explore</a>
            <a href="/story/new">Write Stories</a>
          </div>
        </div>
        <div style="display: flex; flex-direction: column">
          <b>Follow</b>
          <div class="follow-buttons">
            <ion-avatar style="background: white; margin-right: 4px">
              <img src="@/../public/assets/twitter-logo.png" alt="" />
            </ion-avatar>
            <ion-avatar style="background: #1b95e0">
              <img
                src="https://telegram.org/img/oauth/tg_button_large.png"
                alt=""
              />
            </ion-avatar>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonContent,
  IonButton,
  IonTextarea,
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonAvatar,
  IonSelect,
  IonSelectOption,
  IonPage,
  IonCard,
  IonFooter,
} from "@ionic/vue";
import { ref, computed, onMounted } from "vue";
import {
  useAuthStore,
  useConfigStore,
  useNameStore,
  useStoryStore,
} from "../store";
import LoginModal from "./LoginModal.vue";
import StoryNftPreview from "@/components/StoryNftPreview.vue";
import { useRouter } from "vue-router";

const configStore = useConfigStore();
const storyStore = useStoryStore();
const nameStore = useNameStore();
const authStore = useAuthStore();
const router = useRouter();

const story = ref();
const topAuthors = ref();

const content = computed(() =>
  story.value ? storyStore.cidLookup[story.value.first_section.content_cid] : ""
);

onMounted(async () => {
  story.value = (await storyStore.loadStories(1))[0];
  topAuthors.value = await storyStore.loadAuthors(3);
});
</script>

<style scoped lang="scss">
ion-button {
  text-transform: none;

  &.button-solid {
    --background: rgba(242, 103, 9, 1);
    color: white;
  }
}
a {
  text-decoration: none;
}

@media screen and (max-width: 600px) {
  .links {
    display: none;
  }
}

.follow-buttons {
  display: flex;
  flex-direction: row;

  ion-avatar {
    height: 30px;
    width: 30px;
    padding: 4px;
  }
}
</style>