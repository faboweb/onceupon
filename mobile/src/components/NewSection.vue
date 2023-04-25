<template>
  <ion-textarea
    style="border: 1px solid #e7e7e7; border-radius: 12px"
    placeholder="Once upon..."
    v-model="content"
    :rows="5"
  ></ion-textarea>
  <span
    :style="{
      color: content.length < 240 && content.length > 0 ? 'red' : '',
    }"
    style="
      margin-top: 0.5rem;
      color: #a8a8ab;
      font-family: Barlow;
      font-size: 12px;
      font-weight: 400;
      line-height: 14px;
      letter-spacing: 0em;
      text-align: right;
      float: right;
    "
    >Min. {{ content.length }}/240 Characters</span
  >
  <div style="display: flex; margin-top: 1rem">
    <div
      @click="!props.disabled && walletStore.address && (attachNftModal = true)"
    >
      <ion-button v-if="!nft" :disabled="props.disabled || !walletStore.address"
        >Add NFT</ion-button
      >
      <ion-button v-else><nft-element :nft="nft" /> Change NFT</ion-button>
    </div>
    <ion-button
      v-if="walletStore.address"
      @click="save"
      color="primary"
      :disabled="props.disabled || content.length < 240"
      >Submit</ion-button
    >
    <ion-button
      v-else
      @click="walletStore.logInUser()"
      color="primary"
      :disabled="props.disabled"
      >Connect Wallet</ion-button
    >
  </div>
  <ion-modal :is-open="attachNftModal" @will-dismiss="attachNftModal = false">
    <ion-content>
      <AttachNft @select-nft="attachNft" />
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonContent, IonButton, IonTextarea, IonModal } from "@ionic/vue";
import NftElement from "./NftElement.vue";
import AttachNft from "@/components/AttachNft.vue";
import { ref, defineProps, defineEmits, defineExpose } from "vue";
import { useNftStore } from "@/store/nfts";
import { useWalletStore } from "@/store/wallet";

const content = ref("");
const attachNftModal = ref(false);
const nftStore = useNftStore();
const walletStore = useWalletStore();
const nft = ref();
const reset = () => {
  content.value = "";
  nft.value = null;
};

const props = defineProps<{
  disabled: boolean;
}>();
const emit = defineEmits(["submit"]);

const save = async () => {
  emit("submit", {
    content: content.value,
    nft: nft.value,
  });
};

const attachNft = async (_nft) => {
  nft.value = _nft;
  nftStore.loadNft(_nft);
  attachNftModal.value = false;
};

defineExpose({ reset });
</script>
<style scoped>
ion-textarea {
  --padding-bottom: 1rem;
  --padding-top: 1rem;
  --padding-start: 1rem;
  --padding-end: 1rem;
}

ion-button > img {
  border-radius: 10px;
}
ion-button > ion-avatar {
  max-height: 22px;
  max-width: 22px;
  margin-right: 0.5rem;
  border-radius: 0;
}
</style>
