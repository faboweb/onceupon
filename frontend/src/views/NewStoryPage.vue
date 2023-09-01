<template>
  <ion-page style="padding-left: 0.5rem; padding-right: 0.5rem">
    <ion-content
      :fullscreen="true"
      class="ion-padding"
      style="display: flex; flex-direction: column"
    >
      <div style="margin-bottom: 0.5rem; width: 100%; text-align: center">
        <b style="font-size: 16px; text-align: center">Create a story</b>
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
      <div style="text-align: right; margin-top: -1.5rem; margin-right: 0.5rem">
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
      <div @click="attachNftModal = true">
        <ion-avatar v-if="nft">
          <img
            :src="nftStore.getNft(nft).image"
            :alt="nftStore.getNft(nft).name"
          />
        </ion-avatar>
        <ion-button v-if="!nft" :disabled="!authStore.isSignedIn">+</ion-button>
      </div>

      <ion-modal
        :is-open="attachNftModal"
        @will-dismiss="attachNftModal = false"
      >
        <ion-content>
          <AttachNft @select-nft="attachNft" />
        </ion-content>
      </ion-modal>

      <div style="margin-top: 2rem; text-align: right">
        <ion-button
          v-if="authStore.isSignedIn"
          @click="save"
          color="primary"
          :disabled="content.length < 240"
          style="margin-top: 1rem"
          >Submit</ion-button
        >
        <ion-button v-else @click="walletStore.logInUser()" color="primary"
          >Connect Wallet</ion-button
        >
      </div>

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
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonAvatar,
  loadingController,
  IonSelect,
  IonSelectOption,
  IonPage,
  IonCard,
} from "@ionic/vue";
import AttachNft from "@/components/story/AttachNft.vue";
import { ref, computed } from "vue";
import { useStoryStore } from "@/store/story";
import { useNftStore } from "@/store/nfts";
import { useWalletStore } from "@/store/wallet";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store";
import MobileFooter from "@/components/overview/MobileFooter.vue";

const router = useRouter();
const storyStore = useStoryStore();
const authStore = useAuthStore();
const content = ref("");
const attachNftModal = ref(false);
const nftStore = useNftStore();
const walletStore = useWalletStore();
const title = ref("");
const nft = ref();
const dirty = ref(false);
const contentError = ref(false);
const cycle = ref("week");

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
    contentError.value = true;
    return;
  }
  contentError.value = false;

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
    router.push("/story/" + storyId + "/read");
  } catch (error) {
    console.error(error);
  } finally {
    loading.dismiss();
  }
};
</script>
<style>
ion-card {
  box-shadow: 5px 5px 50px rgba(192, 197, 214, 0.34);
  border-radius: 15px;
  padding: 10px;
}
ion-input input,
ion-textarea textarea {
  padding-left: 1rem !important;
}
</style>
