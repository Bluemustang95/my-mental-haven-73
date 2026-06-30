// Foreground notification listener. Mount once at app root.
import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getMessagingInstance } from "@/lib/firebase";

export function NotificationForegroundListener() {
  const navigate = useNavigate();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;
      unsub = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || payload.data?.title || "RESMA";
        const body = payload.notification?.body || payload.data?.body || "";
        const url = payload.data?.url;
        toast(title, {
          description: body,
          duration: 8000,
          action: url
            ? { label: "Abrir", onClick: () => navigate(url) }
            : undefined,
        });
      });
    })();
    return () => { unsub?.(); };
  }, [navigate]);

  return null;
}
