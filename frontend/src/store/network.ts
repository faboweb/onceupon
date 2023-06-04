import { defineStore } from "pinia";
import { useStoryStore } from "./story";

interface State {
  network: string;
  networks: {
    name: string;
    contract: string;
    url: string;
  }[];
}

export const useNetworkStore = defineStore("networkStore", {
  // convert to a function
  state: (): State => ({
    network: "mainnet",
    networks: [
      {
        name: "mainnet",
        contract: process.env.VUE_APP_CONTRACT_MAINNET || "",
        url: "https://rpc.stargaze-apis.com:443",
      },
      {
        name: "testnet",
        contract: process.env.VUE_APP_CONTRACT || "",
        url: "https://rpc.elgafar-1.stargaze-apis.com",
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
