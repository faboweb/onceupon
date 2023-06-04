import { defineStore } from "pinia";

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
    },
    signOut() {
      this.user = null;

      // TODO sign out from firebase

      this.signInMethod = "";
      this.storeInLocalStorage();
    },
    storeInLocalStorage() {
      localStorage.setItem("auth", JSON.stringify(this.$state));
    },
    loadFromLocalStorage() {
      const auth = localStorage.getItem("auth");
      if (auth) {
        this.$patch(JSON.parse(auth));
      }
    },
  },
});
