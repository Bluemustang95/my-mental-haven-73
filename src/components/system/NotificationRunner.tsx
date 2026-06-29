import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { acknowledgeNotification, evaluateNextNotification } from "@/lib/notificationEngine";

/**
 * Mounts the anti-fatigue notification engine once per session, ~3s after the
 * user lands on the app. Surfaces at most one soft toast based on configured
 * rules in `notification_rules`.
 */
export function NotificationRunner() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(async () => {
      try {
        const next = await evaluateNextNotification();
        if (!next) return;
        toast(next.title, {
          description: next.body,
          duration: 9000,
          className: "resma-soft-toast",
        });
        acknowledgeNotification(next.id);
      } catch {
        // soft fail — never block UI
      }
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [user]);

  return null;
}
