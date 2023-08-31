import { useNetworkStore } from "@/store";
import axios from "axios";

export const callApiAuthenticated = async (path, method, body?) => {
  const networkStore = useNetworkStore();
  const { getAuth } = await import("firebase/auth");
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error("User is not signed in");
  }
  const token = await auth.currentUser.getIdToken();
  return await axios(process.env.VUE_APP_API_URL + path, {
    method,
    data: body,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-network": networkStore.currentNetwork.name,
    },
  }).then((res) => res.data);
};
