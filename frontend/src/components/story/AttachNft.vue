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
    <nft-list :nfts="nfts" @click="(nft) => select(nft)" :clickable="true" />
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
import { useNftStore } from "@/store/nfts";
import { fromBech32, toBech32 } from "cosmwasm";
import { computed, defineEmits, onMounted, watch } from "vue";
import { FALLBACK_AVATAR } from "../../scripts/getAvatar";
import { useAuthStore } from "../../store";
import NftList from "../NftList.vue";

const authStore = useAuthStore();
const nftStore = useNftStore();

const emit = defineEmits(["selectNft"]);

const nfts = computed(() => {
  if (authStore.user.address) {
    const starsAddress = toBech32(
      "stars",
      fromBech32(authStore.user.address).data
    );
    return nftStore.getNfts(starsAddress) || [];
  }
  return [];
});

const select = (nft) => {
  emit("selectNft", nft);
};
const noNft = () => {
  emit("selectNft");
};

watch(
  () => authStore.user.address,
  () => {
    nftStore.loadNfts(authStore.user.address);
  },
  {
    immediate: true,
  }
);
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
