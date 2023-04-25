import { useNftStore } from "./nfts";
import { calculateFee, StdFee, GasPrice } from "@cosmjs/stargate";
import { Decimal } from "@cosmjs/math";
import { defineStore } from "pinia";
import { WalletManager, Logger, DeviceType, OS } from "@cosmos-kit/core";
import { assets, chains } from "chain-registry";
import { Chain } from "@chain-registry/types";
import { wallets as keplrWallet } from "@cosmos-kit/keplr-extension";
import { wallets as keplrMobileWallet } from "@cosmos-kit/keplr-mobile";
import { useNameStore } from "./names";
import Bowser from "bowser";

const _chains = chains
  .filter((chain) => chain.chain_name.startsWith("stargaze"))
  .map((chain) => ({
    ...chain,
    fees: {
      fee_tokens: [
        {
          denom: "ustars",
          fixed_min_gas_price: 0,
          low_gas_price: 0,
          average_gas_price: 0,
          high_gas_price: 0.04,
        },
      ],
    },
  }));

const walletManager = new WalletManager(
  _chains,
  assets.filter((assets) => assets.chain_name.startsWith("stargaze")),
  // @ts-ignore
  [...keplrWallet, ...keplrMobileWallet],
  new Logger("DEBUG"),
  "stargaze",
  {
    signClient: {
      projectId: "a8510432ebb71e6948cfd6cde54b70f7",
      relayUrl: "wss://relay.walletconnect.org",
    },
  },
  {
    signingStargate: (chain: Chain) => {
      switch (chain.chain_name) {
        case "osmosis":
          return {
            gasPrice: new GasPrice(Decimal.zero(1), "uosmo"),
          };
        default:
          return void 0;
      }
    },
  }
);

export const useWalletStore = defineStore("wallet", {
  // convert to a function
  state: () => ({
    name: null,
    address: null,
    blocks: {},
    walletManager,
    balances: {}, // dict by address
  }),
  getters: {
    isLoggedIn: (state) => state.address !== null,
    isAdmin: (state) => state.address === process.env.VUE_APP_ADMIN_ADDRESS,
    // @ts-ignore
    balance: (state) => (state.address ? state.balances[state.address] : 0),
    wallet: (state) => {
      const walletRepo = state.walletManager.getWalletRepo("stargazetestnet");

      const parser = Bowser.getParser(window.navigator.userAgent);
      const env = {
        browser: parser.getBrowserName(true),
        device: (parser.getPlatform().type || "desktop") as DeviceType,
        os: parser.getOSName(true) as OS,
      };
      const isMobile = env.device === "mobile";
      const currentWallet = walletRepo.getWallet(
        isMobile ? "keplr-mobile" : "keplr-extension"
      );
      currentWallet?.setEnv(env);

      // ios: "https://apps.apple.com/us/app/keplr-wallet/id1567851089"
      // android: "https://play.google.com/store/apps/details?id=com.chainapsis.keplr&hl=en&gl=US"

      if (!currentWallet) {
        throw new Error("No wallet selected");
      }
      return currentWallet;
    },
  },
  actions: {
    autoLogin() {
      if (localStorage.getItem("signedIn")) {
        this.logInUser();
      }
    },
    async logInUser() {
      await this.wallet.connect();
      try {
        // @ts-ignore
        this.name = this.wallet.username;
        // @ts-ignore
        this.address = this.wallet.address;
        localStorage.setItem("signedIn", "true");

        // @ts-ignore
        const nftStore = useNftStore();
        nftStore.loadNfts(this.address);
        const nameStore = useNameStore();
        nameStore.getName(this.address);

        this.getBalance(this.address).then((starsBalance) => {
          // @ts-ignore
          this.balances[this.address] = starsBalance;
        });
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
      this.wallet.disconnect();

      this.name = null;
      this.address = null;
      localStorage.removeItem("signedIn");
    },
    async query(query) {
      const cosmWasmClient = await this.wallet.getCosmWasmClient();
      // @ts-ignore
      return await cosmWasmClient.queryContractSmart(
        process.env.VUE_APP_CONTRACT || "",
        query
      );
    },
    async execute(userAddress, entrypoint) {
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
      const signingClient = await this.wallet.getSigningCosmWasmClient();
      debugger;
      await signingClient.execute(
        userAddress,
        process.env.VUE_APP_CONTRACT || "",
        entrypoint,
        fee
      );
    },
    async getBlock(height?) {
      const client = await this.wallet.getStargateClient();

      let block;
      if (!height) {
        block = await client.getBlock();
        height = block.header.height;
      }
      if (this.blocks[height]) return this.blocks[height];

      block = await client.getBlock(height);
      if (!block) return undefined;
      this.blocks[block.header.height] = block;
      return block;
    },
    async getBalance(address) {
      const client = await this.wallet.getStargateClient();
      const balance = await client.getBalance(address, "ustars");
      return Math.floor(Number(balance.amount) / 1000000);
    },
  },
});
