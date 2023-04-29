<template>
  <div style="padding-left: 1rem; padding-right: 1rem">
    <h1 style="text-align: center">Choose NFT to add</h1>
    <p style="    margin-bottom: 1rem;
    font-size: 14px;
    text-align: center;">
      NFTS are linked to a section by it's ID. OnceUpon doesn't take ownership of your NFTs.
    </p>
    <ion-avatar
      v-for="nft in nfts"
      :key="nft.key"
      @click="() => select(nft)"
      button
      class="nft"
    >
      <img :src="nft.image" @error="(e) => (e.target.src = FALLBACK_AVATAR)" />
      <!-- <ion-card-header>
        <ion-card-title>{{nft.name}}</ion-card-title>
      </ion-card-header> -->
    </ion-avatar>
    <template v-if="nfts.length === 0">
      <p style="text-align: center">
        You don't own any NFT yet. Go to
        <a href="https://stargaze.zone">Stargaze</a> to buy an NFT.
      </p>
    </template>
    <br />
    <div style="text-align: center">
      <ion-button @click="() => noNft()">No NFT</ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWalletStore } from "@/store/wallet";
import { useNftStore } from "@/store/nfts";
import { fromBech32, toBech32 } from "cosmwasm";
import { computed, defineEmits } from "vue";
import { FALLBACK_AVATAR } from "../scripts/getAvatar";

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
