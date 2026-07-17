import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Sun, Moon as MoonIcon, ChevronRight, Heart, Wind, Check, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { WeekStrip } from "@/components/home/WeekStrip";
import { CheckinModal } from "@/components/modals/CheckinModal";
import { DayHistorySheet } from "@/components/mindfulness/DayHistorySheet";
import { MonthCalendarSheet } from "@/components/home/MonthCalendarSheet";
import { NotificationStack } from "@/components/home/NotificationStack";
import { RecommendedResourceCard } from "@/components/home/RecommendedResourceCard";
import { MorningCallback } from "@/components/home/MorningCallback";
import {
  useHomeWidgets,
  WidgetCell,
  EditTopBar,
  ManageWidgetsButton,
  ReorderableGroupStack,
  WidgetId,
  type GroupItem,
  PRIORITY_IDS,
  TOOL_IDS,
  WIDGET_TO_CATEGORY,
} from "@/components/home/WidgetsBoard";
import { useHiddenCategories } from "@/hooks/useHiddenCategories";
import { MiniHabitsWidget } from "@/components/home/OptionalWidgets";
import { PsyNewsWidget } from "@/components/home/PsyNewsWidget";
import { PendingBento } from "@/components/home/PendingBento";
import { PullToRefresh } from "@/components/home/PullToRefresh";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { PriorityStack, type PriorityCard } from "@/components/home/PriorityStack";
import ThoughtTaskWidget from "@/components/pensamientos/ThoughtTaskWidget";
import { EditSlots } from "@/components/home/EditSlots";
import {
  PensamientosQuickWidget,
  PsicoQuickWidget,
  PackQuickWidget,
  MindfulnessQuickWidget,
  SleepZoneWidget,
  InventariosQuickWidget,
  PersonalidadQuickWidget,
  DiarioQuickWidget,
} from "@/components/home/QuickToolWidget";
import { TOOL_META, type ToolModule } from "@/lib/onboardingAlgorithm";

