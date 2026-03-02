import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "../firebase";
import { apiRequest } from "./api";

const TOKEN_STORAGE_KEY = "respondr.push.fcm_token";

async function getStoredToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  return token || null;
}

async function setStoredToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function ensurePushRegistration(authToken) {
  if (!authToken || typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) return null;

  if (!("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("VITE_FIREBASE_VAPID_KEY is missing; skipping push registration.");
    return null;
  }

  const messaging = getMessaging(app);
  const fcmToken = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js"),
  });

  if (!fcmToken) return null;

  const currentStored = await getStoredToken();
  if (currentStored === fcmToken) return fcmToken;

  await apiRequest("/devices/register", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ fcm_token: fcmToken }),
  });

  await setStoredToken(fcmToken);
  return fcmToken;
}

export async function unregisterStoredPushToken(authToken) {
  if (!authToken || typeof window === "undefined") return;

  const storedToken = await getStoredToken();
  if (!storedToken) return;

  try {
    await apiRequest(`/devices/${encodeURIComponent(storedToken)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch (error) {
    console.warn("FCM unregister failed:", error?.message || error);
  } finally {
    await setStoredToken(null);
  }
}
