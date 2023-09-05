importScripts(
  "https://www.gstatic.com/firebasejs/10.3.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.3.1/firebase-messaging-compat.js"
);

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

const messaging = firebase.messaging();

messaging.onBackgroundMessage(({ notification: { title, body }, data }) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    title,
    body
  );
  const notificationOptions = {
    body,
    icon: "/assets/onceupon-logo-feather-lite.png",
    onclick: () => {
      if (data.type === "story" || data.type === "section") {
        window.open("/story/" + data.storyId + "/read");
      }
      if (data.type === "proposal") {
        window.open("/story/" + data.storyId + "/proposals");
      }
    },
  };

  self.registration.showNotification(title, notificationOptions);
});
