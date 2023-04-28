import { defineStore } from "pinia";

interface State {
  backTo: string
}

export const useNavigationStore = defineStore("navigationStore", {
  // convert to a function
  state: (): State => ({
    backTo: "/"
  }),
});
