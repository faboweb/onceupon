<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding">
      <template v-if="story && loaded">
        <ion-button
          v-if="walletStore.isAdmin"
          @click="storyStore.removeStory(story.storyId)"
          >DELETE</ion-button
        >
        <h1
          style="
            font-size: 24px;
            font-family: 'Barlow', sans-serif;
            font-weight: 700;
            max-width: calc(100% - 120px);
          "
        >
          {{ story.name }}
        </h1>
        <a
          href="https://twitter.com/OnceUponNft?ref_src=twsrc%5Etfw"
          class="twitter-follow-button"
          data-show-count="false"
          style="position: absolute; top: 2.4rem; right: 1rem"
          >Get Updates</a
        >
        <div class="sections">
          <story-section
            v-for="section in story.sections || []"
            :key="section.id"
            :section="section"
          />
        </div>
        <template v-if="proposals.length > 0">
          <h1
            style="
              font-size: 24px;
              font-family: 'Barlow', sans-serif;
              font-weight: 700;
              max-width: calc(100% - 120px);
            "
          >
            Proposals
          </h1>

          <small
            style="
              font-size: 12px;
              color: gray;
              float: right;
              position: relative;
              top: -1.6rem;
            "
          >
            <template v-if="nextSectionPending">
              Voting ended ({{ nextSection }})
            </template>
            <template v-else> Voting ends ({{ nextSection }}) </template>
          </small>
          <div
            v-for="proposal in proposals"
            :key="proposal.id"
            style="
              text-align: left;
              flex-direction: column;
              margin-bottom: 1rem;
            "
          >
            <story-section :section="proposal">
              <template v-slot:buttons>
                <ion-button
                  size="small"
                  :disabled="
                    nextSectionPending ||
                    !walletStore.address ||
                    processingVotes.includes(proposal.section_id)
                  "
                  @click="vote(proposal.section_id)"
                  :fill="
                    proposalVote(proposal.section_id) === 1
                      ? 'outline'
                      : 'solid'
                  "
                  >{{
                    proposalVote(proposal.section_id) === 1 ? "Unlike" : "Like"
                  }}</ion-button
                >
                <ion-button
                  size="small"
                  color="danger"
                  :disabled="
                    nextSectionPending ||
                    !walletStore.address ||
                    processingVotes.includes(proposal.section_id)
                  "
                  @click="veto(proposal.section_id)"
                  :fill="
                    proposalVote(proposal.section_id) === 2
                      ? 'outline'
                      : 'solid'
                  "
                  >{{
                    proposalVote(proposal.section_id) === 2 ? "Unveto" : "veto"
                  }}</ion-button
                >
              </template>
            </story-section>
          </div>
        </template>
        <div
          style="
            box-shadow: rgba(192, 197, 214, 0.34) 5px 5px 50px;
            margin-left: -1rem;
            padding: 1rem;
            width: calc(100% + 2rem);
            margin-bottom: -1rem;
          "
        >
          <h1
            style="
              font-size: 24px;
              font-family: 'Barlow', sans-serif;
              font-weight: 700;
              margin-bottom: 1rem;
              margin-top: 0;
            "
          >
            How would you continue the story?
          </h1>
          <new-section ref="newSection" @submit="proposeSection" />
        </div>
        <!-- <ion-card
                    style="text-align: left; flex-direction: column"
                    :style="{
                      opacity: nextSectionPending ? 0.6 : 1,
                    }"
                  >
                  </ion-card> -->
      </template>
      <template v-else>
        <h1>
          <ion-skeleton-text
            :animated="true"
            style="width: 50%; line-height: 24px; margin-bottom: 1rem"
          ></ion-skeleton-text>
        </h1>

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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { loadingController, IonPage, IonContent, IonButton } from "@ionic/vue";
import { computed, onMounted, Ref, ref } from "vue";
import { useStoryStore } from "@/store/story";
import { useRoute, useRouter } from "vue-router";
import StorySection from "@/components/StorySection.vue";
import NewSection from "../components/NewSection.vue";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { formatDistance } from "date-fns";
import { useWalletStore, useNameStore, useNavigationStore } from "@/store";

const walletStore = useWalletStore();
const storyStore = useStoryStore();
const navigationStore = useNavigationStore();
const nameStore = useNameStore();
const route = useRoute();
const router = useRouter();
const storyId = String(route?.params.id);
const story: Ref<any> = ref(null);
const newSection = ref();
const loaded = ref(false);
const processingVotes: Ref<string[]> = ref([]);

onMounted(async () => {
  try {
    story.value = await storyStore.getStory(storyId);
  } catch (error) {
    console.error(error);
    router.push("/stories");
    return;
  }
  storyStore.loadVotes(storyId);
  navigationStore.backTo = "/stories";

  story.value.sections.forEach((proposal) => {
    nameStore.getName(proposal.proposer);
  });

  storyStore.loadProposals(storyId).then(() => {
    proposals.value.forEach((proposal) => {
      nameStore.getName(proposal.proposer);
    });
  });

  loaded.value = true;
});

const proposalVote = (proposalId) => {
  return storyStore.votes && storyStore.votes[storyId] && walletStore.address
    ? storyStore.votes[storyId].find(
        ({ section_id, user }) =>
          section_id === proposalId && user === walletStore.address
      )?.vote || undefined
    : undefined;
};
const vote = async (proposalId) => {
  processingVotes.value.push(proposalId);
  try {
    await storyStore.vote(
      storyId,
      proposalId,
      proposalVote(proposalId) === 1 ? "no" : "yes"
    );
  } finally {
    processingVotes.value = processingVotes.value.filter(
      (id) => id !== proposalId
    );
  }
};

const veto = async (proposalId) => {
  processingVotes.value.push(proposalId);
  try {
    await storyStore.vote(
      storyId,
      proposalId,
      proposalVote(proposalId) === 2 ? "no" : "veto"
    );
  } finally {
    processingVotes.value = processingVotes.value.filter(
      (id) => id !== proposalId
    );
  }
};

const proposals = computed(() => storyStore.proposals[storyId] || []);

const nextSection = computed(() => {
  return story.value?.assumedNextSectionBlockTime
    ? formatDistance(
        new Date(story.value.assumedNextSectionBlockTime),
        new Date(),
        { addSuffix: true }
      )
    : "";
});
const nextSectionPending = computed(() => {
  return new Date(story.value.assumedNextSectionBlockTime) < new Date();
});

const proposeSection = async ({ content, nft }) => {
  const loading = await loadingController.create({
    message: "Loading...",
    spinner: "circles",
  });
  loading.present();
  try {
    await storyStore.addSectionProposal(storyId, content, nft);
    storyStore.loadProposals(storyId);
    newSection.value.reset();
  } catch (error) {
    console.error(error);
  } finally {
    loading.dismiss();
  }
};
</script>
<style>
.sections ion-card:not(:last-child) {
  border-bottom: none;
}
ion-skeleton-text {
  line-height: 15px;
}
</style>
