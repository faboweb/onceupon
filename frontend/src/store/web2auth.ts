import { defineStore } from "pinia";
import firebase from "firebase/compat/app";
import "firebaseui/dist/firebaseui.css";
import { useAuthStore } from "./auth";
import { firebaseConfig } from "@/scripts/firebase";
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
        .then((result) => {
          const user = result.user;

          const authStore = useAuthStore();
          authStore.setSignIn(
            {
              name: user.displayName,
              image: user.photoURL,
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
        .then((result) => {
          const user = result.user;

          const authStore = useAuthStore();
          authStore.setSignIn(
            {
              name: user.displayName,
              image: user.photoURL,
            },
            "google"
          );
        })
        .catch((error) => {
          console.error(error);
        });
    },
    // async signInWithKeplr() {
    //   const {
    //     getAuth,
    //     signInWithCustomToken,
    //     setPersistence,
    //     browserLocalPersistence,
    //   } = await import("firebase/auth");

    //   const authStore = useAuthStore();
    //   const walletStore = useWalletStore();
    //   const signer = await walletStore.logInUser();
    //   const data = Buffer.from("Signing into OnceUpon");
    //   const signature = await signArbitrary("cosmoshub-4", signer, data);

    //   const customToken = await axios
    //     .post(process.env.VUE_APP_API_URL + "web3Auth", {
    //       signer,
    //       data: data.toString("base64"),
    //       signature,
    //     })
    //     .then((res) => res.data);
    //   const auth = getAuth();
    //   await setPersistence(auth, browserLocalPersistence);

    //   return signInWithCustomToken(auth, customToken)
    //     .then((result) => {
    //       const user = result.user;

    //       const authStore = useAuthStore();
    //       authStore.setSignIn(
    //         {
    //           name: user.displayName,
    //           image: user.photoURL,
    //         },
    //         "keplrSignIn"
    //       );
    //     })
    //     .catch((error) => {
    //       console.error(error);
    //     });
    // },

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
