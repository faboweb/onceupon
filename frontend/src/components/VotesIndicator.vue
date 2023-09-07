<template>
  <div
    style="cursor: pointer; position: relative"
    @click="votesStore.modalOpen = true"
  >
    <ion-badge
      v-if="votesStore.votes.length > 0"
      style="position: absolute; left: -1.3rem; --background: var(--main-color)"
      >{{ votesStore.votes.length }}</ion-badge
    >
    <!-- <b>Votes</b> -->

    <ion-icon
      class="icon-button icon-lg"
      :icon="votesStore.votes.length > 0 ? fileTrayFull : fileTray"
    ></ion-icon>
    <ion-modal
      :is-open="votesStore.modalOpen"
      @will-dismiss="votesStore.modalOpen = false"
      style="--height: 100%"
    >
      <ion-content
        style="display: flex; flex-direction: column"
        class="ion-padding"
      >
        <b class="font-lg" style="margin-bottom: 1rem">Your Votes</b>
        <div
          style="
            text-align: right;
            width: 100%;
            padding-right: 1rem;
            padding-top: 0.5rem;
            position: absolute;
            right: 0;
            top: 0.5rem;
          "
        >
          <ion-icon
            class="icon-button icon-lg"
            :icon="closeOutline"
            style="cursor: pointer"
            @click="votesStore.modalOpen = false"
          ></ion-icon>
        </div>
        <div style="height: calc(100% - 7rem)">
          <ion-grid v-if="votesStore.votes.length > 0">
            <ion-row
              v-for="vote in votesStore.votes"
              :key="vote.storyId + vote.sectionId"
            >
              <ion-col
                size="2"
                style="
                  max-height: 6rem;
                  align-items: center;
                  display: flex;
                  justify-content: center;
                "
                :style="{
                  color:
                    vote.vote === 'yes'
                      ? 'var(--ion-color-success)'
                      : 'var(--ion-color-danger)',
                }"
              >
                {{ vote.vote.charAt(0).toUpperCase() + vote.vote.slice(1) }}
              </ion-col>
              <ion-col
                style="cursor: pointer"
                @click="
                  router.push('/story/' + vote.storyId + '/proposals');
                  votesStore.modalOpen = false;
                "
              >
                <div
                  v-if="
                    storyStore.stories.find((s) => s.id === vote.storyId) &&
                    storyStore.cidLookup[
                      storyStore.proposals[vote.storyId]?.find(
                        (p) => p.section_id === vote.sectionId
                      )?.content_cid
                    ]
                  "
                >
                  <b class="font-md">{{
                    storyStore.stories.find((s) => s.id === vote.storyId)?.name
                  }}</b>
                  <p class="font-sm">
                    {{
                      storyStore.cidLookup[
                        storyStore.proposals[vote.storyId]?.find(
                          (p) => p.section_id === vote.sectionId
                        )?.content_cid
                      ]
                    }}
                  </p>
                </div>
                <div v-else>
                  <ion-skeleton-text :animated="true"> </ion-skeleton-text>
                  <ion-skeleton-text :animated="true"> </ion-skeleton-text>
                </div>
              </ion-col>
              <ion-col
                size="1"
                :key="vote.storyId + vote.sectionId"
                @click="votesStore.removeVote(vote.storyId, vote.sectionId)"
                style="
                  max-height: 6rem;
                  align-items: center;
                  display: flex;
                  justify-content: center;
                  cursor: pointer;
                "
              >
                <ion-icon :icon="trashOutline"></ion-icon>
              </ion-col>
            </ion-row>
          </ion-grid>

          <div v-else class="card" style="margin-top: 1rem; white-space: wrap">
            You didn't vote on any proposal yet. Votes will show up here. You
            can then confirm the votes with the button below.
          </div>
        </div>

        <div style="text-align: right; margin-top: 1rem">
          <ion-button
            @click="sign()"
            :disabled="
              !(votesStore.votes.length && authStore.isSignedIn) ||
              votesStore.processing
            "
            >Confirm Votes</ion-button
          >
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonIcon,
  IonCol,
  IonRow,
  IonSkeletonText,
  IonGrid,
  IonButton,
  IonContent,
  IonModal,
} from "@ionic/vue";
import { computed, onMounted, ref, watch } from "vue";
import { useAuthStore, useStoryStore } from "../store";
import { useVotesStore } from "../store/votes";
import {
  closeOutline,
  fileTray,
  fileTrayFull,
  trashOutline,
} from "ionicons/icons";
import { useRoute, useRouter } from "vue-router";

const votesStore = useVotesStore();
const storyStore = useStoryStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const storyId = route.params.storyId;

const sign = async () => {
  await votesStore.signVotes();
  if (storyId) {
    await storyStore.loadVotes(storyId);
  }
};

const stories = computed(() => {
  return Array.from(new Set(votesStore.votes.map((vote) => vote.storyId)));
});

watch(
  () => stories.value,
  () => {
    stories.value.forEach(async (storyId) => {
      await storyStore.loadProposals(storyId);
    });
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  votesStore.loadVotes();
});
</script>

<style scoped lang="scss">
ion-row {
  max-height: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 0.5rem;

  &:last-child {
    border: none;
  }
}
p {
  height: 3.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>