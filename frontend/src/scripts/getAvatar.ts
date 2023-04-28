import { useNameStore } from "../store/names";

export const FALLBACK_AVATAR =
  "https://ionicframework.com/docs/img/demos/avatar.svg";
export const getAvatar = (address: string) => {
  const nameStore = useNameStore();
  const avatar = nameStore.avatar(address);
  return avatar;
};
