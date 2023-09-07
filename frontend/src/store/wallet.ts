import { useNftStore } from "./nfts";
import { calculateFee, StdFee, GasPrice } from "@cosmjs/stargate";
import { defineStore } from "pinia";
import { useNameStore } from "./names";
import { useAuthStore } from "./auth";
import { useNetworkStore } from "./network";
import { CosmWasmClient } from "cosmwasm";
import { connectKeplr } from "@/scripts/keplr";

interface State {
  name: string | null;
  address: string | null;
  blocks: any;
  balances: any; // dict by address
  clients: any; // dict by chainId
  wallet: any | null;
}

export const useWalletStore = defineStore("wallet", {
  // convert to a function
  state: (): State => ({
    name: null,
    address: null,
    blocks: {},
    balances: {}, // dict by address
    clients: {}, // dict by chainId
    wallet: null,
  }),
  getters: {
    isLoggedIn: (state) => state.address !== null,
    isAdmin: (state) =>
      state.address === process.env.VUE_APP_ADMIN_ADDRESS_MAINNET,
    // @ts-ignore
    balance: (state) => (state.address ? state.balances[state.address] : 0),
  },
  actions: {
    async logInUser() {
      const networkStore = useNetworkStore();
      const network = networkStore.currentNetwork;

      try {
        this.wallet = await connectKeplr(network);
        // @ts-ignore
        this.name = this.wallet.name;
        // @ts-ignore
        this.address = this.wallet.address;
        localStorage.setItem("signedIn", "true");

        // @ts-ignore
        const nftStore = useNftStore();
        nftStore.loadOwnedNfts(this.address);
        const nameStore = useNameStore();
        nameStore.getName(this.address);

        this.getBalance(this.address).then((starsBalance) => {
          // @ts-ignore
          this.balances[this.address] = starsBalance;
        });

        const authStore = useAuthStore();
        authStore.setSignIn(
          {
            name: this.name,
            address: this.address,
          },
          "keplr"
        );
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    /**
     *
     * @param data
     */
    async logoutUser() {
      this.wallet.client.disconnect();

      this.name = null;
      this.address = null;
      localStorage.removeItem("signedIn");
    },
    async getClient() {
      const networkStore = useNetworkStore();
      const network = networkStore.currentNetwork;

      if (this.clients[network.name]) {
        return this.clients[network.name];
      }

      const cosmWasmClient = await CosmWasmClient.connect(network.url);

      this.clients[network.name] = cosmWasmClient;
      return cosmWasmClient;
    },
    async query(query) {
      const networkStore = useNetworkStore();
      const network = networkStore.currentNetwork;
      const cosmWasmClient = await this.getClient();
      // @ts-ignore
      return await cosmWasmClient.queryContractSmart(network.contract, query);
    },
    async execute(userAddress, entrypoint) {
      if (!this.wallet) {
        await this.logInUser();
      }
      const networkStore = useNetworkStore();
      const network = networkStore.currentNetwork;

      const command = Object.keys(entrypoint)[0];
      let fee: StdFee;
      switch (command) {
        case "remove_story":
          fee = calculateFee(25_000, GasPrice.fromString("0ustars"));
          break;
        case "vote":
          fee = calculateFee(300_000, GasPrice.fromString("0ustars"));
          break;
        case "new_story_section":
          fee = calculateFee(300_000, GasPrice.fromString("0ustars"));
          break;
        case "new_story":
          fee = calculateFee(350_000, GasPrice.fromString("0.5ustars"));
          break;
        default:
          fee = calculateFee(350_000, GasPrice.fromString("0.5ustars"));
          break;
      }
      const signingClient = this.wallet.client;
      await signingClient.execute(
        userAddress,
        network.contract,
        entrypoint,
        fee
      );
    },
    async getBlock(height?) {
      const client = await this.getClient();

      let block;
      if (!height) {
        block = await client.getBlock();
        height = block.header.height;
      }
      if (this.blocks[height]) return this.blocks[height];

      block = await client.getBlock(height).catch((err) => {
        console.log(err);
        return undefined;
      });
      if (!block) return undefined;
      this.blocks[block.header.height] = block;
      return block;
    },
    async getBalance(address) {
      const client = await this.getClient();
      const balance = await client.getBalance(address, "ustars");
      return Math.floor(Number(balance.amount) / 1000000);
    },
    async broadcast(txRaw) {
      const client = await this.getClient();
      return await client.broadcastTx(txRaw);
    },
  },
});
