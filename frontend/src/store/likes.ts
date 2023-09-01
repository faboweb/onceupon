import { callApi, callApiAuthenticated } from "@/scripts/api";
import { defineStore } from "pinia";

interface State {
  likes: any[];
}
export const useLikeStore = defineStore("likeStore", {
  // convert to a function
  state: (): State => ({
    likes: [],
  }),
  getters: {
    like: (state) => (section) => {
      return state.likes.find(
        (like) =>
          like.story_id === section.story_id &&
          like.section_id === section.section_id
      );
    },
  },
  actions: {
    signOut() {
      this.likes = [];
    },
    async getLikes(address) {
      const likes = await callApi("likes/" + address, "GET");
      return likes;
    },
    async loadLikes(address) {
      const likes = await this.getLikes(address);
      this.likes = likes;
    },
    toggleLike(section) {
      if (
        this.likes.find(
          (like) =>
            like.story_id === section.story_id &&
            like.section_id === section.section_id
        )
      ) {
        this.likes = this.likes.filter(
          (like) =>
            !(
              like.story_id === section.story_id &&
              like.section_id === section.section_id
            )
        );
      } else {
        this.likes.push(section);
      }
      callApiAuthenticated("like", "POST", section);
    },
  },
});
