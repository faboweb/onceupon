import { defineStore } from "pinia";

interface State {
  votes: any[];
}
export const useVoteStore = defineStore("voteStore", {
  // convert to a function
  state: (): State => ({
    votes: [],
  }),
  getters: {},
  actions: {
    vote(storyId: string, sectionId: string, vote: number) {
      this.votes.push({ storyId, sectionId, vote });
    },
  },
});
