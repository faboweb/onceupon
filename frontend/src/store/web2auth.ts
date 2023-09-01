import { defineStore } from "pinia";
import firebase from "firebase/compat/app";
import "firebaseui/dist/firebaseui.css";
import { useAuthStore } from "./auth";
import { firebaseConfig } from "@/scripts/firebase";
import axios from "axios";
import { useNetworkStore } from "./network";
import { callApi, callApiAuthenticated } from "@/scripts/api";
import { useWalletStore } from "./wallet";
import { signArbitrary } from "@/scripts/keplr";
import { updateProfile } from "firebase/auth";
// import { useWalletStore } from "./wallet";
// import { signArbitrary } from "@keplr-wallet/cosmos";
// import axios from "axios";

// interface State {}

firebase.initializeApp(firebaseConfig);

export const useWeb2AuthStore = defineStore("web2AuthStore", {
  // convert to a function
  // state: (): State => ({}),
  actions: {
    async signInWithTwitter() {
      const {
        getAuth,
        signInWithPopup,
        TwitterAuthProvider,
        useDeviceLanguage,
      } = await import("firebase/auth");
      const auth = getAuth();
      useDeviceLanguage(auth);
      const provider = new TwitterAuthProvider();
      return signInWithPopup(auth, provider)
        .then(async (result) => {
          const user = result.user;

          const { address } = await callApiAuthenticated("web2Address", "GET");

          const authStore = useAuthStore();
          authStore.setSignIn(
            {
              name: user.displayName,
              image: user.photoURL,
              address,
            },
            "twitter"
          );
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async signInWithGoogle() {
      const {
        getAuth,
        signInWithPopup,
        GoogleAuthProvider,
        setPersistence,
        browserLocalPersistence,
      } = await import("firebase/auth");
      const auth = getAuth();
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth, provider)
        .then(async (result) => {
          const user = result.user;

          const { address } = await callApiAuthenticated("web2Address", "GET");

          const authStore = useAuthStore();
          authStore.setSignIn(
            {
              name: user.displayName,
              image: user.photoURL,
              address,
            },
            "google"
          );
        })
        .catch((error) => {
          console.error(error);
        });
    },
    async signInWithKeplr() {
      const {
        getAuth,
        signInWithCustomToken,
        setPersistence,
        browserLocalPersistence,
      } = await import("firebase/auth");

      const networkStore = useNetworkStore();
      const walletStore = useWalletStore();

      await walletStore.logInUser();

      const address = walletStore.address;

      const nonce = await callApi("web3AuthNonce", "POST", {
        address,
      });
      const data = JSON.stringify({
        message: "Signing into OnceUpon",
        nonce,
      });
      const { signature } = await signArbitrary(
        networkStore.currentNetwork,
        data
      );

      const customToken = await callApi("web3Auth", "POST", {
        chainId: networkStore.currentNetwork.chainId,
        address,
        signature,
      });
      const auth = getAuth();
      await setPersistence(auth, browserLocalPersistence);

      return signInWithCustomToken(auth, customToken)
        .then((result) => {
          const user = result.user;

          updateProfile(user, {
            displayName: walletStore.name,
          });

          const authStore = useAuthStore();
          authStore.setSignIn(
            {
              name: walletStore.name,
              image: user.photoURL,
              address,
            },
            "keplrSignIn"
          );
        })
        .catch((error) => {
          console.error(error);
        });
    },

    // async signInWithGithub() {
    //   const { getAuth, signInWithPopup, GithubAuthProvider } = await import(
    //     "firebase/auth"
    //   );
    //   const auth = getAuth();
    //   const provider = new GithubAuthProvider();
    //   return signInWithPopup(auth, provider);
    // },
    // async signInWithFacebook() {
    //   const { getAuth, signInWithPopup, FacebookAuthProvider } = await import(
    //     "firebase/auth"
    //   );
    //   const auth = getAuth();
    //   const provider = new FacebookAuthProvider();
    //   return signInWithPopup(auth, provider);
    // },
    // async signInWithApple() {
    //   const { getAuth, signInWithPopup, OAuthProvider } = await import(
    //     "firebase/auth"
    //   );
    //   const auth = getAuth();
    //   const provider = new OAuthProvider("apple.com");
    //   return signInWithPopup(auth, provider);
    // },
    // async signInWithEmailLink(email) {
    //   const { getAuth } = await import("firebase/auth");
    //   const auth = getAuth();
    //   const actionCodeSettings = {
    //     url: "https://onceupon.app",
    //     handleCodeInApp: true,
    //   };
    // },
  },
});
