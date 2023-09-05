<template>
  <ion-page>
    <ion-content>
      <div style="padding-top: 2.5rem">
        <div
          style="
            height: 2.5rem;
            text-align: right;
            background: #fffdf2;
            position: fixed;
            width: 100%;
            top: 0;
          "
        >
          <small
            style="
              font-size: 12px;
              margin-top: 1rem;
              display: block;
              text-align: right;
              color: rgb(0, 0, 0, 0.6);
            "
          >
            <template v-if="nextSectionPending">
              Voting ended ({{ nextSection }})
            </template>
            <template v-else> Voting ends ({{ nextSection }}) </template>
          </small>
        </div>
        <div>
          <div
            v-for="proposal in proposals"
            :key="proposal.section_id"
            class="proposal"
          >
            <story-section :section="proposal" />

            <div style="text-align: right">
              <ion-button
                size="small"
                :disabled="
                  nextSectionPending ||
                  !authStore.isSignedIn ||
                  votesStore.processing
                "
                @click="vote(proposal.section_id)"
                fill="solid"
              >
                <ion-icon
                  slot="start"
                  :icon="checkmark"
                  v-show="proposalVote(proposal.section_id) === 'yes'"
                ></ion-icon
                >Vote</ion-button
              >
              <ion-button
                size="small"
                :disabled="
                  nextSectionPending ||
                  !authStore.isSignedIn ||
                  votesStore.processing
                "
                @click="veto(proposal.section_id)"
                fill="outline"
              >
                <ion-icon
                  slot="start"
                  :icon="checkmark"
                  v-show="proposalVote(proposal.section_id) === 'veto'"
                ></ion-icon>
                Veto</ion-button
              >
            </div>
          </div>
        </div>
        <div
          v-if="proposals.length === 0"
          style="
            color: rgba(0, 0, 0, 0.6);
            padding: 1rem;
            text-align: center;
            font-size: 14px;
          "
        >
          There are no proposals yet.<br />Be the first to propose how the story
          continues!
        </div>

        <hr
          style="
            margin-left: -4rem;
            margin-right: -4rem;
            background: rgba(0, 0, 0, 0.1);
            width: 200%;
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
          <new-section :storyId="storyId" :disabled="false" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonIcon } from "@ionic/vue";
import { useRoute } from "vue-router";
import {
  useAuthStore,
  useNameStore,
  useNavigationStore,
  useStoryStore,
  useWalletStore,
} from "../../store";
import { computed, onMounted, Ref, ref, defineProps } from "vue";
import { useContinueStore } from "../../store/continue";
import { useVotesStore, voteFromInt } from "../../store/votes";
import { formatDistance } from "date-fns";
import NewSection from "../../components/story/NewSection.vue";
import StorySection from "../../components/story/StorySection.vue";
import { checkmark } from "ionicons/icons";

const storyStore = useStoryStore();
const nameStore = useNameStore();
const continueStore = useContinueStore();
const walletStore = useWalletStore();
const authStore = useAuthStore();
const votesStore = useVotesStore();
const route = useRoute();

const story = ref();
const storyId = String(route?.params.id);

const proposals = computed(() => storyStore.proposals[storyId] || []);

onMounted(async () => {
  storyStore.loadVotes(storyId);

  storyStore.loadProposals(storyId).then(() => {
    proposals.value.forEach((proposal) => {
      nameStore.getName(proposal.proposer);
    });
  });

  continueStore.loadProposals();

  story.value = await storyStore.getStory(storyId);
});

const proposalVote = (proposalId) => {
  const pendingVote = votesStore.votes.find(
    (vote) => vote.storyId === storyId && vote.sectionId === proposalId
  )?.vote;
  const submittedVote = storyStore.votes[storyId].find(
    (vote) => vote.section_id === proposalId
  )?.vote;
  return pendingVote || voteFromInt(submittedVote);
};
const vote = async (proposalId) => {
  votesStore.vote(
    storyId,
    proposalId,
    proposalVote(proposalId) === 1 ? "no" : "yes"
  );
};

const veto = async (proposalId) => {
  votesStore.vote(
    storyId,
    proposalId,
    proposalVote(proposalId) === 1 ? "no" : "veto"
  );
};

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
  return new Date(story.value?.assumedNextSectionBlockTime) < new Date();
});
</script>

<style scoped lang="scss">
.proposal {
  padding-bottom: 1rem;
}
.proposal:not(:first-child) {
  padding-top: 1rem;
}
.proposal:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
</style>