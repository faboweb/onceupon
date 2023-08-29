<template>
  <div>
    <b
      style="
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: rgba(0, 0, 0, 0.6);
      "
    >
      How would you continue the story?
    </b>
    <ion-icon
      :icon="expandOutline"
      style="float: right; margin-top: 4px; cursor: pointer"
      @click="expand = true"
    ></ion-icon>
    <ion-textarea
      style="background: rgb(244 243 234)"
      placeholder="Once upon..."
      v-model="content"
      :rows="5"
    ></ion-textarea>
    <span
      :style="{
        color: content.length < 240 && content.length > 0 ? 'red' : '',
        visibility: content.length >= 240 ? 'hidden' : 'visible',
      }"
      style="
        margin-top: -1.3rem;
        margin-right: 0.5rem;
        color: rgba(0, 0, 0, 0.6);
        font-family: Barlow;
        font-size: 12px;
        font-weight: 400;
        line-height: 14px;
        letter-spacing: 0em;
        text-align: right;
        float: right;
        background: rgb(244 243 234);
        z-index: 1000;
        position: relative;
      "
      >min {{ content.length }}/240 Characters</span
    >
    <div
      style="display: flex; margin-top: 1rem; justify-content: space-between"
    >
      <div
        @click="
          !props.disabled && walletStore.address && (attachNftModal = true)
        "
      >
        <ion-button
          fill="outline"
          v-if="!nft"
          :disabled="props.disabled || !walletStore.address"
          style="text-transform: none"
          ><ion-icon :icon="add"></ion-icon> Add NFT</ion-button
        >
        <ion-button fill="outline" style="text-transform: none" v-else
          ><nft-element :nft="nft" /> Change NFT</ion-button
        >
      </div>
      <ion-button
        v-if="authStore.isSignedIn"
        @click="save"
        color="primary"
        :disabled="props.disabled || content.length < 240"
        style="text-transform: none"
        >Submit</ion-button
      >
      <ion-button
        v-else
        @click="authStore.showSignInModal = true"
        color="primary"
        :disabled="props.disabled"
        style="text-transform: none"
        >Sign In</ion-button
      >
    </div>
    <ion-modal :is-open="attachNftModal" @will-dismiss="attachNftModal = false">
      <ion-content>
        <AttachNft @select-nft="attachNft" />
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="expand" @will-dismiss="expand = false">
      <div
        style="
          text-align: right;
          width: 100%;
          padding-right: 1rem;
          padding-top: 0.5rem;
          font-size: 24px;
        "
      >
        <ion-icon
          :icon="closeOutline"
          style="cursor: pointer"
          @click="expand = false"
        ></ion-icon>
      </div>
      <ion-textarea
        style="background: rgb(244 243 234); height: calc(100% - 4rem)"
        placeholder="Once upon..."
        v-model="content"
        :rows="5"
        :autogrow="true"
      ></ion-textarea
    ></ion-modal>
  </div>
</template>

<script setup lang="ts">
import { IonContent, IonButton, IonTextarea, IonModal } from "@ionic/vue";
import NftElement from "../NftElement.vue";
import AttachNft from "@/components/story/AttachNft.vue";
import {
  ref,
  defineProps,
  defineEmits,
  defineExpose,
  watch,
  onMounted,
} from "vue";
import { useNftStore } from "@/store/nfts";
import { useWalletStore } from "@/store/wallet";
import { useAuthStore, useStoryStore } from "../../store";
import { add, expandOutline, closeOutline } from "ionicons/icons";
import { useContinueStore } from "../../store/continue";
import { debounce } from "lodash";

const content = ref("");
const attachNftModal = ref(false);
const expand = ref(false);
const nftStore = useNftStore();
const walletStore = useWalletStore();
const authStore = useAuthStore();
const storyStore = useStoryStore();
const continueStore = useContinueStore();
const nft = ref();

const props = defineProps<{
  disabled: boolean;
  storyId: string;
}>();

const reset = () => {
  content.value = "";
  nft.value = null;
  continueStore.removeProposal(props.storyId);
};

const save = async () => {
  proposeSection({ content: content.value, nft: nft.value });
};

const debouncedSave = debounce(() => {
  continueStore.savePropsal(props.storyId, content.value);
}, 2000);
watch(content, () => {
  debouncedSave();
});

const setProposal = () => {
  if (continueStore.proposal(props.storyId)) {
    content.value = continueStore.proposal(props.storyId).content;
  }
};
watch(props, setProposal, {
  immediate: true,
});
watch(() => continueStore.proposal(props.storyId), setProposal);

const attachNft = async (_nft) => {
  nft.value = _nft;
  nftStore.loadNft(_nft);
  attachNftModal.value = false;
};

defineExpose({ reset });

const proposeSection = async ({ content, nft }) => {
  try {
    await storyStore.addSectionProposal(props.storyId, content, nft);
    storyStore.loadProposals(props.storyId);
    reset();
  } catch (error) {
    console.error(error);
  }
};
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

.textarea-wrapper,
textarea {
  height: 100%;
}
</style>
