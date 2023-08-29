import { useAuthStore, useWalletStore } from "../store";
import axios from "axios";

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
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("User is not signed in");
    }
    const token = await auth.currentUser.getIdToken();
    await axios.post(
      process.env.VUE_APP_API_URL + "executeWeb2",
      {
        command,
        data,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          //   "x-network": "testnet", // TODO remove/use network store
        },
      }
    );
    //   .then((response) => response.data);

    // await walletStore.broadcast(txRaw);
  }
};
