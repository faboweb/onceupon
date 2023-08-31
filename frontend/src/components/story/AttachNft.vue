<template>
  <div style="padding-left: 1rem; padding-right: 1rem">
    <div style="text-align: center; margin-top: 1rem">
      <b style="font-size: 16px">Choose NFT to add</b>
      <p
        style="
          margin-bottom: 1rem;
          font-size: 12px;
          text-align: center;
          color: rgb(255 255 255 60%);
        "
      >
        NFTS are linked to a section by it's ID. OnceUpon doesn't take ownership
        of your NFTs.
      </p>
    </div>
    <nft-list :nfts="nfts" />
    <template v-if="nfts.length === 0">
      <p style="text-align: center; margin-top: 2rem">
        You don't own any NFT yet. Go to
        <a href="https://stargaze.zone">Stargaze</a> to buy an NFT.
      </p>
    </template>
    <br />
    <div style="text-align: center; margin-top: 2rem">
      <ion-button @click="() => noNft()">No NFT</ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWalletStore } from "@/store/wallet";
import { useNftStore } from "@/store/nfts";
import { fromBech32, toBech32 } from "cosmwasm";
import { computed, defineEmits } from "vue";
import { FALLBACK_AVATAR } from "../../scripts/getAvatar";

const walletStore = useWalletStore();
const { getNfts } = useNftStore();

const emit = defineEmits(["selectNft"]);

const nfts = computed(() => {
  if (walletStore.address) {
    const starsAddress = toBech32(
      "stars",
      fromBech32(walletStore.address).data
    );
    return getNfts(starsAddress) || [];
  }
  return [];
});

const select = (nft) => {
  emit("selectNft", nft);
};
const noNft = () => {
  emit("selectNft");
};
</script>
<style scoped>
.nft {
  width: 100px;
  display: inline-block;
  height: 100px;
}
ion-avatar {
  --border-radius: 4px;
  margin-right: 1rem;
  margin-bottom: 1rem;
}
</style>
