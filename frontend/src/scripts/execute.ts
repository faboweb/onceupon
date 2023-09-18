import { useAuthStore, useWalletStore } from "../store";
import { callApiAuthenticated } from "./api";

export const execute = async (command: string, data: any) => {
  const authStore = useAuthStore();
  const walletStore = useWalletStore();

  if (!authStore.isSignedIn) {
    throw new Error("User is not signed in");
  }
  if (
    authStore.signInMethod === "keplr" ||
    authStore.signInMethod === "keplrSignIn"
  ) {
    try {
      await walletStore.execute(walletStore.address, {
        [command]: data,
      });
    } catch (err: any) {
      console.log(err);
      const regexp = /.*Custom Error val: "(.+)".*/;
      const matches = regexp.exec(err.message);
      if (matches && matches[1]) {
        throw new Error(matches[1]);
      } else {
        throw err;
      }
    }
  } else {
    await callApiAuthenticated("executeWeb2", "POST", {
      command,
      data,
    });
  }
};
