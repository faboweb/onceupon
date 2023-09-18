<template>
  <ion-modal
    id="sign-in-modal"
    :is-open="authStore.showSignInModal"
    @will-dismiss="authStore.showSignInModal = false"
    style="--height: 100%"
  >
    <ion-content style="text-align: center">
      <div
        class="font-lg"
        style="
          text-align: right;
          width: 100%;
          padding-right: 1rem;
          padding-top: 0.5rem;
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
        <b class="font-md">login or sign up</b>
        <div
          class="font-lg"
          style="
            color: rgba(3, 97, 118, 1);
            margin-top: 2rem;
            margin-bottom: 2rem;
          "
        >
          A world of stories awaits!
        </div>

        <b style="margin-bottom: 1rem">Crypto Only</b>
        <ion-button
          @click="signIn('keplrWeb3')"
          style="width: 331px; text-transform: none"
          class="sign-in-button"
        >
          <ion-avatar>
            <img alt="Keplr logo" src="@/../public/assets/keplr-logo.png" />
          </ion-avatar>
          <ion-label>Connect with Keplr</ion-label>
        </ion-button>

        <b style="margin-top: 2rem; margin-bottom: 1rem"
          >Likes, notifications and other features:</b
        >
        <ion-button
          @click="signIn('keplrWeb2')"
          style="width: 331px; text-transform: none"
          class="sign-in-button"
        >
          <ion-avatar>
            <img alt="Keplr logo" src="@/../public/assets/keplr-logo.png" />
          </ion-avatar>
          <ion-label>Sign In with Keplr</ion-label>
        </ion-button>
        <ion-button
          @click="signIn('google')"
          style="width: 331px; text-transform: none"
          class="sign-in-button"
        >
          <ion-avatar>
            <img alt="Google logo" src="@/../public/assets/google-logo.svg" />
          </ion-avatar>
          <ion-label>Sign In with Google</ion-label>
        </ion-button>
        <ion-button
          @click="signIn('twitter')"
          style="width: 331px; text-transform: none"
          class="sign-in-button"
        >
          <ion-avatar>
            <img alt="Twitter logo" src="@/../public/assets/twitter-logo.png" />
          </ion-avatar>
          <ion-label>Sign In with Twitter</ion-label>
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import {
  IonModal,
  IonButton,
  IonContent,
  IonAvatar,
  IonIcon,
  IonLabel,
} from "@ionic/vue";
import { useAuthStore, useWalletStore, useWeb2AuthStore } from "../store";
import { closeOutline } from "ionicons/icons";

const authStore = useAuthStore();
const web2AuthStore = useWeb2AuthStore();
const walletStore = useWalletStore();

const signIn = async (method) => {
  switch (method) {
    case "keplrWeb3":
      await walletStore.logInUser();
      break;
    case "keplrWeb2":
      await web2AuthStore.signInWithKeplr();
      break;
    case "google":
      await web2AuthStore.signInWithGoogle();
      break;
    case "twitter":
      await web2AuthStore.signInWithTwitter();
      break;
  }
  authStore.showSignInModal = false;
};
</script>

<style scoped>
ion-button ion-avatar {
  height: 16px;
  width: 16px;
}
ion-button.button-solid {
  --background: inherit;
  color: black;
}
</style>