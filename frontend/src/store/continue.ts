import { useNameStore } from "./names";
import { useNftStore } from "./nfts";
import { defineStore } from "pinia";
import { useWalletStore } from "./wallet";
import axios from "axios";
import { execute } from "@/scripts/execute";
import { useStoryStore } from "./story";
// import { database } from "@/scripts/firebase";

interface State {
  proposals: {
    storyId: string;
    title: string;
    content: string;
  }[];
}

export const useContinueStore = defineStore("continueStore", {
  // convert to a function
  state: (): State => ({
    proposals: [],
  }),
  getters: {
    proposal: (state) => (storyId) => {
      return state.proposals.find((p) => p.storyId === storyId);
    },
  },
  actions: {
    async savePropsal(storyId, content) {
      const storyStore = useStoryStore();
      const story = await storyStore.getStory(storyId);
      this.removeProposal(storyId);
      this.$state.proposals.push({ storyId, content, title: story.name });
      localStorage.setItem("proposals", JSON.stringify(this.$state.proposals));
    },
    loadProposals() {
      const proposals = localStorage.getItem("proposals");
      if (proposals) {
        this.$patch({ proposals: JSON.parse(proposals) });
      }
    },
    removeProposal(storyId) {
      this.$state.proposals = this.$state.proposals.filter(
        (p) => p.storyId !== storyId
      );
      localStorage.setItem("proposals", JSON.stringify(this.$state.proposals));
    },
  },
});
