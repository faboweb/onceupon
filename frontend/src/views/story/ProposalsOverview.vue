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
                  processingVotes.includes(proposal.section_id)
                "
                @click="vote(proposal.section_id)"
                :fill="
                  proposalVote(proposal.section_id) === 1 ? 'outline' : 'solid'
                "
                >{{
                  proposalVote(proposal.section_id) === 1 ? "Unlike" : "Like"
                }}</ion-button
              >
              <ion-button
                size="small"
                :disabled="
                  nextSectionPending ||
                  !authStore.isSignedIn ||
                  processingVotes.includes(proposal.section_id)
                "
                @click="veto(proposal.section_id)"
                :fill="
                  proposalVote(proposal.section_id) === 2 ? 'outline' : 'solid'
                "
                >{{
                  proposalVote(proposal.section_id) === 2 ? "Unveto" : "Veto"
                }}</ion-button
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
          <new-section :story-id="storyId" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from "@ionic/vue";
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
import { formatDistance } from "date-fns";
import NewSection from "../../components/story/NewSection.vue";
import StorySection from "../../components/story/StorySection.vue";

const storyStore = useStoryStore();
const nameStore = useNameStore();
const continueStore = useContinueStore();
const walletStore = useWalletStore();
const authStore = useAuthStore();
const route = useRoute();

const processingVotes = ref([]);

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

<style scoped>
ion-button {
  text-transform: none;
  height: 36px;
  font-size: 14px;
  font-weight: 600;

  --background: rgba(242, 103, 9, 1);
}
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