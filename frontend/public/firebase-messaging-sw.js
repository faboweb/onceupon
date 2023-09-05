importScripts("https://www.gstatic.com/firebasejs/5.5.6/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/5.5.6/firebase-messaging.js");

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

const messaging = firebase.messaging();
