<template>
  <ion-page>
    <ion-content>
      <div style="padding-top: 1rem">
        <template v-if="story && loaded">
          <!-- <ion-button
          v-if="walletStore.isAdmin"
          @click="storyStore.removeStory(story.storyId)"
          >DELETE</ion-button
        > -->
          <!-- <a
          href="https://twitter.com/OnceUponNft?ref_src=twsrc%5Etfw"
          class="twitter-follow-button"
          data-show-count="false"
          style="position: absolute; top: 2.4rem; right: 1rem"
          >Get Updates</a
        > -->
          <div class="sections">
            <story-section
              v-for="section in story.sections || []"
              :key="section.section_id"
              :section="section"
            />
          </div>
          <hr
            style="
              margin-left: -4rem;
              margin-right: -4rem;
              background: rgba(0, 0, 0, 0.1);
            "
          />
          <div
            style="
              margin-left: -1rem;
              padding: 1rem;
              width: calc(100% + 2rem);
              margin-bottom: -1rem;
            "
          >
            <new-section :story-id="storyId" />
          </div>
        </template>
        <template v-else>
          <template v-for="i in [0, 1, 2]" :key="i">
            <div style="margin-bottom: 1.5rem">
              <div style="display: flex; flex-direction: row">
                <ion-thumbnail
                  style="height: 80px; width: 80px; padding: 0 8px 8px 0"
                >
                  <ion-skeleton-text :animated="true"></ion-skeleton-text>
                </ion-thumbnail>
                <div style="flex: 1">
                  <ion-skeleton-text :animated="true"></ion-skeleton-text>
                  <ion-skeleton-text :animated="true"></ion-skeleton-text>
                  <ion-skeleton-text :animated="true"></ion-skeleton-text>
                  <ion-skeleton-text :animated="true"></ion-skeleton-text>
                </div>
              </div>
              <ion-skeleton-text :animated="true"></ion-skeleton-text>
              <ion-skeleton-text :animated="true"></ion-skeleton-text>
              <ion-skeleton-text :animated="true"></ion-skeleton-text>
              <ion-skeleton-text :animated="true"></ion-skeleton-text>
            </div>
          </template>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { loadingController, IonPage, IonContent, IonButton } from "@ionic/vue";
import { computed, onMounted, Ref, ref } from "vue";
import { useStoryStore } from "@/store/story";
import { useRoute, useRouter } from "vue-router";
import StorySection from "@/components/story/StorySection.vue";
import NewSection from "../../components/story/NewSection.vue";
import { formatDistance } from "date-fns";
import { useWalletStore, useNameStore, useNavigationStore } from "@/store";
import { useAuthStore } from "../../store";
import { useContinueStore } from "../../store/continue";

const walletStore = useWalletStore();
const storyStore = useStoryStore();
const navigationStore = useNavigationStore();
const nameStore = useNameStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const storyId = String(route?.params.id);
const story: Ref<any> = ref(null);
const loaded = ref(false);

onMounted(async () => {
  try {
    story.value = await storyStore.getStory(storyId);
  } catch (error) {
    console.error(error);
    router.push("/stories");
    return;
  }
  navigationStore.backTo = "/stories";

  story.value.sections.forEach((proposal) => {
    nameStore.getName(proposal.proposer);
  });

  loaded.value = true;
});
</script>
<style>
.sections ion-card:not(:last-child) {
  border-bottom: none;
}
ion-skeleton-text {
  line-height: 15px;
}
</style>
