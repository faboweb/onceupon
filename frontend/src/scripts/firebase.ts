import firebase from "firebase/compat/app";
import { getMessaging, getToken } from "firebase/messaging";
import { callApiAuthenticated } from "./api";

export const firebaseConfig = {
  apiKey: "AIzaSyCmCL-z7KyGGBd-TA45OU3RwBrbdZZ5teU",
  authDomain: "onceupon-15dc8.firebaseapp.com",
  projectId: "onceupon-15dc8",
  storageBucket: "onceupon-15dc8.appspot.com",
  messagingSenderId: "810687001487",
  appId: "1:810687001487:web:b0456babc8af3ce79a51fa",
  measurementId: "G-G4C648Y9XP",
};

firebase.initializeApp(firebaseConfig);

const registerPushNotificationsOnServer = async () => {
  // Get registration token. Initially this makes a network call, once retrieved
  // subsequent calls to getToken will return from cache.
  const messaging = getMessaging();
  const token = await getToken(messaging, {
    vapidKey: process.env.VUE_APP_PUSH_VAPID,
  });
  await callApiAuthenticated("registerPushToken", "POST", {
    token,
  });
};

export const registerPushNotifications = async () => {
  if (!("Notification" in window)) {
    // Check if the browser supports notifications
    alert("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    // Check whether notification permissions have already been granted;
    // if so, create a notification
    await registerPushNotificationsOnServer();
  } else if (Notification.permission !== "denied") {
    // We need to ask the user for permission
    const permission = await Notification.requestPermission();
    // If the user accepts, let's create a notification
    if (permission === "granted") {
      await registerPushNotificationsOnServer();
    }
  }
};
