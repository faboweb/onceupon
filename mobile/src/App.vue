<template>
  <ion-app>
    <!-- <ion-split-pane when="md" content-id="main">
      <ion-menu content-id="main">
        <ion-header>
          <ion-toolbar color="tertiary">
            <ion-title>Menu</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding"> Menu Content </ion-content>
      </ion-menu> -->

      <!-- <div id="main"> -->
        <ion-header>
          <ion-toolbar>
            <ion-badge style="margin-left: 1rem" slot="start">
              <span class="hide-xs">Stargaze&nbsp;</span>Testnet
            </ion-badge>
            <!-- <ion-menu-toggle
              :auto-hide="false"
              style="margin-left: 1rem"
              slot="start"
            >
              <ion-button><ion-icon :icon="menu"></ion-icon></ion-button>
            </ion-menu-toggle> -->
            <ion-title class="ion-text-center">
              <router-link
                :to="'/stories'"
                style="color: black; text-decoration: none; font-family: Ribeye"
              >
                ONCEUPON
              </router-link>
            </ion-title>
            <ion-buttons slot="end" style="display: block">
              <!-- <router-link :to="'/stories'">
            <ion-button>Stories</ion-button>
          </router-link> -->
              <template v-if="walletStore.isLoggedIn">
                <ion-chip @click="walletStore.logoutUser()">
                  <nft-element
                    v-if="nameStore.avatar(walletStore.address)"
                    :nft="nameStore.avatar(walletStore.address)"
                  />
                  <ion-label>{{ walletStore.name }}</ion-label>
                </ion-chip>
              </template>

              <ion-chip v-else @click="walletStore.logInUser()">
                <ion-avatar>
                  <img
                    alt="Silhouette of a person's head"
                    src="../public/assets/keplr-logo.png"
                  />
                </ion-avatar>
                <ion-label
                  >Connect<span class="hide-xs">&nbsp;Wallet</span></ion-label
                >
              </ion-chip>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content id="main-content">
          <ion-router-outlet
            style="max-width: 600px; margin-left: auto; margin-right: auto"
          />
        </ion-content>
        <ion-footer translucent style="font-size: 6px">
          <a
            href="https://www.flaticon.com/free-icons/armchair"
            title="armchair icons"
            >Armchair icons created by mynamepong - Flaticon</a
          >
        </ion-footer>
      <!-- </div> -->
    <!-- </ion-split-pane> -->
  </ion-app>
</template>

<script setup lang="ts">
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
import NftElement from "./components/NftElement.vue";
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { useWalletStore } from "@/store/wallet";
import { useNameStore } from "@/store/names";
import { menu } from "ionicons/icons";
const walletStore = useWalletStore();
const nameStore = useNameStore();
</script>
<style lang="scss">
@import "../public/fonts/style.css";

html {
  background-color: rgba(211, 211, 211, 0.29);
}

ion-card {
  margin: 0;
}

ion-card:not(:last-child) {
  margin-bottom: 0.5rem;
}
.inner-scroll {
  padding: 0;
}
h1 {
  font-weight: 700 !important;
  font-size: 20px;
  text-align: left;
  font-variant: all-petite-caps;
}
ion-avatar {
  max-width: 100%;
  height: auto;
}
.header-md::after {
  background-image: none;
}
p {
  margin-bottom: 0;
}

// @each $size, $size-value in $screen-breakpoints {
//   .hide-#{$size} {
//     @media (min-width: $size-value) {
//       display: none;
//     }
//   }
// }

@media screen and (max-width: 400px) {
  .hide-xs {
    display: none;
  }
}

.twitter-follow-button,
.twitter-follow-button:visited {
  background-color: #1b95e0;
  color: #fff;
  border-radius: 4px;
  height: 28px;
  font-weight: 500;
  font-size: 13px;
  line-height: 16px;
  padding: 6px 8px 8px 30px;
  text-decoration: none;
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2072%2072%22%3E%3Cpath%20fill%3D%22none%22%20d%3D%22M0%200h72v72H0z%22%2F%3E%3Cpath%20class%3D%22icon%22%20fill%3D%22%23fff%22%20d%3D%22M68.812%2015.14c-2.348%201.04-4.87%201.744-7.52%202.06%202.704-1.62%204.78-4.186%205.757-7.243-2.53%201.5-5.33%202.592-8.314%203.176C56.35%2010.59%2052.948%209%2049.182%209c-7.23%200-13.092%205.86-13.092%2013.093%200%201.026.118%202.02.338%202.98C25.543%2024.527%2015.9%2019.318%209.44%2011.396c-1.125%201.936-1.77%204.184-1.77%206.58%200%204.543%202.312%208.552%205.824%2010.9-2.146-.07-4.165-.658-5.93-1.64-.002.056-.002.11-.002.163%200%206.345%204.513%2011.638%2010.504%2012.84-1.1.298-2.256.457-3.45.457-.845%200-1.666-.078-2.464-.23%201.667%205.2%206.5%208.985%2012.23%209.09-4.482%203.51-10.13%205.605-16.26%205.605-1.055%200-2.096-.06-3.122-.184%205.794%203.717%2012.676%205.882%2020.067%205.882%2024.083%200%2037.25-19.95%2037.25-37.25%200-.565-.013-1.133-.038-1.693%202.558-1.847%204.778-4.15%206.532-6.774z%22%2F%3E%3C%2Fsvg%3E);
  background-repeat: no-repeat;
  background-size: 16px 13px;
  background-position: 8px 8px;
}
.twitter-follow-button:hover {
  background-color: #0c7abf;
}

img {
  border-radius: 10px;
}
ion-app {
  background: rgba(211, 211, 211, 0.29);
  margin: auto;
  --ion-font-family: Barlow, sans-serif;
}

// @media screen and (max-width: 768) {
//   ion-app {
//     max-width: 600px;
//   }
// }
</style>
