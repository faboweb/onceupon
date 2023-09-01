import { useNftStore } from "./nfts";
import { defineStore } from "pinia";
import { CosmWasmClient } from "cosmwasm";

interface State {
  names: any;
}

const endpoint = "https://rpc.stargaze-apis.com/";
const contract =
  "stars1fx74nkqkw2748av8j7ew7r3xt9cgjqduwn8m0ur5lhe49uhlsasszc5fhr";
const client = CosmWasmClient.connect(endpoint);

export const useNameStore = defineStore("nameStore", {
  // convert to a function
  state: (): State => ({
    names: {},
  }),
  getters: {
    name: (state) => (name) =>
      state.names[name]?.name ||
      name.substr(0, 10) + "..." + name.substr(name.length - 4, 4),
    avatar: (state) => (name) => state.names[name]?.nft,
  },
  actions: {
    /**
     * listens for state changes, ie a user logging in or out
     * and if logging in, loading the associated profile info
     * @returns
     */
    async getName(address) {
      if (this.names[address]) return this.names[address];

      try {
        const name = await (
          await client
        ).queryContractSmart(contract, {
          name: { address },
        });
        const nftInfo = await (
          await client
        ).queryContractSmart(contract, {
          nft_info: { token_id: name },
        });

        let nft;
        if (nftInfo?.extension?.image_nft) {
          nft = {
            token_id: nftInfo.extension.image_nft.token_id,
            contract_address: nftInfo.extension.image_nft.collection,
          };
          nft = await useNftStore().loadNft(nft);
        }

        this.names[address] = {
          name,
          nft,
        };
      } catch (err) {
        this.names[address] = { name: undefined };
      }
    },
  },
});
