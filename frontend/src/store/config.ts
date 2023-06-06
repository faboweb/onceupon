import { defineStore } from "pinia";

interface State {
  showVideo: string;
}

export const useConfigStore = defineStore("configStore", {
  // convert to a function
  state: (): State => ({
    showVideo: JSON.parse(localStorage.getItem("showVideo") || "true"),
  }),
  actions: {
    setConfig(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
      this[key] = value;
    },
  },
});
