import { useNameStore } from "./names";
import { useNftStore } from "./nfts";
import { defineStore } from "pinia";
import { useWalletStore } from "./wallet";
import { execute } from "@/scripts/execute";
import { callApi } from "@/scripts/api";
import { generateUUID } from "@/scripts/guid";
import { useNetworkStore } from "./network";
import { voteToInt } from "./votes";

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
  authors: any[];
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
    authors: [],
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
        "stories" + (limit ? "?limit=" + limit : ""),
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
          // nameStore.getName(story.creator);
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
      const networkStore = useNetworkStore();

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
        interval:
          networkStore.currentNetwork.name === "mainnet"
            ? 12000 * 7 // need to calculate this
            : Math.floor(12000 / 24), // on testnet cycle every hour
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
    async loadAuthors(limit?) {
      const nameStore = useNameStore();
      const authors = await callApi(
        "authors" + (limit ? "?limit=" + limit : ""),
        "GET"
      );
      this.authors = this.authors.concat(
        authors.filter((a) => !this.authors.find((b) => b.user === a.user))
      );
      // authors.forEach((author) => nameStore.getName(author.user));
      authors.forEach((author) => {
        nameStore.names[author.user] = {
          name: author.name,
          image: author.image,
        };
      });

      return authors;
    },
    async loadVotes(storyId) {
      const walletStore = useWalletStore();
      const result = await walletStore.query({
        get_votes: { story_id: storyId },
      });

      this.votes[storyId] = result;
    },
    async addVote(storyId, sectionId, user, vote) {
      const existingVote = this.votes[storyId]?.find(
        (v) => v.user === user && v.section_id === sectionId
      );
      const voteNumber = voteToInt(vote);
      if (existingVote) {
        existingVote.vote = voteNumber;
      } else {
        this.votes[storyId].push({
          story_id: storyId,
          user,
          section_id: sectionId,
          vote: voteNumber,
        });
      }
    },
  },
});
