// Push notification client helpers (Firebase Cloud Messaging).
import { getToken, deleteToken, onMessage } from "firebase/messaging";
import { getMessagingInstance, VAPID_PUBLIC_KEY } from "./firebase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function currentPermission(): NotificationPermission {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
}

/** Request permission, get FCM token, save it to the backend. */
export async function requestPermissionAndRegister(): Promise<boolean> {
  if (!isPushSupported()) {
    toast.error("Tu navegador no soporta notificaciones push.");
    return false;
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    toast.error("Notificaciones bloqueadas. Activalas desde la configuración del navegador.");
    return false;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    toast.error("Mensajería no disponible en este navegador.");
    return false;
  }

  try {
    const swReg = await getOrRegisterSW();
    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (!token) {
      toast.error("No pudimos generar el token de notificaciones.");
      return false;
    }
    const { error } = await supabase.functions.invoke("register-push-token", {
      body: {
        token,
        platform: /android/i.test(navigator.userAgent)
          ? "android"
          : /iphone|ipad|ipod/i.test(navigator.userAgent)
            ? "ios"
            : "web",
        user_agent: navigator.userAgent,
      },
    });
    if (error) throw error;

    // Foreground messages: show as toast.
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || "RESMA";
      const body = payload.notification?.body || payload.data?.body || "";
      toast(title, { description: body, duration: 8000 });
    });

    return true;
  } catch (e) {
    console.error("[push] register failed", e);
    toast.error("No pudimos activar las notificaciones.");
    return false;
  }
}

export async function disablePush(): Promise<void> {
  try {
    const messaging = await getMessagingInstance();
    if (messaging) {
      await deleteToken(messaging).catch(() => {});
    }
    await supabase.functions.invoke("unregister-push-token", { body: {} });
  } catch (e) {
    console.error("[push] disable failed", e);
  }
}
