<template>
  <ion-page>
    <ion-content>
      <div style="padding-top: 1rem">
        <div
          style="text-align: right; float: right"
          :style="{
            visibility: self ? 'visible' : 'hidden',
          }"
        >
          <ion-button @click="authStore.signOut()">Sign Out</ion-button>
        </div>
        <!-- <div v-else style="text-align: right">
      <ion-button>Follow</ion-button>
    </div> -->
        <div
          style="
            justify-content: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          "
        >
          <nft-element
            :nft="profilePicture"
            :size="89"
            style="height: 89px; width: 89px"
            class="author"
          />
          <b style="margin-top: 1rem; font-size: 18px">{{ profileName }}</b>
        </div>
        <div style="margin-top: 1rem">
          <div
            style="font-size: 16px; color: rgba(0, 0, 0, 0.6); margin-top: 2rem"
          >
            {{ self ? "My " : "" }}Contributions
          </div>
          <div style="display: flex; flex-direction: row">
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
          </div>
        </div>
        <div>
          <div
            style="font-size: 16px; color: rgba(0, 0, 0, 0.6); margin-top: 2rem"
          >
            {{ self ? "My " : "" }}Likes
          </div>
          <div style="display: flex; flex-direction: row">
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
            <ion-skeleton-text
              style="height: 103px; width: 151px; margin-right: 1rem"
            ></ion-skeleton-text>
          </div>
        </div>
      </div>

      <mobile-footer />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore, useNameStore, useWalletStore } from "../store";
import NftElement from "../components/NftElement.vue";
import MobileFooter from "../components/overview/MobileFooter.vue";
import { IonPage, IonContent } from "@ionic/vue";

const route = useRoute();
const address = String(route?.params.address);

const authStore = useAuthStore();
const nameStore = useNameStore();
const profileName = computed(() => {
  return nameStore.name(address);
});
const profilePicture = computed(() => {
  return nameStore.avatar(address);
});

const self = computed(() => {
  return authStore.user?.address === address;
});

watch(
  () => address,
  () => {
    nameStore.getName(address);
  },
  {
    immediate: true,
  }
);
</script>

<style>
ion-button {
  background: rgba(242, 103, 9, 1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
}
.author img {
  border-radius: 50%;
}
</style>