const GROUP_ORDER_KEY = "home_groups_order_v2";
function loadGroupOrder(): string[] {
  try { return JSON.parse(localStorage.getItem(GROUP_ORDER_KEY) || "[]"); } catch { return []; }
}
function saveGroupOrder(ids: string[]) {
  try { localStorage.setItem(GROUP_ORDER_KEY, JSON.stringify(ids)); } catch {}
}

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
  const [priorityModule, setPriorityModule] = useState<ToolModule | null>(null);
  const today = new Date();
  const todayStr = localDateStr(today);
  const greeting = useMemo(getGreeting, []);

  const [morningDone, setMorningDone] = useState(false);
  const [nightDone, setNightDone] = useState(false);
  const [improveFromYesterday, setImproveFromYesterday] = useState<string | null>(null);
  const [checkinOpen, setCheckinOpen] = useState<"morning" | "night" | null>(null);
  const [historyDate, setHistoryDate] = useState<Date | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [weekProgress, setWeekProgress] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);

  const widgets = useHomeWidgets();
  const hiddenCats = useHiddenCategories();
  const isWidgetAvailable = useCallback(
    (id: WidgetId) => {
      const cat = WIDGET_TO_CATEGORY[id];
      return !cat || !hiddenCats.has(cat);
    },
    [hiddenCats],
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("display_name, priority_module")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "";
        setName(n.split(" ")[0]);
        const pm = (data as any)?.priority_module as string | null;
        if (pm && pm in TOOL_META) setPriorityModule(pm as ToolModule);
      });
  }, [user]);

  const loadToday = useCallback(async () => {
    if (!user) return;
    const { data: ci } = await supabase
      .from("daily_checkins")
      .select("mode, sleep_score, balance_improve, checkin_date")
      .eq("user_id", user.id)
      .gte("checkin_date", localDateStr(new Date(Date.now() - 45 * 86400000)));
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
    setLoading(false);
  }, [user, todayStr]);

  useEffect(() => {
    loadToday();
    // Recargar al volver a la pestaña / regresar de un ritual
    const refresh = () => loadToday();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadToday]);

  // Determine position within the "camino" sequence (morning → recommended → night)
  // so we can draw a dashed connector line between the visible ones.
  const CAMINO_IDS: WidgetId[] = ["morning", "recommended", "night"];
  const visibleCamino = (widgets as any).widgets
    ? (widgets as any).widgets.filter((w: any) => w.enabled && CAMINO_IDS.includes(w.id)).map((w: any) => w.id as WidgetId)
    : CAMINO_IDS;
  const caminoPos = (id: WidgetId) => {
    const idx = visibleCamino.indexOf(id);
    return {
      isFirst: idx === 0,
      isLast: idx === visibleCamino.length - 1,
      inPath: idx !== -1,
    };
  };

  // Renderers per widget id so the same definition feeds grid + reorder list.
  const renderWidget = (id: WidgetId): React.ReactNode => {
    switch (id) {
      case "morning": {
        const p = caminoPos("morning");
        return (
          <BulletRow done={morningDone} isFirst={p.isFirst} isLast={p.isLast}>
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
      }
      case "recommended": {
        const p = caminoPos("recommended");
        return (
          <BulletRow done={false} isFirst={p.isFirst} isLast={p.isLast}>
            <div id="widget-recommended"><RecommendedResourceCard /></div>
          </BulletRow>
        );
      }
      case "night": {
        const p = caminoPos("night");
        return (
          <BulletRow done={nightDone} isFirst={p.isFirst} isLast={p.isLast}>
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
      }
      case "sleep_zone":
        return <SleepZoneWidget />;
      case "pending":
        return <PendingBento />;
      case "mini_habits":
        return <MiniHabitsWidget />;
      case "psy_news":
        return <PsyNewsWidget />;
      case "mindfulness_quick":
        return <MindfulnessQuickWidget />;
      case "pensamientos_quick":
        return <PensamientosQuickWidget />;
      case "pack_quick":
        return <PackQuickWidget />;
      case "psico_quick":
        return <PsicoQuickWidget />;
      default:
        return null;
    }
  };

  const PRIORITY_ID_SET = new Set<WidgetId>(PRIORITY_IDS);
  // Herramientas: prioridades siempre fuera. Máximo 3 activas (fila única).
  const toolWidgets = widgets.widgets
    .filter((w) => TOOL_IDS.includes(w.id as WidgetId) && w.enabled && !w.hidden && isWidgetAvailable(w.id as WidgetId))
    .slice(0, 3);
  const gridWidgets = widgets.editMode
    ? widgets.widgets.filter((w) => !PRIORITY_ID_SET.has(w.id as WidgetId) && w.enabled && !w.hidden && isWidgetAvailable(w.id as WidgetId))
    : toolWidgets;

  const RECOMMENDED_BY_MODULE: Record<ToolModule, { title: string; description: string; label: string }> = {
    mindfulness: {
      title: "Práctica de mindfulness",
      description: "Anclate al presente con una respiración guiada breve.",
      label: "Respirar 3 minutos",
    },
    pensamientos: {
      title: "Manejo de distorsiones",
      description: "Identificá pensamientos automáticos y desarmá los sesgos cognitivos.",
      label: "Desarmar sesgos",
    },
    psicohigiene_sueno: {
      title: "Higiene del sueño",
      description: "Preparación consciente para dormir mejor esta noche.",
      label: "Preparar mi noche",
    },
    habitos: {
      title: "Micro-hábito de hoy",
      description: "Sumá una pequeña acción alineada con quien querés ser.",
      label: "Elegir mi hábito",
    },
    pack_actividades: {
      title: "Pack de activación",
      description: "Una actividad breve para reactivar tu energía y estado de ánimo.",
      label: "Activarme",
    },
    diario: {
      title: "Escribir en el diario",
      description: "Un espacio íntimo para procesar lo que sentís hoy.",
      label: "Abrir diario",
    },
    psicoeducacion: {
      title: "Lectura recomendada",
      description: "Una cápsula de psicoeducación para entenderte mejor.",
      label: "Leer",
    },
  };
  const rec = priorityModule ? RECOMMENDED_BY_MODULE[priorityModule] : null;

  const priorityCards: PriorityCard[] = [
    {
      id: "morning",
      chip: "Prioridad mañana",
      chipTone: "gold",
      title: "Sintonía de la mañana",
      description: "Arrancá tu día regulando tu energía somática, emociones y valores.",
      actionLabel: "Cultivar mi día",
      actionTone: "gold",
      onAction: () => navigate("/sintonia-manana"),
      done: morningDone,
      doneSummary: morningDone ? "Ritual matutino completado" : undefined,
    },
    {
      id: "recommended",
      chip: "Práctica recomendada",
      chipTone: "teal",
      title: rec?.title ?? "Manejo de distorsiones",
      description:
        rec?.description ?? "Identificá pensamientos automáticos y desarmá los sesgos cognitivos.",
      actionLabel: rec?.label ?? "Desarmar sesgos",
      actionTone: "teal",
      onAction: () =>
        navigate(priorityModule ? TOOL_META[priorityModule].route : "/pensamientos"),
    },
    {
      id: "night",
      chip: "Prioridad noche",
      chipTone: "navy",
      title: "Balance nocturno",
      description: "Cerrá tu día, evalúa emociones y hacé tu balance introspectivo.",
      actionLabel: "Cerrar mi día",
      actionTone: "navy",
      onAction: () => navigate("/balance-nocturno"),
      done: nightDone,
      doneSummary: nightDone ? "Balance nocturno completado" : undefined,
    },
  ];


  return (
    <div className="resma-bg-gradient relative min-h-screen overflow-hidden pb-24 safe-area-top">
      {/* Animated glow blobs */}
      <div className="glow-blob animate-blob-a" style={{ background: "#7cc2c8", width: 320, height: 320, top: -80, left: -100 }} />
      <div className="glow-blob animate-blob-b" style={{ background: "#facb60", width: 280, height: 280, top: 220, right: -100 }} />

      <EditTopBar visible={widgets.editMode} onDone={() => widgets.setEditMode(false)} onReset={widgets.reset} />

      {loading ? (
        <HomeSkeleton />
      ) : (
      <PullToRefresh onRefresh={loadToday}>
      <div className="relative mx-auto max-w-md px-5 pt-5">
        {/* Header simétrico: calendario a la izquierda, avatar a la derecha */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonthOpen(true)}
            aria-label="Abrir calendario"
            className="glass-premium flex h-11 w-11 items-center justify-center rounded-2xl text-resma-navy active:scale-95"
          >
            <CalendarDays size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate("/configuracion")}
            aria-label="Perfil"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-resma-navy font-display text-[13px] font-semibold uppercase text-white shadow-[0_8px_20px_-10px_rgba(16,25,39,0.5)] transition active:scale-95"
          >
            {name ? name[0].toUpperCase() : "U"}
          </button>
        </div>
        {/* Notification stack (iOS-style) — reemplaza MorningCallback y pending */}
        {!widgets.editMode && <NotificationStack />}

        {/* Enfoque prioritario — visible siempre, fijo en edit mode */}
        <PriorityStack cards={priorityCards} />


        {/* Herramientas — sin título, solo botón de gestión discreto */}
        <div className="mt-5 mb-2 flex items-center justify-end px-1">
          <ManageWidgetsButton widgets={widgets.widgets} onToggle={widgets.toggleEnabled} />
        </div>

        {widgets.editMode ? (
          <EditSlots
            items={gridWidgets.map((w, i) => ({
              id: w.id as WidgetId,
              size: (i === 0 ? "full" : "half") as "full" | "half",
              render: () => renderWidget(w.id as WidgetId),
            }))}
            onReorder={(ids) => {
              saveGroupOrder(ids);
              widgets.reorder(ids as WidgetId[]);
            }}
            onHide={(id) => widgets.hide(id)}
            onToggleSize={(id) => {
              const cur = widgets.widgets.find((x) => x.id === id);
              widgets.setSize(id, cur?.size === "full" ? "half" : "full");
            }}
            onAdd={() => window.dispatchEvent(new CustomEvent("resma:open-manage-widgets"))}
          />
        ) : (
          <div
            className="relative mx-auto grid max-w-[340px] grid-cols-3 gap-3"
            onContextMenu={(e) => {
              e.preventDefault();
              widgets.activateEdit();
            }}
          >
            {gridWidgets.map((w) => (
              <div key={w.id}>{renderWidget(w.id as WidgetId)}</div>
            ))}
            {gridWidgets.length === 0 && (
              <div className="col-span-3 rounded-2xl border border-dashed border-foreground/15 bg-white/50 p-5 text-center text-[13px] text-muted-foreground">
                Aún no elegiste herramientas. Tocá <b>+</b> arriba para sumar hasta 3.
              </div>
            )}
          </div>
        )}


        <div className="mt-3"><ThoughtTaskWidget /></div>
      </div>
      </PullToRefresh>
      )}

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
      <MonthCalendarSheet
        open={monthOpen}
        onOpenChange={setMonthOpen}
        onPickDay={(d) => {
          setHistoryDate(d);
          setHistoryOpen(true);
        }}
      />
    </div>
  );
}

