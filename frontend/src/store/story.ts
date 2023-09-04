import { useNameStore } from "./names";
import { useNftStore } from "./nfts";
import { defineStore } from "pinia";
import { useWalletStore } from "./wallet";
import { execute } from "@/scripts/execute";
import { callApi } from "@/scripts/api";

interface State {
  stories: any[] | null;
  fullStories: any;
  proposals: any; // dictionary story id -> proposals
  shares: any;
  error: null;
  blocks: any; // dictionary height -> block
  cidLookup: any; // dictionary cid -> content
  contributions: any; // dictionary address -> story ids
  votes: any; // dictionary story id -> proposal id -> votes
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
    fullStories: {},
    proposals: {},
    shares: {},
    error: null,
    blocks: {},
    cidLookup: {},
    contributions: {},
    votes: {},
  }),
  getters: {
    allStories: (state) => state.stories,
  },
  actions: {
    async getStory(storyId) {
      if (this.fullStories[storyId]) {
        return this.fullStories[storyId];
      }
      const story = await callApi("story/" + storyId, "GET");

      this.loadContent(story.sections.map((section) => section.content_cid));

      this.fullStories[storyId] = story;

      return story;
    },
    async loadStories(limit?) {
      const stories = await callApi(
        "stories" + (limit ? "?limit" + limit : ""),
        "GET"
      );
      const nftStore = useNftStore();
      const nameStore = useNameStore();
      if (!limit) {
        this.stories = stories;
      }
      const cids: string[] = [];
      await Promise.all(
        stories.map(async (story) => {
          story.top_nfts.forEach((nft) => nftStore.loadNft(nft));
          cids.push(story.first_section.content_cid);
          nameStore.getName(story.creator);
        })
      );
      await this.loadContent(cids);
      return stories;
    },
    async loadProposals(storyId) {
      const walletStore = useWalletStore();
      const result = await walletStore.query({
        get_sections: { story_id: storyId },
      });
      this.proposals[storyId] = result;

      const cids: string[] = [];
      result.forEach((proposal) => {
        cids.push(proposal.content_cid);
      });
      this.loadContent(cids);
    },
    async loadShares(storyId) {
      const walletStore = useWalletStore();
      const result = await walletStore.query({
        get_shares: { story_id: storyId },
      });
      this.shares[storyId] = result;
    },
    async addStory(content, title, nft) {
      const storyId = generateUUID();

      // TODO to script
      const cid = await callApi("web3upload", "POST", {
        content,
      });

      await execute("new_story", {
        id: storyId,
        name: title,
        first_section: {
          section_id: generateUUID(),
          story_id: storyId,
          content_cid: cid,
          nft: nft
            ? {
                contract_address: nft.contract_address,
                token_id: nft.token_id,
              }
            : null,
          proposer: null,
        },
        interval: 12000 * 7, // need to calculate this
      });
      this.loadContent([cid]);
      this.loadStories();
      return storyId;
    },
    async addSectionProposal(storyId, content, nft) {
      if (!content) throw new Error("You need to write something");

      const cid = await callApi("web3upload", "POST", {
        content,
      });

      await execute("new_story_section", {
        section: {
          section_id: generateUUID(),
          story_id: storyId,
          content_cid: cid,
          nft: nft
            ? {
                contract_address: nft.contract_address,
                token_id: nft.token_id,
              }
            : null,
          proposer: null,
        },
      });
      this.loadContent([cid]);
      this.loadProposals(storyId);
    },
    async removeStory(storyId) {
      await execute("remove_story", {
        story_id: storyId,
      });
      this.stories = this.stories?.filter((s) => s.id !== storyId) || [];
    },
    async loadContent(cids: string[]) {
      const missing = cids.filter((cid) => !!cid && !this.cidLookup[cid]);

      if (missing.length === 0) return;

      const cidLookup = await callApi("resolveCIDs", "POST", {
        cids: missing,
      });

      this.cidLookup = { ...this.cidLookup, ...cidLookup };
    },
    async loadContributions(address) {
      const sections = await callApi("contributions/" + address, "GET");

      this.contributions[address] = sections;
      this.loadContent(sections.map((section) => section.content_cid));
    },
    async getAuthor(address) {
      const { stories, shares } = await callApi("author/" + address, "GET");

      return { stories, shares };
    },
    async loadAuthors(limit) {
      const nameStore = useNameStore();
      const authors = await callApi(
        "authors" + (limit ? "?limit=" + limit : ""),
        "GET"
      );
      authors.forEach((author) => nameStore.getName(author.address));

      return authors;
    },
    async loadVotes(storyId) {
      const walletStore = useWalletStore();
      const result = await walletStore.query({
        get_votes: { story_id: storyId },
      });

      this.votes[storyId] = result;
    },
  },
});
