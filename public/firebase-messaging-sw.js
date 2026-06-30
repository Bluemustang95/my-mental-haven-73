/* RESMA — Firebase Cloud Messaging service worker.
 * Handles push notifications when the app is in the background.
 * Uses the compat SDK because service workers can't use ES module imports
 * from the modular SDK reliably across browsers.
 */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDWIDl-MqYTx8DY7wNSPYR9dWBsHYtUASk",
  authDomain: "resma-app.firebaseapp.com",
  projectId: "resma-app",
  storageBucket: "resma-app.firebasestorage.app",
  messagingSenderId: "898879225626",
  appId: "1:898879225626:web:bcc3dfa104af6b6c12b6a3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "RESMA";
  const body = payload.notification?.body || payload.data?.body || "";
  const url = payload.data?.url || "/";
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.data?.tag || "resma-notif",
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
