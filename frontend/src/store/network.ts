import { defineStore } from "pinia";
import { useStoryStore } from "./story";

interface State {
  network: string;
  networks: {
    name: string;
    walletRepoName: string;
    contract: string;
    url: string;
    graphql: string;
    chainId: string;
  }[];
}

export const useNetworkStore = defineStore("networkStore", {
  // convert to a function
  state: (): State => ({
    network: "testnet",
    networks: [
      {
        name: "mainnet",
        walletRepoName: "stargaze",
        contract: process.env.VUE_APP_CONTRACT_MAINNET || "",
        url: "https://rpc.stargaze-apis.com:443",
        graphql: "https://graphql.mainnet.stargaze-apis.com/graphql",
        chainId: "stargaze-1",
      },
      {
        name: "testnet",
        walletRepoName: "stargazetestnet",
        contract: process.env.VUE_APP_CONTRACT || "",
        url: "https://rpc.elgafar-1.stargaze-apis.com",
        // graphql: "https://galaxy-graphql-testnet.fly.dev/graphql",
        graphql: "https://graphql.mainnet.stargaze-apis.com/graphql",
        chainId: "elgafar-1",
      },
    ],
  }),
  getters: {
    currentNetwork: (state) => {
      const network = state.networks.find(
        (network) => network.name === state.network
      );
      if (!network) {
        throw new Error("Network not found");
      }
      return network;
    },
    getNetwork: (state) => (name: string) => {
      return state.networks.find((network) => network.name === name);
    },
  },
  actions: {
    setNetwork(network: string) {
      this.network = network;

      const storyStore = useStoryStore();
      storyStore.loadStories();
    },
  },
});
