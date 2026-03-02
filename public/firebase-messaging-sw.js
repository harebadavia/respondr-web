/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDdqxTZ7_BdXcV1_7_MUgexTaxDDC4G-Rg",
  authDomain: "respondr-82d2c.firebaseapp.com",
  projectId: "respondr-82d2c",
  storageBucket: "respondr-82d2c.firebasestorage.app",
  messagingSenderId: "597168146233",
  appId: "1:597168146233:web:c4a71adc31b97499748ae8",
  measurementId: "G-L1W605DE2Z",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "RESPONDR Alert";
  const body = payload?.notification?.body || "You have a new alert.";

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    data: payload?.data || {},
  });
});