function BulletRow({
  done,
  children,
  isFirst = true,
  isLast = true,
}: {
  done: boolean;
  children: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex items-stretch gap-2.5">
      {/* Dashed connector rail behind the bullet column */}
      <div className="relative flex w-4 shrink-0 flex-col items-center">
        {/* segment above bullet */}
        <div
          className={
            "w-px flex-1 " +
            (!isFirst ? "border-l border-dashed border-foreground/25" : "")
          }
        />
        <span
          className={
            "my-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition " +
            (done
              ? "border-resma-teal bg-resma-teal text-white"
              : "border-foreground/25 bg-white text-transparent")
          }
        >
          {done && <Check size={9} strokeWidth={3} />}
        </span>
        {/* segment below bullet */}
        <div
          className={
            "w-px flex-1 " +
            (!isLast ? "border-l border-dashed border-foreground/25" : "")
          }
        />
      </div>
      <div className="min-w-0 flex-1 py-1">{children}</div>
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
      className="glass-premium relative flex w-full items-center gap-3 rounded-[20px] p-3 text-left"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-semibold leading-tight text-resma-navy">{title}</p>
        <p className="mt-0.5 line-clamp-1 text-[11.5px] leading-snug text-muted-foreground">{subtitle}</p>
      </div>
      {done ? (
        <span className="rounded-full bg-resma-teal/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-resma-teal">
          Hecho
        </span>
      ) : (
        <ChevronRight size={14} className="text-muted-foreground/50" />
      )}
    </motion.button>
  );
}

function SleepZoneCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-[110px] w-full items-center justify-between overflow-hidden rounded-[22px] px-4 text-left transition active:scale-[0.985]"
      style={{
        background: "linear-gradient(160deg, #6d5bd0 0%, #241c5a 100%)",
        color: "#ffffff",
      }}
    >
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm">
          <MoonIcon size={18} className="text-white" />
        </div>
        <p className="font-display text-[14px] font-bold leading-tight text-white">
          Zona de descanso
        </p>
      </div>
      <div className="pointer-events-none absolute -right-3 -top-3 opacity-30">
        <MoonIcon size={80} className="text-white" strokeWidth={1.2} />
      </div>
    </button>
  );
}


// PendingForYou removed — now powered by <PendingBento /> with real Supabase data.

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
