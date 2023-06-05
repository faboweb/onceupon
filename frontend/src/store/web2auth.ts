import { defineStore } from "pinia";
import firebase from "firebase/compat/app";
import "firebaseui/dist/firebaseui.css";
import { signInWithEmailLink } from "firebase/auth";
import { useAuthStore } from "./auth";

// interface State {}

const firebaseConfig = {
  apiKey: "AIzaSyCmCL-z7KyGGBd-TA45OU3RwBrbdZZ5teU",
  authDomain: "onceupon-15dc8.firebaseapp.com",
  projectId: "onceupon-15dc8",
  storageBucket: "onceupon-15dc8.appspot.com",
  messagingSenderId: "810687001487",
  appId: "1:810687001487:web:b0456babc8af3ce79a51fa",
  measurementId: "G-G4C648Y9XP",
};
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
