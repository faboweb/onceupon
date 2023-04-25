<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Listen to before and after tab change events -->
      <ion-tabs>
        <!-- Use v-slot:bottom with Vue ^2.6.0 -->
        <ion-router-outlet></ion-router-outlet>

        <ion-tab-bar slot="top">
          <ion-tab-button
            tab="read"
            :href="'/story/' + route.params.id + '/read'"
          >
            <ion-label>Story</ion-label>
          </ion-tab-button>

          <ion-tab-button
            tab="owners"
            :href="'/story/' + route.params.id + '/owners'"
          >
            <ion-label>Owners</ion-label>
          </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonTabBar,
  IonTabs,
  IonTabButton,
  IonLabel,
  IonRouterOutlet,
} from "@ionic/vue";
import { useRoute } from "vue-router";

const route = useRoute();
</script>
<style></style>
