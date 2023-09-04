import { defineStore } from "pinia";
import { useLikeStore } from "./likes";
import "@/scripts/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface State {
  signInMethod: string;
  user: any;
  showSignInModal: boolean;
}

export const useAuthStore = defineStore("authStore", {
  // convert to a function
  state: (): State => ({
    signInMethod: "",
    user: null,
    showSignInModal: false,
  }),
  getters: {
    isSignedIn: (state) => {
      return state.user !== null;
    },
  },
  actions: {
    setSignIn(user, method) {
      this.user = user;
      this.signInMethod = method;
      this.storeInLocalStorage();

      const likeStore = useLikeStore();
      likeStore.loadLikes(this.user.address);
    },
    signOut() {
      this.user = null;

      // TODO move to web2auth?
      const auth = getAuth();
      if (auth.currentUser) {
        auth.signOut();
      }

      this.signInMethod = "";
      this.storeInLocalStorage();

      const likeStore = useLikeStore();
      likeStore.signOut();
    },
    storeInLocalStorage() {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          signInMethod: this.signInMethod,
          user: this.user,
        })
      );
    },
    async loadFromLocalStorage() {
      const auth = localStorage.getItem("auth");
      if (auth) {
        const { user, signInMethod } = JSON.parse(auth);
        if (user) {
          if (signInMethod === "keplr") {
            this.setSignIn(user, signInMethod);
          } else {
            const auth = getAuth();
            await new Promise((resolve) => {
              onAuthStateChanged(auth, (_user) => {
                if (_user) {
                  this.setSignIn(user, signInMethod);
                } else {
                  // User is signed out
                }
                resolve(undefined);
              });
            });
          }
        }
      }
    },
  },
});
