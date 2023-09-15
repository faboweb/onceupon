<template>
  <ion-app>
    <ion-content id="main-content">
      <ion-router-outlet
        style="max-width: 1024px; margin-left: auto; margin-right: auto"
      />
    </ion-content>
    <login-modal />
  </ion-app>
</template>

<script setup lang="ts">
import "./scripts/firebase";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonBadge,
  IonChip,
  IonAvatar,
  IonLabel,
  IonFooter,
  IonMenu,
  IonMenuToggle,
  IonButton,
  IonIcon,
} from "@ionic/vue";
import { IonApp, IonRouterOutlet, toastController } from "@ionic/vue";
import { useAuthStore } from "./store";
import { menu, cartOutline } from "ionicons/icons";
import { onMounted } from "vue";
import LoginModal from "./views/LoginModal.vue";
import { getMessaging, onMessage } from "firebase/messaging";
import router from "./router";
import { RouterView } from "vue-router";

const authStore = useAuthStore();

authStore.loadFromLocalStorage();

const messaging = getMessaging();
onMessage(messaging, async (payload) => {
  if (payload.notification) {
    console.log("Message received. ", payload);
    const toast = await toastController.create({
      message: `${payload.notification.title}\n${payload.notification.body}`,
      duration: 5000,
      position: "top",
      cssClass: "toast",
    });
    toast.onclick = (ev) => {
      if (["story", "section"].includes(payload.data?.type)) {
        router.push("/story/" + payload.data.storyId + "/read");
      }
      if (["proposal"].includes(payload.data?.type)) {
        router.push("/story/" + payload.data.storyId + "/proposals");
      }
    };
    await toast.present();
  }
});

onMounted(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("firebase-messaging-sw.js", {
      scope: "./",
    });
  }
});
</script>
<style lang="scss">
.inner-scroll {
  padding: 0;
}
.header-md::after {
  background-image: none;
}
p {
  margin-bottom: 0;
}
@media screen and (max-width: 400px) {
  .hide-xs {
    display: none;
  }
}

img {
  border-radius: 10px;
}
ion-app {
  background: rgba(211, 211, 211, 0.29);
  margin: auto;
}

ion-button ion-avatar {
  height: 24px;
  width: 24px;
  margin-right: 1rem;
}

.sign-in-button::part(native) .button-inner {
  justify-content: left;
}
.sign-in-button ion-avatar {
  position: absolute;
  left: 1rem;
}

ion-header {
  box-shadow: none !important;
}

.author img {
  border-radius: 50%;
}

ion-icon {
  --ionicon-stroke-width: 52px;
}

ion-toolbar {
  display: flex;
  justify-content: space-between;
}

.toast::part(message) {
  white-space: pre-wrap;
}
.toast {
  // TODO
  --background: rgb(242, 242, 242);
  --color: rgba(1, 40, 49, 1);
}
</style>
