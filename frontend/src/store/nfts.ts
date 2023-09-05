import { defineStore } from "pinia";
import { loadNft, loadOwnedNftsForAddress } from "@/scripts/stargaze";
import { useNetworkStore } from "./network";
import { callApi } from "@/scripts/api";

interface State {
  nfts: any;
}
export const useNftStore = defineStore("nftStore", {
  // convert to a function
  state: (): State => ({
    nfts: {},
  }),
  getters: {
    getNfts: (state) => (address) =>
      state.nfts[address]?.map((key) => state.nfts[key]) || [],
    getNft: (state) => (nft) => {
      return (
        state.nfts[getNftKey(nft)] || {
          image: null,
        }
      );
    },
  },
  actions: {
    async loadNft(nft) {
      if (!nft) return;
      if (this.$state.nfts[getNftKey(nft)])
        return this.$state.nfts[getNftKey(nft)];
      const networkStore = useNetworkStore();
      const token = await loadNft(networkStore.currentNetwork, nft);
      if (!token?.media) return;
      this.$state.nfts[getNftKeyApi(token)] = parseNft(token);
      return this.$state.nfts[getNftKeyApi(token)];
    },
    async loadOwnedNfts(address) {
      const networkStore = useNetworkStore();
      const tokens = await loadOwnedNftsForAddress(
        networkStore.currentNetwork,
        address
      );
      this.$state.nfts[address] = tokens.map(getNftKeyApi);
      for (const token of tokens) {
        this.$state.nfts[getNftKeyApi(token)] = parseNft(token);
      }
    },
    async getLinkedNfts(address) {
      const nfts = await callApi("nfts/" + address, "GET");
      return nfts;
    },
  },
});

export const getNftKeyApi = (token) => {
  return token.collection.contractAddress + "_" + token.tokenId;
};

export const getNftKey = (nft) => {
  return nft.contract_address + "_" + nft.token_id;
};

export const parseNft = (nft) => {
  return {
    contract_address: nft.collection.contractAddress,
    collection: nft.collection.name,
    token_id: nft.tokenId,
    name: nft.name,
    image: nft.media.image.jpgLink,
    key: nft.collection.contractAddress + "_" + nft.tokenId,
  };
};
