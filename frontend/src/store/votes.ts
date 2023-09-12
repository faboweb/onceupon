import { execute } from "@/scripts/execute";
import { defineStore } from "pinia";

const voteToInt = (vote) => {
  return {
    yes: 1,
    veto: 2,
    no: 0,
  }[vote];
};
export const voteFromInt = (vote) => {
  if (!vote) return "no";
  return {
    1: "yes",
    2: "veto",
    0: "no",
  }[vote];
};

interface State {
  votes: any[];
  processing: boolean;
  modalOpen: boolean;
}
export const useVotesStore = defineStore("votesStore", {
  // convert to a function
  state: (): State => ({
    votes: [],
    processing: false,
    modalOpen: false,
  }),
  getters: {},
  actions: {
    vote(storyId: string, sectionId: string, vote: string) {
      this.votes = this.votes.filter(
        (vote) => vote.storyId !== storyId || vote.sectionId !== sectionId
      );
      this.votes.push({ storyId, sectionId, vote });
      this.saveVotes();
    },
    removeVote(storyId: string, sectionId: string) {
      this.votes = this.votes.filter(
        (vote) => vote.storyId !== storyId || vote.sectionId !== sectionId
      );
      this.saveVotes();
    },
    async signVotes() {
      this.processing = true;
      try {
        await execute("vote", {
          votes: this.votes.map((vote) => ({
            story_id: vote.storyId,
            section_id: vote.sectionId,
            vote: voteToInt(vote.vote),
          })),
        });
        this.votes = [];
        this.saveVotes();
      } finally {
        this.processing = false;
      }
    },
    async saveVotes() {
      const _votes = JSON.stringify(this.votes);
      localStorage.setItem("votes", _votes);
    },
    async loadVotes() {
      const _votes = localStorage.getItem("votes");
      const votes = JSON.parse(_votes || "[]");
      this.votes = votes;
    },
  },
});
