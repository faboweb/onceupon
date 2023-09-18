<template>
  <div>
    <b class="input-label"> How would you continue the story? </b>
    <ion-icon
      :icon="expandOutline"
      class="input-label icon-button icon-md"
      style="float: right; margin-top: 4px; cursor: pointer"
      @click="expand = true"
    ></ion-icon>
    <ion-textarea
      style="background: rgb(244 243 234); margin-top: 0.5rem"
      placeholder="Once upon..."
      v-model="content"
      :rows="5"
    ></ion-textarea>
    <span
      :style="{
        color: content.length < 240 && content.length > 0 ? 'red' : '',
        visibility: content.length >= 240 ? 'hidden' : 'visible',
      }"
      class="font-secondary"
      style="
        margin-top: -1.3rem;
        margin-right: 0.5rem;
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
          !props.disabled && authStore.user?.address && (attachNftModal = true)
        "
      >
        <ion-button
          fill="outline"
          v-if="!nft"
          :disabled="props.disabled || !authStore.user?.address"
          style="text-transform: none"
          ><ion-icon :icon="add"></ion-icon> Add NFT</ion-button
        >
        <ion-button fill="outline" style="text-transform: none" v-else
          ><nft-element :nft="nft" /> Change NFT</ion-button
        >
      </div>
      <div>
        <ion-button
          v-if="authStore.isSignedIn"
          @click="aiWriter"
          fill="clear"
          :disabled="props.disabled || processing"
          style="text-transform: none"
          >Use Magic</ion-button
        >
        <ion-button
          v-if="authStore.isSignedIn"
          @click="save"
          :disabled="props.disabled || content.length < 240 || processing"
          style="text-transform: none"
          >Submit</ion-button
        >
        <ion-button
          v-else
          @click="authStore.showSignInModal = true"
          :disabled="props.disabled"
          style="text-transform: none"
          >Sign In</ion-button
        >
      </div>
    </div>
    <div
      v-if="error"
      style="color: rgb(242 31 68 / 70%); text-align: right; width: 100%"
    >
      {{ error }}
    </div>
    <ion-modal :is-open="attachNftModal" @will-dismiss="attachNftModal = false">
      <ion-content>
        <AttachNft @select-nft="attachNft" />
      </ion-content>
    </ion-modal>

    <ion-modal :is-open="expand" @will-dismiss="expand = false">
      <div
        style="
          width: 100%;
          padding-right: 1rem;
          padding-left: 1rem;
          padding-top: 0.5rem;
          display: flex;
          justify-content: space-between;
        "
      >
        <b class="font-lg">{{ story.name }}</b>
        <ion-icon
          :icon="closeOutline"
          class="icon-button icon-lg"
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
import {
  IonContent,
  IonButton,
  IonTextarea,
  IonModal,
  IonIcon,
} from "@ionic/vue";
import NftElement from "../NftElement.vue";
import AttachNft from "@/components/story/AttachNft.vue";
import { ref, defineProps, defineExpose, watch, computed } from "vue";
import { useNftStore } from "@/store/nfts";
import { useAuthStore, useNetworkStore, useStoryStore } from "../../store";
import { add, expandOutline, closeOutline } from "ionicons/icons";
import { useContinueStore } from "../../store/continue";
import { debounce } from "lodash";
import { callApiAuthenticated } from "../../scripts/api";

const content = ref("");
const attachNftModal = ref(false);
const expand = ref(false);
const nftStore = useNftStore();
const authStore = useAuthStore();
const storyStore = useStoryStore();
const continueStore = useContinueStore();
const networkStore = useNetworkStore();
const nft = ref();
const error = ref();
const processing = ref(false);

const props = defineProps<{
  disabled?: boolean;
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

const aiWriter = async () => {
  if (content.value.length < 50) {
    error.value =
      "Write at least 50 characters that descripe your new section.";
    return;
  }
  error.value = undefined;
  processing.value = true;
  try {
    const { section } = await callApiAuthenticated("aisection", "POST", {
      storyId: props.storyId,
      description: content.value,
    });
    content.value = section;
  } catch (err) {
    error.value = err.message;
  } finally {
    processing.value = false;
  }
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
  nftStore.loadNft(networkStore.currentNetwork, _nft);
  attachNftModal.value = false;
};

defineExpose({ reset });

const proposeSection = async ({ content, nft }) => {
  error.value = undefined;
  processing.value = true;
  try {
    await storyStore.addSectionProposal(props.storyId, content, nft);
    storyStore.loadProposals(props.storyId);
    reset();
  } catch (_error: any) {
    error.value = _error.message;
  } finally {
    processing.value = false;
  }
};

const story = computed(() =>
  storyStore.stories.find((s) => s.id === props.storyId)
);
</script>
<style scoped lang="scss">
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
