<template>
  <ion-modal
    id="sign-in-modal"
    :is-open="authStore.showSignInModal"
    @will-dismiss="authStore.showSignInModal = false"
    style="--height: 100%"
  >
    <ion-content style="text-align: center">
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
          @click="authStore.showSignInModal = false"
        ></ion-icon>
      </div>
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 2rem;
        "
      >
        <b style="font-size: 16px">login or sign up</b>
        <div
          style="
            color: rgba(3, 97, 118, 1);
            font-size: 24px;
            margin-top: 2rem;
            margin-bottom: 2rem;
          "
        >
          A world of stories awaits!
        </div>
        <ion-button
          @click="
            walletStore.logInUser();
            authStore.showSignInModal = false;
          "
          style="width: 331px; color: black; text-transform: none"
          color="white"
          class="sign-in-button"
        >
          <ion-avatar>
            <img alt="Keplr logo" src="@/../public/assets/keplr-logo.png" />
          </ion-avatar>
          <ion-label
            >Connect <span class="hide-xs">with &nbsp;Keplr</span></ion-label
          >
        </ion-button>
        <ion-button
          @click="
            web2AuthStore.signInWithGoogle();
            authStore.showSignInModal = false;
          "
          style="width: 331px; color: black; text-transform: none"
          color="white"
          class="sign-in-button"
        >
          <ion-avatar>
            <img alt="Google logo" src="@/../public/assets/google-logo.svg" />
          </ion-avatar>
          <ion-label>Connect with Google</ion-label>
        </ion-button>
        <ion-button
          @click="
            web2AuthStore.signInWithTwitter();
            authStore.showSignInModal = false;
          "
          style="width: 331px; color: black; text-transform: none"
          color="white"
          class="sign-in-button"
        >
          <ion-avatar>
            <img alt="Twitter logo" src="@/../public/assets/twitter-logo.png" />
          </ion-avatar>
          <ion-label>Connect with Twitter</ion-label>
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import {
  IonModal,
  IonButton,
  IonContent,
  IonAvatar,
  IonIcon,
} from "@ionic/vue";
import { useAuthStore, useWalletStore, useWeb2AuthStore } from "../store";
import { closeOutline } from "ionicons/icons";

const authStore = useAuthStore();
const web2AuthStore = useWeb2AuthStore();
const walletStore = useWalletStore();
</script>

<style scoped>
ion-button ion-avatar {
  height: 16px;
  width: 16px;
}
</style>