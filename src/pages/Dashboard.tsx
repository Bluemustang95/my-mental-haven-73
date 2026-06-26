import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Sun, Moon as MoonIcon, ChevronRight, Heart, Wind, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { WeekStrip } from "@/components/home/WeekStrip";
import { CheckinModal } from "@/components/modals/CheckinModal";
import { DayHistorySheet } from "@/components/mindfulness/DayHistorySheet";
import { RecommendedResourceCard } from "@/components/home/RecommendedResourceCard";
import { MorningCallback } from "@/components/home/MorningCallback";
import {
  useHomeWidgets,
  WidgetCell,
  EditTopBar,
  ManageWidgetsButton,
  ReorderableStack,
  WidgetId,
} from "@/components/home/WidgetsBoard";
import { MiniHabitsWidget, GratitudeWidget, ContentionNotesWidget } from "@/components/home/OptionalWidgets";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 13) return "Buen día";
  if (h >= 13 && h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const today = new Date();
  const todayStr = localDateStr(today);
  const greeting = useMemo(getGreeting, []);

  const [morningDone, setMorningDone] = useState(false);
  const [nightDone, setNightDone] = useState(false);
  const [improveFromYesterday, setImproveFromYesterday] = useState<string | null>(null);
  const [checkinOpen, setCheckinOpen] = useState<"morning" | "night" | null>(null);
  const [historyDate, setHistoryDate] = useState<Date | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [weekProgress, setWeekProgress] = useState<Record<string, number>>({});

  const widgets = useHomeWidgets();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "";
        setName(n.split(" ")[0]);
      });
  }, [user]);

  const loadToday = useCallback(async () => {
    if (!user) return;
    const { data: ci } = await supabase
      .from("daily_checkins")
      .select("mode, sleep_score, balance_improve, checkin_date")
      .eq("user_id", user.id)
      .gte("checkin_date", localDateStr(new Date(Date.now() - 7 * 86400000)));
    const today = (ci ?? []).filter((c: any) => c.checkin_date === todayStr);
    setMorningDone(today.some((c: any) => c.mode === "morning" || (!c.mode && c.sleep_score != null)));
    setNightDone(today.some((c: any) => c.mode === "night"));

    const yStr = localDateStr(new Date(Date.now() - 86400000));
    const ynight = (ci ?? []).find((c: any) => c.checkin_date === yStr && c.mode === "night" && c.balance_improve);
    setImproveFromYesterday((ynight as any)?.balance_improve ?? null);

    const prog: Record<string, number> = {};
    (ci ?? []).forEach((c: any) => {
      prog[c.checkin_date] = (prog[c.checkin_date] ?? 0) + 1;
    });
    setWeekProgress(prog);
  }, [user, todayStr]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  // Renderers per widget id so the same definition feeds grid + reorder list.
  const renderWidget = (id: WidgetId): React.ReactNode => {
    switch (id) {
      case "morning":
        return (
          <BulletRow done={morningDone}>
            <TimelineCard
              onClick={() => setCheckinOpen("morning")}
              icon={<Sun size={15} className="text-amber-600" />}
              iconBg="bg-amber-100"
              done={morningDone}
              title="Valoración de la mañana"
              subtitle="Analiza tu sueño, emociones y propón tus objetivos del día."
            />
          </BulletRow>
        );
      case "recommended":
        return (
          <BulletRow done={false}>
            <div id="widget-recommended"><RecommendedResourceCard /></div>
          </BulletRow>
        );
      case "night":
        return (
          <BulletRow done={nightDone}>
            <TimelineCard
              onClick={() => setCheckinOpen("night")}
              icon={<MoonIcon size={15} className="text-indigo-600" />}
              iconBg="bg-indigo-100"
              done={nightDone}
              title="Valoración de la noche"
              subtitle="Cerrá tu día, evalúa emociones y haz tu balance introspectivo."
            />
          </BulletRow>
        );
      case "sleep_zone":
        return <SleepZoneCard onClick={() => navigate("/herramientas/sueno")} />;
      case "pending":
        return <PendingForYou onNavigate={navigate} />;
      case "mini_habits":
        return (
          <ActiveWidgetWrapper title="Tus widgets activos" onManageClick={() => {}}>
            <MiniHabitsWidget />
          </ActiveWidgetWrapper>
        );
      case "gratitude":
        return <GratitudeWidget />;
      case "contention_notes":
        return <ContentionNotesWidget />;
      default:
        return null;
    }
  };

  const visibleOrdered = widgets.widgets.filter((w) => w.enabled && !w.hidden);

  return (
    <div className="resma-bg-gradient relative min-h-screen overflow-hidden pb-24 safe-area-top">
      {/* Animated glow blobs */}
      <div className="glow-blob animate-blob-a" style={{ background: "#7cc2c8", width: 320, height: 320, top: -80, left: -100 }} />
      <div className="glow-blob animate-blob-b" style={{ background: "#facb60", width: 280, height: 280, top: 220, right: -100 }} />

      <EditTopBar visible={widgets.editMode} onDone={() => widgets.setEditMode(false)} onReset={widgets.reset} />

      <div className="relative mx-auto max-w-md px-5 pt-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {greeting} <Sparkles size={10} className="text-resma-gold" />
            </p>
            <h1 className="mt-0.5 truncate font-serifElegant text-[22px] font-medium leading-tight text-resma-navy">
              {name || "Usuario"}
            </h1>
          </div>
          <button
            onClick={() => navigate("/configuracion")}
            aria-label="Ajustes"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-resma-navy font-display text-[13px] font-semibold uppercase text-white shadow-[0_8px_20px_-10px_rgba(16,25,39,0.5)] transition active:scale-95"
          >
            {name ? name[0].toUpperCase() : "U"}
          </button>
        </div>

        {/* Week strip */}
        <div className="mt-4">
          <WeekStrip
            progressByDate={weekProgress}
            onSelectDay={(d) => {
              setHistoryDate(d);
              setHistoryOpen(true);
            }}
          />
        </div>

        {/* Yesterday's improvement callback */}
        {improveFromYesterday && !morningDone && !widgets.editMode && (
          <div className="mt-3">
            <MorningCallback text={improveFromYesterday} onOpen={() => setCheckinOpen("morning")} />
          </div>
        )}

        {/* Camino + manage */}
        <div className="mt-5 mb-2 flex items-center justify-between px-1">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Tu camino de hoy
          </p>
          <ManageWidgetsButton widgets={widgets.widgets} onToggle={widgets.toggleEnabled} />
        </div>

        {widgets.editMode ? (
          /* Reorder mode: stack single column with drag */
          <ReorderableStack
            items={visibleOrdered.map((w) => ({
              id: w.id,
              size: w.size,
              render: () => renderWidget(w.id),
            }))}
            onReorder={(ids) => widgets.reorder(ids)}
            onHide={(id) => widgets.hide(id)}
            onToggleSize={(id) =>
              widgets.setSize(id, widgets.getSize(id) === "full" ? "half" : "full")
            }
          />
        ) : (
          <div className="relative grid grid-cols-2 gap-3">
            {visibleOrdered.map((w) => (
              <WidgetCell
                key={w.id}
                id={w.id}
                editMode={false}
                size={w.size}
                onLongPress={widgets.activateEdit}
              >
                {renderWidget(w.id)}
              </WidgetCell>
            ))}
          </div>
        )}
      </div>

      <CheckinModal
        open={!!checkinOpen}
        mode={checkinOpen ?? "morning"}
        onClose={() => setCheckinOpen(null)}
        onComplete={() => loadToday()}
      />
      <DayHistorySheet
        date={historyDate}
        scope="all"
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
}

function BulletRow({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition " +
          (done
            ? "border-resma-teal bg-resma-teal text-white"
            : "border-foreground/25 bg-white text-transparent")
        }
      >
        {done && <Check size={9} strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function TimelineCard({
  onClick,
  icon,
  iconBg,
  done,
  title,
  subtitle,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  done: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-premium relative flex w-full items-center gap-2.5 rounded-[18px] p-2.5 text-left"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[12px] font-semibold leading-tight text-resma-navy">{title}</p>
        <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-muted-foreground">{subtitle}</p>
      </div>
      {done ? (
        <span className="rounded-full bg-resma-teal/15 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-resma-teal">
          Hecho
        </span>
      ) : (
        <ChevronRight size={13} className="text-muted-foreground/50" />
      )}
    </motion.button>
  );
}

function SleepZoneCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[24px] bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-900 p-3.5 text-left text-white shadow-[0_14px_36px_-18px_rgba(76,29,149,0.7)] transition active:scale-[0.98]"
    >
      <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-fuchsia-400/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-indigo-400/30 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
          <MoonIcon size={16} />
        </div>
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/70">Zona de descanso</p>
          <p className="font-serifElegant text-[14.5px] font-semibold">Santuario del sueño</p>
          <p className="text-[10.5px] text-white/70">Ruidos blancos y protocolos nocturnos.</p>
        </div>
      </div>
      <ChevronRight size={16} className="relative text-white/80" />
    </button>
  );
}

function PendingForYou({ onNavigate }: { onNavigate: (path: string) => void }) {
  const items = [
    {
      to: "/herramientas/pack",
      title: "Pack de activación",
      subtitle: "Día 2 en curso",
      icon: <Sparkles size={16} className="text-white" />,
      from: "#FB923C",
      to2: "#F472B6",
    },
    {
      to: "/diario-inteligente/mindfulness",
      title: "Te puede aliviar",
      subtitle: "Respiración 4-7-8 · 3 min",
      icon: <Wind size={16} className="text-white" />,
      from: "#60A5FA",
      to2: "#A78BFA",
    },
  ];
  return (
    <div>
      <p className="mb-2 px-1 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Pendientes para vos
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => (
          <button
            key={it.to}
            onClick={() => onNavigate(it.to)}
            className="flex flex-col items-start gap-2 rounded-[20px] p-3.5 text-left text-white shadow-md transition active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${it.from}, ${it.to2})`,
              boxShadow: `0 12px 28px -14px ${it.from}`,
            }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm">
              {it.icon}
            </div>
            <div>
              <p className="font-display text-[12.5px] font-semibold text-white">{it.title}</p>
              <p className="mt-0.5 text-[10px] text-white/85">{it.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActiveWidgetWrapper({ title, children, onManageClick }: { title: string; children: React.ReactNode; onManageClick: () => void }) {
  return (
    <div className="glass-premium rounded-[24px] p-3.5">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
        <button
          onClick={onManageClick}
          className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-resma-teal"
        >
          Gestionar <Heart size={10} />
        </button>
      </div>
      {children}
    </div>
  );
}
