// Firebase initialization for FCM web push.
// Public keys only — these are safe to ship in the client bundle.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, type Messaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyDWIDl-MqYTx8DY7wNSPYR9dWBsHYtUASk",
  authDomain: "resma-app.firebaseapp.com",
  projectId: "resma-app",
  storageBucket: "resma-app.firebasestorage.app",
  messagingSenderId: "898879225626",
  appId: "1:898879225626:web:bcc3dfa104af6b6c12b6a3",
};

// Public VAPID key from Firebase Console → Cloud Messaging → Web push certificates.
export const VAPID_PUBLIC_KEY =
  "BOpIpQkztzuz9PE0_XRQMxGbWQu7nb03KQGjsiPXFMNGe8xiluon5UxiAvJUTkBzFZVw5-_qUA3mADyLNlV5aDI";

export function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

let _messaging: Messaging | null = null;
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (_messaging) return _messaging;
  try {
    if (!(await isSupported())) return null;
    _messaging = getMessaging(getFirebaseApp());
    return _messaging;
  } catch {
    return null;
  }
}
