import { useNameStore } from "./names";
import { useNftStore } from "./nfts";
import { defineStore } from "pinia";
import { useWalletStore } from "./wallet";

interface State {
  stories: any[] | null;
  proposals: any;
  shares: any;
  votes: any;
  error: null;
  blocks: any; // dictionary height -> block
}

function generateUUID() {
  // Public Domain/MIT
  let d = new Date().getTime(); //Timestamp
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const useStoryStore = defineStore("storyStore", {
  // convert to a function
  state: (): State => ({
    stories: [],
    proposals: {},
    votes: {},
    shares: {},
    error: null,
    blocks: {},
  }),
  getters: {
    allStories: (state) => state.stories,
  },
  actions: {
    async getStory(storyId) {
      const walletStore = useWalletStore();
      const { story } = await walletStore.query({
        get_story: { story_id: storyId },
      });
      const lastSectionBlock = await walletStore.getBlock(story.last_section);
      const currentBlock = await walletStore.getBlock();
      const heightDiff = currentBlock?.header.height - story.last_section;
      const timeDiff =
        new Date(currentBlock?.header.time).getTime() -
        new Date(lastSectionBlock.header.time).getTime();
      const assumedNextSectionBlockTime = new Date(
        new Date(lastSectionBlock.header.time).getTime() +
          (timeDiff / heightDiff) * story.interval
      );
      story.assumedNextSectionBlockTime = assumedNextSectionBlockTime;
      return story;
    },
    async loadStories() {
      const walletStore = useWalletStore();
      const nftStore = useNftStore();
      const nameStore = useNameStore();
      const result = await walletStore.query({ get_stories: {} });
      this.stories = result;
      result.forEach(async (story) => {
        story.top_nfts.forEach((nft) => nftStore.loadNft(nft));
        const lastSectionBlock = await walletStore.getBlock(story.last_section);
        const _story = this.stories?.find((s) => s.id === story.id);
        _story.lastUpdate = lastSectionBlock?.header.time;
        nameStore.getName(story.creator);
      });
    },
    async loadProposals(storyId) {
      const walletStore = useWalletStore();
      const result = await walletStore.query({
        get_sections: { story_id: storyId },
      });
      this.proposals[storyId] = result;
    },
    async loadVotes(storyId) {
      const walletStore = useWalletStore();
      const result = await walletStore.query({
        get_votes: { story_id: storyId },
      });

      this.votes[storyId] = result;
    },
    async loadShares(storyId) {
      const walletStore = useWalletStore();
      const result = await walletStore.query({
        get_shares: { story_id: storyId },
      });
      this.shares[storyId] = result;
    },
    async addStory(content, title, nft) {
      const walletStore = useWalletStore();
      const storyId = generateUUID();
      await walletStore.execute(walletStore.address, {
        new_story: {
          id: storyId,
          name: title,
          first_section: {
            section_id: generateUUID(),
            story_id: storyId,
            content,
            nft: nft
              ? {
                  contract_address: nft.contract_address,
                  token_id: nft.token_id,
                }
              : null,
            proposer: null,
          },
          interval: 12000 * 7, // need to calculate this
        },
      });
      this.loadStories();
      return storyId;
    },
    async addSectionProposal(storyId, content, nft) {
      if (!content) throw new Error("You need to write something");
      const walletStore = useWalletStore();
      await walletStore.execute(walletStore.address, {
        new_story_section: {
          section: {
            section_id: generateUUID(),
            story_id: storyId,
            content,
            nft: nft
              ? {
                  contract_address: nft.contract_address,
                  token_id: nft.token_id,
                }
              : null,
            proposer: null,
          },
        },
      });
      this.loadProposals(storyId);
    },
    async vote(storyId, proposalId, vote) {
      const walletStore = useWalletStore();
      const voteToInt = {
        yes: 1,
        veto: 2,
      }[vote];
      if (!voteToInt)
        throw new Error("vote " + vote + " is not an allowed value");
      await walletStore.execute(walletStore.address, {
        vote: {
          section_id: proposalId,
          story_id: storyId,
          vote: voteToInt,
        },
      });
      this.loadVotes(storyId);
    },
    async removeStory(storyId) {
      const walletStore = useWalletStore();
      await walletStore.execute(walletStore.address, {
        remove_story: {
          story_id: storyId,
        },
      });
      this.stories = this.stories?.filter((s) => s.id !== storyId) || [];
    },
  },
});
