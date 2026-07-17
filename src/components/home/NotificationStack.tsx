import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, BookOpen, CheckCircle, Wind, CalendarClock, Pill, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNextSession } from "@/hooks/useNextSession";
import { useTodayCompletion } from "@/hooks/useTodayCompletion";
import { localDateStr } from "@/lib/utils";

type StackNotif = {
  id: string;
  chip: string;
  chipColor: string;
  title: string;
  subtitle?: string;
  to: string;
  Icon: LucideIcon;
};

function dismissKey() {
  return `home_notif_dismissed_v1:${localDateStr()}`;
}

function loadDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(dismissKey()) || "[]");
  } catch {
    return [];
  }
}

function saveDismissed(ids: string[]) {
  try {
    localStorage.setItem(dismissKey(), JSON.stringify(ids));
  } catch {}
}

export function NotificationStack() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const done = useTodayCompletion();
  const next = useNextSession();

  const [prefs, setPrefs] = useState<any | null>(null);
  const [hasHabits, setHasHabits] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>(() => loadDismissed());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: pref }, { data: hs }] = await Promise.all([
        supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("habits").select("id").eq("user_id", user.id).limit(1),
      ]);
      setPrefs(pref ?? {});
      setHasHabits((hs ?? []).length > 0);
    })();
  }, [user?.id]);

  const notifications = useMemo<StackNotif[]>(() => {
    if (!prefs) return [];
    const out: StackNotif[] = [];

    // Sesión de terapia en <24h.
    if (prefs.therapist_enabled !== false && next?.date) {
      const diffH = (new Date(next.date).getTime() - Date.now()) / 3_600_000;
      if (diffH > 0 && diffH < 24) {
        out.push({
          id: "session",
          chip: "SESIÓN",
          chipColor: "#3b6fa0",
          title: "Sesión con tu psicólogo mañana",
          subtitle: "Prepará tus notas",
          to: "/mi-proceso",
          Icon: CalendarClock,
        });
      }
    }

    if (prefs.habits_enabled !== false && hasHabits && !done.mini_habits) {
      out.push({
        id: "habits",
        chip: "HÁBITO PENDIENTE",
        chipColor: "#7d9b76",
        title: "Recordatorio: Registrar meta de Hábitos diarios",
        subtitle: "Ahora",
        to: "/diario-inteligente/gestion-pensamientos/habitos",
        Icon: CheckCircle,
      });
    }

    if (prefs.checkin_enabled !== false && !done.diario_quick) {
      out.push({
        id: "journal",
        chip: "DIARIO",
        chipColor: "#f59e0b",
        title: "Escribí unas líneas en tu diario",
        subtitle: "Un espacio para ordenar tu día",
        to: "/diario",
        Icon: BookOpen,
      });
    }

    if (prefs.content_enabled !== false && !done.mindfulness_quick) {
      out.push({
        id: "mindfulness",
        chip: "MINDFULNESS",
        chipColor: "#7cc2c8",
        title: "Momento de respirar",
        subtitle: "3 minutos de práctica guiada",
        to: "/herramientas/mindfulness",
        Icon: Wind,
      });
    }

    if (prefs.medication_enabled) {
      out.push({
        id: "medication",
        chip: "MEDICACIÓN",
        chipColor: "#c0392b",
        title: "Revisá tu medicación de hoy",
        to: "/mi-proceso",
        Icon: Pill,
      });
    }

    return out.filter((n) => !dismissed.includes(n.id));
  }, [prefs, next, hasHabits, done, dismissed]);

  const dismiss = (id: string) => {
    const nextList = [...dismissed, id];
    setDismissed(nextList);
    saveDismissed(nextList);
  };

  if (notifications.length === 0) return null;

  const top = notifications[0];
  const behind = notifications.slice(1, 3);

  return (
    <div className="relative mt-4">
      {/* Sombras apiladas detrás */}
      {behind.map((n, i) => {
        const depth = i + 1;
        return (
          <div
            key={`shadow-${n.id}`}
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl"
            style={{
              top: 6 * depth,
              transform: `scale(${1 - 0.04 * depth})`,
              opacity: 0.55 - 0.2 * i,
              height: 70,
              zIndex: -depth,
              boxShadow: "0 6px 18px -12px rgba(16,25,39,0.2)",
            }}
          />
        );
      })}

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.button
          key={top.id}
          type="button"
          layout
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ x: "-105%", opacity: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0.35, 1] } }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={() => navigate(top.to)}
          className="relative flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-left backdrop-blur-xl"
          style={{
            boxShadow: "0 8px 24px -8px rgba(16,25,39,0.12)",
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${top.chipColor}1a` }}
          >
            <top.Icon size={18} strokeWidth={1.5} color={top.chipColor} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: top.chipColor }}
            >
              {top.chip}{" "}
              {top.subtitle && (
                <span className="ml-1 text-slate-400 font-medium tracking-normal normal-case">
                  · {top.subtitle}
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-900">
              {top.title}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss(top.id);
            }}
            aria-label="Descartar notificación"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition active:scale-90 hover:text-slate-700"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
