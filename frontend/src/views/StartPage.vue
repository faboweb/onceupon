<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-header>
      <ion-toolbar style="margin-bottom: 1rem">
        <div
          slot="start"
          style="display: flex; align-items: center; color: var(--second-color)"
        >
          <b class="font-xxl" style="font-weight: 900; margin-right: 3rem"
            >ONCE UPON</b
          >
          <div class="links">
            <a href="/overview" style="margin-right: 1rem">Explore</a>
            <a href="/story/new">Write Stories</a>
          </div>
        </div>
        <div slot="end">
          <ion-button
            class="header-button"
            v-if="!authStore.isSignedIn"
            @click="authStore.showSignInModal = true"
            >Login</ion-button
          >
          <ion-button
            class="header-button"
            v-else
            @click="router.push('/overview')"
            >Explore App</ion-button
          >
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content id="start-content" style="text-align: center">
      <div>
        <img
          src="@/../public/assets/onceupon-logo-feather-lite.png"
          alt=""
          style="width: 160px; height: 160px"
        />
      </div>
      <b class="font-xxl" style="color: var(--second-color)"
        >A world of stories awaits!</b
      >
      <p
        class="font-xl"
        style="
          color: rgba(204, 111, 0, 1);
          margin-bottom: 20px;
          text-align: center;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        "
      >
        Where stories come alive and you can unleash your imagination to read,
        share, and write your own magical tales!
      </p>
      <ion-button style="margin-bottom: 42px" @click="router.push('/overview')"
        >Explore App</ion-button
      >
      <div>
        <iframe
          :hidden="!configStore.showVideo"
          width="100%"
          height="350"
          src="https://www.youtube.com/embed/TT7CIizVjPg?controls=0"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          style="max-width: 702px"
        ></iframe>
        <!-- <small
          style="float: right; cursor: pointer; color: rgb(115, 115, 115)"
          @click="configStore.setConfig('showVideo', !configStore.showVideo)"
          >{{ configStore.showVideo ? "Hide" : "Show" }} video</small
        > -->
      </div>
      <div
        style="
          background: rgba(255, 245, 233, 1);
          border: 1px solid rgba(204, 111, 0, 1);
          margin-top: 6rem;
          padding: 2rem;
          border-radius: 8px;
          max-width: 750px;
          margin-left: auto;
          margin-right: auto;
        "
      >
        <div style="display: flex; flex-direction: row; margin-bottom: 2rem">
          <img
            src="@/../public/assets/stack_books-lite.png"
            alt=""
            style="width: 250px; height: 250px; margin-top: -100px"
          />
          <div
            style="
              width: 300px;
              text-align: left;
              color: rgba(1, 40, 49, 1);
              margin-right: auto;
            "
          >
            <b class="font-xl" style="margin-bottom: 8px">For readers</b>
            <p style="margin-bottom: 16px">
              Where you find exciting stories and can influence the direction of
              them.
            </p>
            <ion-button @click="router.push('/overview')"
              >Read a story</ion-button
            >
          </div>
        </div>
        <div
          style="display: flex; flex-direction: row; color: rgba(1, 40, 49, 1)"
        >
          <div style="width: 300px; text-align: right; margin-left: auto">
            <b class="font-xl" style="margin-bottom: 8px">For writers</b>
            <p style="margin-bottom: 16px">
              Where you can interact with an engaged community and find
              inspiration through other creatives.
            </p>
            <ion-button fill="clear" @click="router.push('/story/new')"
              >Learn more</ion-button
            >
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
          class="font-xxl"
          style="
            color: rgba(1, 40, 49, 1);

            margin-bottom: 20px;
            display: block;
            margin-top: 3rem;
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
            padding-left: 3rem;
            padding-right: 3rem;
            border-radius: 8px;
          "
        >
          <story-nft-preview
            class="start-page-nft"
            :nfts="story?.top_nfts"
            :extended="true"
            style="margin-right: 2rem"
          />
          <div
            style="
              display: flex;
              flex-direction: column;
              text-align: left;
              color: rgba(1, 40, 49, 1);
            "
          >
            <b class="font-lg">{{ story.name }}</b>
            <div>
              <span
                class="font-sm"
                style="cursor: pointer"
                @click="router.push('/profile/' + story.creator)"
                >By {{ nameStore.name(story.creator) }}</span
              >
            </div>
            <div class="font-secondary">
              <span>{{ story.owners }} Owners</span> -
              <span>{{ story.likes }} Likes</span>
            </div>
            <p style="margin-bottom: 2rem">{{ content.substr(0, 240) }}...</p>
            <div>
              <ion-button @click="router.push('/story/' + story.id + '/read/')"
                >Continue reading</ion-button
              >
              <ion-button fill="clear" @click="router.push('/overview')"
                >Explore more stories</ion-button
              >
            </div>
          </div>
        </div>
      </template>

      <div
        style="
          background: rgba(255, 245, 233, 1);
          border: 1px solid rgba(204, 111, 0, 1);
          margin-top: 6rem;
          padding: 2rem;
          border-radius: 8px;
          max-width: 750px;
          margin-left: auto;
          margin-right: auto;
        "
      >
        <div
          style="
            display: flex;
            flex-direction: row;
            margin-bottom: 2rem;
            margin-left: -4rem;
          "
        >
          <img
            src="@/../public/assets/road_tree.svg"
            alt=""
            style="
              width: 200px;
              height: 180px;
              margin-top: -30px;
              margin-right: 3rem;
            "
          />
          <div
            style="
              width: 300px;
              text-align: left;
              color: rgba(1, 40, 49, 1);
              margin-right: auto;
            "
          >
            <b class="font-xl" style="margin-bottom: 8px">Influence</b>
            <p style="margin-bottom: 16px">
              The best stories are created together. Here you can influence the
              direction of a story.
            </p>
            <ion-button @click="router.push('/overview')"
              >Vote on a story now</ion-button
            >
          </div>
        </div>
        <div
          style="
            display: flex;
            flex-direction: row;
            color: rgba(1, 40, 49, 1);
            margin-right: -4rem;
          "
        >
          <div style="width: 300px; text-align: right; margin-left: auto">
            <b class="font-xl" style="margin-bottom: 8px">Be Rewarded</b>
            <p style="margin-bottom: 16px">
              Contributors should be rewarded for their work. Here creators AND
              readers are rewarded by receiving a share in the story.
            </p>
            <ion-button fill="clear" @click="router.push('/overview/authors')"
              >Learn more</ion-button
            >
            <ion-button @click="router.push('/overview/authors')"
              >Top share holders</ion-button
            >
          </div>
          <img
            src="@/../public/assets/money_book.png"
            alt=""
            style="
              width: 200px;
              height: 200px;
              margin-top: -30px;
              margin-left: 3rem;
            "
          />
        </div>
      </div>

      <template v-if="topAuthors.length > 0">
        <b
          class="font-xxl"
          style="
            color: rgba(1, 40, 49, 1);

            margin-bottom: 20px;
            display: block;
            margin-top: 3rem;
          "
          >Leaderboard</b
        >
        <div
          style="
            background: rgba(255, 245, 233, 1);
            border: 1px solid rgba(204, 111, 0, 1);
            padding: 3rem;
            padding-bottom: 2rem;
            border-radius: 8px;
            max-width: 750px;
            margin-left: auto;
            margin-right: auto;
          "
        >
          <div>
            <div class="leader" v-if="topAuthors[1]">
              <span>#2</span>
              <nft-element
                :nft="getAvatar(topAuthors[1].user)"
                class="author"
                size="lg"
                @click="router.push('/profile/' + topAuthors[1].user)"
              />
              <b>{{ nameStore.name(topAuthors[1].user) }}</b>
            </div>
            <div class="leader" style="margin-left: 1rem; margin-right: 1rem">
              <span>#1</span>
              <nft-element
                :nft="getAvatar(topAuthors[0].user)"
                class="author"
                size="xl"
                @click="router.push('/profile/' + topAuthors[0].user)"
              />
              <b>{{ nameStore.name(topAuthors[0].user) }}</b>
            </div>
            <div class="leader" v-if="topAuthors[2]">
              <span>#3</span>
              <nft-element
                :nft="getAvatar(topAuthors[2].user)"
                class="author"
                size="lg"
                @click="router.push('/profile/' + topAuthors[2].user)"
              />
              <b>{{ nameStore.name(topAuthors[2].user) }}</b>
            </div>

            <ion-grid style="margin-top: 24px; margin-bottom: 24px">
              <ion-row style="padding-bottom: 0.5rem; font-weight: 700">
                <ion-col></ion-col>
                <ion-col></ion-col>
                <ion-col>Author</ion-col>
                <ion-col>Shares</ion-col>
              </ion-row>
              <ion-row
                v-for="(author, i) in topAuthors"
                :key="author.user"
                @click="router.push('/profile/' + author.user)"
              >
                <ion-col>#{{ i + 1 }}</ion-col>
                <ion-col>{{ nameStore.name(author.user) }}</ion-col>
                <ion-col>{{ author.stories }}</ion-col>
                <ion-col>{{ author.shares }}</ion-col>
              </ion-row>
            </ion-grid>
          </div>
          <ion-button @click="router.push('/overview')"
            >Explore top stories</ion-button
          >
        </div>
      </template>

      <div
        style="
          background: rgba(255, 245, 233, 1);
          border: 1px solid rgba(204, 111, 0, 1);
          padding-top: 2rem;
          padding-bottom: 2rem;
          border-radius: 8px;
          margin-top: 3rem;
          display: none;
        "
      >
        <b class="font-lg">People love ONCE UPON</b>
        <div
          style="
            width: 100%;
            height: 400px;
            margin-top: 1rem;
            display: flex;
            flex-direction: column;
            padding: 1rem;
            flex-wrap: wrap;
          "
        >
          <div class="quote">
            <b>Lorem ipsum dolor sit amet, c</b>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <span>Alisha</span>
          </div>
          <div class="quote">
            <b>Lorem ipsum dolor sit amet, c</b>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <span>Alisha</span>
          </div>
          <div class="quote">
            <b>Lorem ipsum dolor sit amet, c</b>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <span>Alisha</span>
          </div>
          <div class="quote">
            <b>Lorem ipsum dolor sit amet, c</b>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <span>Alisha</span>
          </div>
          <div class="quote">
            <b>Lorem ipsum dolor sit amet, c</b>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <span>Alisha</span>
          </div>
        </div>
      </div>

      <login-modal />
      <div
        style="
          display: flex;
          justify-content: space-between;
          box-shadow: none;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          margin-top: 3rem;
          background: var(--ion-background-color, #fff);
          color: var(--second-color);
        "
      >
        <div>
          <div style="display: flex; flex-direction: column; text-align: left">
            <b>ONCE UPON</b>
            <span class="font-sm">Own your story</span>
          </div>
        </div>
        <div style="display: flex; align-items: center">
          <div class="links">
            <a href="/overview" style="margin-right: 1rem">Explore</a>
            <a href="/story/new">Write Stories</a>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; text-align: left">
          <b>Follow</b>
          <div class="follow-buttons">
            <a href="https://twitter.com/OnceUponNft">
              <div style="margin-right: 8px; background: white">
                <ion-avatar style="">
                  <img src="@/../public/assets/twitter-logo.png" alt="" />
                </ion-avatar>
              </div>
            </a>
            <a href="https://t.me/+-QjBZgq-shY5MGIy">
              <div style="background: #1b95e0">
                <ion-avatar style="">
                  <img
                    src="https://telegram.org/img/oauth/tg_button_large.png"
                    alt=""
                  />
                </ion-avatar>
              </div>
            </a>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonPage,
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
import { getAvatar } from "../scripts/getAvatar";
import NftElement from "@/components/NftElement.vue";

const configStore = useConfigStore();
const storyStore = useStoryStore();
const nameStore = useNameStore();
const authStore = useAuthStore();
const router = useRouter();

const story = ref();
const topAuthors = ref([]);

const content = computed(() =>
  story.value ? storyStore.cidLookup[story.value.first_section.content_cid] : ""
);

onMounted(async () => {
  story.value = (await storyStore.loadStories(1))[0];
  const authors = await storyStore.loadAuthors(5);
  topAuthors.value = authors;
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
  margin-top: 0.5rem;

  > a > div {
    height: 37px;
    width: 37px;
    cursor: pointer;
    border-radius: 50%;
  }

  ion-avatar {
    padding: 6px;
    display: flex;
    height: 100%;
    width: 100%;
    cursor: pointer;
    img {
      border-radius: 0;
    }
  }
}

.leader {
  display: inline-block;
  position: relative;

  .author {
    border: 2px solid rgba(242, 103, 9, 1);
  }

  > span {
    position: absolute;
    left: 0;
    font-weight: 700;
  }
}

ion-row:nth-child(even) {
  background: rgba(255, 215, 168, 0.2);
}

.quote {
  width: 33%;
  background: rgba(255, 215, 168, 0.2);
  text-align: left;
  padding: 0.5rem;
  flex: 1;
  margin-bottom: 0.5rem;
  margin-right: 0.5rem;
  border-radius: 8px;

  b {
    @extend .font-sm;
  }

  p {
    @extend .font-sm;
    padding-bottom: 4px;
  }
  span {
    @extend .font-sm;
    float: right;
  }
}

.header-button.button-solid {
  --background: var(--second-color);
  --ion-color-base: var(--second-color);
}
#start-content::part(background) {
  background: none;
}
</style>
<style lang="scss">
#main-content::part(background) {
  background-image: url("@/../public/assets/start-pattern.svg");
  background-repeat: repeat;
}
.start-page-nft {
  .multiple-nft-wrapper,
  ion-avatar {
    width: 200px !important;
    height: 200px !important;
  }

  .multiple-nft-wrapper {
    border: 8px solid rgba(1, 108, 132, 1);
    border-radius: 18px;
  }
  ion-avatar img {
    border-radius: 0;
  }
}
</style>