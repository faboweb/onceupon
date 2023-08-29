<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <h1>Start Your Story</h1>
      <ion-card>
        <ion-grid style="width: 100%">
          <ion-row>
            <ion-col
              size="2"
              @click="walletStore.address && (attachNftModal = true)"
            >
              <ion-avatar v-if="nft">
                <img
                  :src="nftStore.getNft(nft).image"
                  :alt="nftStore.getNft(nft).name"
                />
              </ion-avatar>
              <ion-button v-if="!nft" :disabled="!walletStore.address"
                >+</ion-button
              >
            </ion-col>
            <ion-col>
              <ion-input
                placeholder="The tales of..."
                v-model="title"
                :style="{
                  border: dirty && titleError ? '1px solid red' : '',
                }"
              ></ion-input>
              <small v-if="dirty && titleError" style="color: red"
                >{{ title.length }}/5</small
              >
              <ion-textarea
                placeholder="Once upon..."
                v-model="content"
                :rows="5"
                style="margin-bottom: 1rem"
                autoGrow="true"
              ></ion-textarea>
              <small
                :style="{
                  color: dirty && content.length < 240 ? 'red' : '',
                }"
                >Min 240 ({{ content.length }})</small
              >
              <ion-select
                placeholder="Select Period"
                interface="popover"
                style="display: inline-flex; float: right; padding: 0"
                :value="cycle"
                disabled
              >
                <ion-select-option value="day">Dayly</ion-select-option>
                <ion-select-option value="week">Weekly</ion-select-option>
                <ion-select-option value="month">Monthly</ion-select-option>
              </ion-select>
            </ion-col>
          </ion-row>
        </ion-grid>
        <ion-modal
          :is-open="attachNftModal"
          @will-dismiss="attachNftModal = false"
        >
          <ion-content>
            <AttachNft @select-nft="attachNft" />
          </ion-content>
        </ion-modal>
      </ion-card>
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
    content.value = ''
    title.value = ''
    nft.value = undefined
    router.push("/story/" + storyId + "/read");
  } catch (error) {
    console.error(error);
  } finally {
    loading.dismiss();
  }
};
</script>
<style scoped>
ion-card {
  box-shadow: 5px 5px 50px rgba(192, 197, 214, 0.34);
  border-radius: 15px;
  padding: 10px;
}
</style>
