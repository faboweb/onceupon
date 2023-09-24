<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-content
      :fullscreen="true"
      class="ion-padding"
      style="display: flex; flex-direction: column"
    >
      <div style="padding-bottom: 7rem">
        <div style="margin-bottom: 0.5rem; width: 100%; text-align: center">
          <b style="text-align: center">Create a story</b>
        </div>
        <div style="margin-bottom: 0.5rem">
          <b style="color: rgba(0, 0, 0, 0.6)">Title</b>
        </div>
        <ion-input
          placeholder="The tales of..."
          v-model="title"
          :style="{
            border: dirty && titleError ? '1px solid red' : '',
          }"
          style="background: rgba(217, 217, 217, 0.5); border-radius: 4px"
        ></ion-input>
        <div style="margin-bottom: 0.5rem; margin-top: 1rem">
          <b style="color: rgba(0, 0, 0, 0.6)">Write your first paragraph</b>
        </div>
        <ion-textarea
          placeholder="Once upon..."
          v-model="content"
          :rows="5"
          style="background: rgba(217, 217, 217, 0.5); border-radius: 4px"
          autoGrow="true"
        ></ion-textarea>
        <div
          style="text-align: right; margin-top: -1.5rem; margin-right: 0.5rem"
        >
          <small
            :style="{
              color: dirty && content.length < 240 ? 'red' : '',
            }"
            >Min 240 ({{ content.length }})</small
          >
        </div>
        <div style="margin-bottom: 0.5rem; margin-top: 1rem">
          <b style="color: rgba(0, 0, 0, 0.6)">Attach Nft</b>
        </div>
        <div
          style="
            display: flex;
            flex-direction: row;
            justify-content: space-between;
          "
        >
          <div
            @click="
              () => {
                if (authStore.isSignedIn) attachNftModal = true;
              }
            "
          >
            <ion-button
              fill="outline"
              v-if="!nft"
              :disabled="!authStore.isSignedIn"
              style="text-transform: none"
              ><ion-icon :icon="add"></ion-icon> Add NFT</ion-button
            >
            <ion-button fill="outline" style="text-transform: none" v-else
              ><nft-element :nft="nft" /> Change NFT</ion-button
            >
          </div>

          <div style="margin-top: -1rem; text-align: right">
            <ion-button
              v-if="authStore.isSignedIn"
              @click="aiWriter"
              fill="clear"
              style="text-transform: none; margin-top: 1rem"
              :disabled="authStore.signInMethod === 'keplr'"
              >Use Magic</ion-button
            >
            <ion-button
              v-if="authStore.isSignedIn"
              @click="save"
              color="primary"
              :disabled="content.length < 240"
              style="margin-top: 1rem"
              >Submit</ion-button
            >
            <ion-button
              v-else
              @click="authStore.showSignInModal = true"
              color="primary"
              >Connect Wallet</ion-button
            >
          </div>
        </div>
        <div
          v-if="error"
          style="color: rgb(242 31 68 / 70%); text-align: right; width: 100%"
        >
          {{ error }}
        </div>
      </div>

      <ion-modal
        :is-open="attachNftModal"
        @will-dismiss="attachNftModal = false"
      >
        <ion-content>
          <AttachNft @select-nft="attachNft" />
        </ion-content>
      </ion-modal>

      <mobile-footer />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonButton,
  IonTextarea,
  IonModal,
  IonInput,
  loadingController,
  IonPage,
  useIonRouter,
} from "@ionic/vue";
import AttachNft from "@/components/story/AttachNft.vue";
import { ref, computed, watch, onMounted } from "vue";
import { useStoryStore } from "@/store/story";
import { useAuthStore } from "../store";
import MobileFooter from "@/components/overview/MobileFooter.vue";
import { add } from "ionicons/icons";
import NftElement from "@/components/NftElement.vue";
import { callApiAuthenticated } from "../scripts/api";

const router = useIonRouter();
const storyStore = useStoryStore();
const authStore = useAuthStore();
const content = ref("");
const attachNftModal = ref(false);
const title = ref("");
const nft = ref();
const dirty = ref(false);
const error = ref();

const attachNft = async (_nft) => {
  nft.value = _nft;
  attachNftModal.value = false;
};

const titleError = computed(() => {
  return !title.value || title.value.length < 5;
});

const save = async () => {
  dirty.value = true;
  if (titleError.value) {
    return;
  }
  if (!content.value || content.value.length < 240) {
    error.value = "Write at least 240 characters to start a story.";
    return;
  }
  error.value = null;

  const loading = await loadingController.create({
    message: "Loading...",
    spinner: "circles",
  });
  loading.present();
  try {
    const storyId = await storyStore.addStory(
      content.value,
      title.value,
      nft.value
    );
    content.value = "";
    title.value = "";
    nft.value = undefined;
    localStorage.removeItem("draft");
    router.push("/story/" + storyId + "/read");
  } catch (err) {
    error.value = err.message;
    console.error(err);
  } finally {
    loading.dismiss();
  }
};

// TODO refactor with NewSection
const aiWriter = async () => {
  if (content.value.length < 50) {
    error.value = "Write at least 50 characters that describe the story.";
    return;
  }
  error.value = undefined;

  const loading = await loadingController.create({
    message: "Loading...",
    spinner: "circles",
  });
  loading.present();

  try {
    const { section } = await callApiAuthenticated("aistory", "POST", {
      description: content.value,
    });
    content.value = section;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.dismiss();
  }
};

let saveDebounce;
watch(
  () => [nft.value, content.value, title.value],
  () => {
    if (saveDebounce) {
      clearTimeout(saveDebounce);
    }
    saveDebounce = setTimeout(() => {
      localStorage.setItem(
        "draft",
        JSON.stringify({
          nft: nft.value,
          content: content.value,
          title: title.value,
        })
      );
    }, 1000);
  }
);

onMounted(() => {
  const draft = localStorage.getItem("draft");
  if (draft) {
    const { nft: _nft, content: _content, title: _title } = JSON.parse(draft);
    nft.value = _nft;
    content.value = _content;
    title.value = _title;
  }
});
</script>
<style scoped lang="scss">
ion-input input,
ion-textarea textarea {
  padding-left: 1rem !important;
}

.button-solid {
  --ion-color-primary: rgba(242, 103, 9, 1);
}

.button-outline {
  --border-color: rgba(242, 103, 9, 1);
  --color: rgba(242, 103, 9, 1);
}
</style>
<style lang="scss">
ion-textarea .native-wrapper,
ion-input .native-wrapper {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

ion-button > ion-avatar {
  max-height: 22px;
  max-width: 22px;
  margin-right: 0.5rem;
  border-radius: 0;
}
</style>