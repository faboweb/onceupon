import { useAuthStore, useWalletStore } from "../store";
import { callApiAuthenticated } from "./api";

export const execute = async (command: string, data: any) => {
  const authStore = useAuthStore();
  const walletStore = useWalletStore();

  if (!authStore.isSignedIn) {
    throw new Error("User is not signed in");
  }
  if (authStore.signInMethod === "keplr") {
    await walletStore.execute(walletStore.address, {
      [command]: data,
    });
  } else {
    await callApiAuthenticated("executeWeb2", "POST", {
      command,
      data,
    });
  }
};
