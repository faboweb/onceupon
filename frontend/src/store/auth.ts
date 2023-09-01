import { defineStore } from "pinia";
import { useLikeStore } from "./likes";
import { getAuth } from "firebase/auth";

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

      // TODO sign out from firebase
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
    loadFromLocalStorage() {
      const auth = localStorage.getItem("auth");
      if (auth) {
        const { user, method } = JSON.parse(auth);
        if (user) {
          this.setSignIn(user, method);
        }
      }
    },
  },
});
