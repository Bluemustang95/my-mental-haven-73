import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, CloudSun, Wind, PencilSimple, Heartbeat, ArrowRight,
  Stethoscope, Sparkle, Brain, Notebook, Barbell, Flower, Heart, Flag,
  Check, Target, CalendarBlank, ArrowLeft,
  Trophy,
} from "@phosphor-icons/react";
import { cn, localDateStr, localWeekStart } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SessionPrep } from "@/components/SessionPrep";
import BlogCarousel from "@/components/BlogCarousel";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

/* ── Mood config ─────────────────────────── */
const moodLevels = [
  { value: 1, label: "Muy bajo", tw: "bg-mood-1" },
  { value: 2, label: "Bajo", tw: "bg-mood-2" },
  { value: 3, label: "Neutro", tw: "bg-mood-3" },
  { value: 4, label: "Bien", tw: "bg-mood-4" },
  { value: 5, label: "Muy bien", tw: "bg-mood-5" },
];

const moodBg: Record<number, string> = { 1: "bg-mood-1", 2: "bg-mood-2", 3: "bg-mood-3", 4: "bg-mood-4", 5: "bg-mood-5" };

/* ── Empathic messages ──────────────────── */
function getEmpathicMsg(score: number): string {
  if (score >= 4) return "Qué bueno que te sientas así hoy. ¡Aprovechá esa energía!";
  if (score === 3) return "Un día tranquilo también es un buen día.";
  return "Siento que estés pasando un mal día. Acá tenés herramientas para acompañarte.";
}

/* ── Contextual affirmations ─────────────── */
const lowAffirmations = [
  "Los días difíciles también son parte del proceso.",
  "Pedir ayuda es un acto de valentía, no de debilidad.",
  "No tenés que tener todo resuelto hoy.",
  "Tu bienestar importa, incluso cuando no lo sentís así.",
  "Cada paso pequeño cuenta, aunque no se note.",
];
const highAffirmations = [
  "Estás haciendo un gran trabajo cuidándote.",
  "Tu constancia está dando frutos.",
  "Celebrá cada pequeño avance, es tuyo.",
  "Tu compromiso con vos mismo/a es admirable.",
  "Hoy es un buen día para reconocer tu esfuerzo.",
];

function pickAffirmation(recentScores: number[]): string {
  const avg = recentScores.length ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 3;
  const pool = avg < 3 ? lowAffirmations : highAffirmations;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ── Greeting ─────────────────────────────── */
function getGreeting(): { text: string; icon: typeof Sun } {
  const h = new Date().getHours();
  if (h >= 6 && h < 13) return { text: "Buen día", icon: Sun };
  if (h >= 13 && h < 20) return { text: "Buenas tardes", icon: CloudSun };
  return { text: "Buenas noches", icon: Moon };
}

const dayInitials = ["L", "M", "X", "J", "V", "S", "D"];

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type Checkin = { checkin_date: string; mood_score: number | null; note: string | null };

interface DayActivity {
  type: "journal" | "thought" | "test" | "exercise" | "dream" | "goal";
  label: string;
  detail: string;
  time: string;
}

const activityConfig: Record<DayActivity["type"], { icon: typeof Brain; color: string }> = {
  journal:  { icon: Notebook, color: "text-accent" },
  thought:  { icon: Brain,    color: "text-[hsl(193_50%_50%)]" },
  test:     { icon: Heartbeat, color: "text-[hsl(250_50%_60%)]" },
  exercise: { icon: Flower,   color: "text-[hsl(var(--mood-5))]" },
  dream:    { icon: Barbell,  color: "text-[hsl(var(--mood-4))]" },
  goal:     { icon: Target,   color: "text-accent" },
};

type Goal = { id: string; goal_text: string; completed: boolean | null };

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(), []);
  const GreetingIcon = greeting.icon;

  const [firstName, setFirstName] = useState("");
  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = data?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "";
        setFirstName(name.split(" ")[0]);
      });
  }, [user]);

  const today = new Date();
  const todayStr = localDateStr(today);

  /* ── State ──────────────────────────── */
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [todayStr]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [consecutiveLow, setConsecutiveLow] = useState(false);
  const [affirmation, setAffirmation] = useState("");

  // Modal state
  const [modalMood, setModalMood] = useState<number | null>(null);
  const [modalNote, setModalNote] = useState("");
  const [modalSubmitted, setModalSubmitted] = useState(false);
  const [dayActivities, setDayActivities] = useState<DayActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Goals
  const [pendingGoals, setPendingGoals] = useState<Goal[]>([]);

  /* ── Fetch checkins ────────────────── */
  const fetchCheckins = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_checkins")
      .select("checkin_date, mood_score, note")
      .eq("user_id", user.id)
      .order("checkin_date", { ascending: false })
      .limit(60);
    const list = (data ?? []) as Checkin[];
    setCheckins(list);

    const recent2 = list.slice(0, 2);
    if (recent2.length === 2 && recent2.every(c => (c.mood_score ?? 3) <= 2)) {
      setConsecutiveLow(true);
    }

    const recentScores = list.slice(0, 5).map(c => c.mood_score ?? 3);
    setAffirmation(pickAffirmation(recentScores));
  }, [user]);

  useEffect(() => { fetchCheckins(); }, [fetchCheckins]);

  /* ── Fetch pending goals ────────────── */
  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const ws = localWeekStart();
    const { data } = await supabase
      .from("weekly_goals")
      .select("id, goal_text, completed")
      .eq("user_id", user.id)
      .eq("week_start", ws)
      .eq("completed", false)
      .order("created_at", { ascending: true });
    setPendingGoals(data ?? []);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const completeGoal = async (goal: Goal) => {
    if (!user) return;
    await supabase.from("weekly_goals").update({ completed: true }).eq("id", goal.id);
    // Log as micro achievement for bitácora
    await supabase.from("micro_achievements").insert({
      user_id: user.id,
      achievement_text: `Objetivo cumplido: ${goal.goal_text}`,
    });
    toast.success("¡Objetivo cumplido! 🎉");
    fetchGoals();
  };

  /* ── Calendar data ─────────────────── */
  const checkinMap = useMemo(() => {
    const m: Record<string, Checkin> = {};
    checkins.forEach(c => { m[c.checkin_date] = c; });
    return m;
  }, [checkins]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  /* ── Open day detail ───────────────── */
  const openDayDetail = async (day: Date) => {
    setSelectedDay(day);
    const ds = localDateStr(day);
    const existing = checkinMap[ds];
    setModalMood(existing?.mood_score ?? null);
    setModalNote(existing?.note ?? "");
    setModalSubmitted(!!existing?.mood_score);
    setLoadingActivities(true);
    setDayActivities([]);

    if (!user) return;

    // Use ART-aware UTC boundaries: ART = UTC-3, so midnight ART = 03:00 UTC
    const dayStart = `${ds}T03:00:00Z`;
    const nextDayStr = localDateStr(addDays(day, 1));
    const dayEnd = `${nextDayStr}T03:00:00Z`;
    const activities: DayActivity[] = [];

    const [journals, thoughts, tests, exercises, dreams, achievements, checkins_day, completedGoals] = await Promise.all([
      supabase.from("journal_entries").select("id, created_at, content").eq("user_id", user.id).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
      supabase.from("thought_records").select("id, created_at, situation").eq("user_id", user.id).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
      supabase.from("test_results").select("id, created_at, test_type, score, severity").eq("user_id", user.id).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
      supabase.from("exercise_sessions").select("id, created_at, exercise_type, exercise_name, duration_seconds").eq("user_id", user.id).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
      supabase.from("dream_log").select("id, created_at, description").eq("user_id", user.id).eq("dream_date", ds).order("created_at"),
      supabase.from("micro_achievements").select("id, created_at, achievement_text").eq("user_id", user.id).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
      supabase.from("daily_checkins").select("id, created_at, mood_score, note").eq("user_id", user.id).eq("checkin_date", ds),
      supabase.from("weekly_goals").select("id, created_at, goal_text").eq("user_id", user.id).eq("completed", true).gte("created_at", dayStart).lt("created_at", dayEnd),
    ]);

    journals.data?.forEach((j: any) => activities.push({ type: "journal", label: "Entrada de diario", detail: j.content?.slice(0, 80) || "", time: format(new Date(j.created_at), "HH:mm") }));
    thoughts.data?.forEach((t: any) => activities.push({ type: "thought", label: "Registro de pensamiento", detail: t.situation?.slice(0, 80) || "", time: format(new Date(t.created_at), "HH:mm") }));
    tests.data?.forEach((t: any) => activities.push({ type: "test", label: `Test ${t.test_type}`, detail: `Puntaje: ${t.score}${t.severity ? ` · ${t.severity}` : ""}`, time: format(new Date(t.created_at), "HH:mm") }));
    exercises.data?.forEach((e: any) => activities.push({ type: "exercise", label: e.exercise_name || e.exercise_type, detail: e.duration_seconds ? `${Math.round(e.duration_seconds / 60)} min` : "Completado", time: format(new Date(e.created_at), "HH:mm") }));
    dreams.data?.forEach((d: any) => activities.push({ type: "dream", label: "Registro de sueño", detail: d.description?.slice(0, 80) || "", time: format(new Date(d.created_at), "HH:mm") }));
    achievements.data?.forEach((a: any) => activities.push({ type: "goal", label: "Logro registrado", detail: a.achievement_text?.slice(0, 80) || "", time: format(new Date(a.created_at), "HH:mm") }));
    checkins_day.data?.forEach((c: any) => {
      const moodLabel = moodLevels.find(m => m.value === c.mood_score)?.label || "";
      activities.push({ type: "exercise", label: "Check-in emocional", detail: `${moodLabel}${c.note ? ` · ${c.note.slice(0, 60)}` : ""}`, time: format(new Date(c.created_at), "HH:mm") });
    });

    // Body map entries for somatic check-ins
    const bodyMapRes = await supabase.from("body_map_entries").select("id, created_at, body_part, note").eq("user_id", user.id).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at");
    const bodyPartLabels: Record<string, string> = {
      head: "Cabeza", neck: "Cuello", chest: "Pecho", stomach: "Estómago",
      left_shoulder: "Hombro izq.", right_shoulder: "Hombro der.",
      left_arm: "Brazo izq.", right_arm: "Brazo der.", pelvis: "Pelvis",
      left_leg: "Pierna izq.", right_leg: "Pierna der.",
      left_foot: "Pie izq.", right_foot: "Pie der.",
    };
    // Group body entries by timestamp batch
    const bodyBatches: Record<string, { parts: string[]; note: string | null; time: string }> = {};
    bodyMapRes.data?.forEach((b: any) => {
      const batchKey = b.created_at?.slice(0, 16) || "unknown";
      if (!bodyBatches[batchKey]) {
        bodyBatches[batchKey] = { parts: [], note: b.note, time: format(new Date(b.created_at), "HH:mm") };
      }
      bodyBatches[batchKey].parts.push(bodyPartLabels[b.body_part] || b.body_part);
    });
    Object.values(bodyBatches).forEach((batch) => {
      const zones = batch.parts.join(", ");
      activities.push({
        type: "exercise",
        label: "Check-in somático",
        detail: `Tensión en ${zones}${batch.note ? ` · ${batch.note.slice(0, 50)}` : ""}`,
        time: batch.time,
      });
    });
    completedGoals.data?.forEach((g: any) => activities.push({ type: "goal", label: "Objetivo cumplido", detail: g.goal_text?.slice(0, 80) || "", time: format(new Date(g.created_at), "HH:mm") }));

    activities.sort((a, b) => a.time.localeCompare(b.time));
    setDayActivities(activities);
    setLoadingActivities(false);
  };

  /* ── Handle check-in from modal ──── */
  const handleCheckin = async () => {
    if (!modalMood || !user || !selectedDay) return;
    const ds = localDateStr(selectedDay);
    await supabase.from("daily_checkins").upsert({
      user_id: user.id,
      mood_score: modalMood,
      note: modalNote || null,
      checkin_date: ds,
    }, { onConflict: "user_id,checkin_date" });
    setModalSubmitted(true);
    fetchCheckins();
  };

  const empathicMsg = modalMood ? getEmpathicMsg(modalMood) : null;
  const selectedDayStr = selectedDay ? localDateStr(selectedDay) : "";
  const isSelectedToday = selectedDay ? isSameDay(selectedDay, today) : false;

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-background safe-area-top">
      {/* ── Greeting ─── */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-3">
          <GreetingIcon size={26} weight="duotone" className="text-accent" />
          <div className="flex-1">
            <h1 className="font-display text-xl font-semibold text-foreground">
              {greeting.text}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">¿Cómo te sentís hoy?</p>
          </div>
          <button
            onClick={() => navigate("/perfil")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 font-display text-sm font-semibold text-accent-foreground uppercase transition-transform active:scale-95"
            aria-label="Perfil"
          >
            {firstName ? firstName[0] : "?"}
          </button>
        </div>
      </div>

      <SessionPrep />

      {/* ── Weekly Calendar ─── */}
      <section className="px-4 pt-6 pb-2">
        <div className="px-2 py-2">
          <div className="relative mb-4 flex items-center justify-center">
            <h2 className="font-display text-[15px] font-semibold text-muted-foreground">
              {capitalizeFirst(format(today, "MMMM d", { locale: es }))}
            </h2>
            <button
              onClick={() => navigate("/calendario")}
              className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted/45"
              aria-label="Abrir calendario mensual"
            >
              <CalendarBlank size={18} weight="duotone" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const ds = localDateStr(day);
            const checkin = checkinMap[ds];
            const mood = checkin?.mood_score;
            const isToday = isSameDay(day, today);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

            return (
              <button
                key={i}
                onClick={() => openDayDetail(day)}
                className="flex min-h-[72px] flex-col items-center justify-start gap-1 rounded-2xl px-1 py-1.5 transition-all active:bg-muted/35"
              >
                <span className={cn(
                  "h-4 font-display text-[9px] font-semibold leading-4 tracking-wide text-muted-foreground",
                  isToday && "text-foreground"
                )}>
                  {isToday ? "HOY" : dayInitials[i]}
                </span>
                <motion.div
                  animate={isSelected ? { scale: 1.08 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-medium text-foreground transition-all",
                    isToday && "bg-accent/20 shadow-[inset_0_0_0_1px_hsl(var(--accent)/0.14)]",
                    isSelected && !isToday && "bg-muted/60 shadow-[inset_0_0_0_1px_hsl(var(--border))]",
                  )}
                >
                  {day.getDate()}
                </motion.div>
                {mood ? (
                  <div className={cn("h-1.5 w-1.5 rounded-full", moodBg[mood])} />
                ) : (
                  <div className="h-1.5 w-1.5" />
                )}
              </button>
            );
          })}
          </div>
        </div>
      </section>

      {/* ── Pending Goals ─── */}
      <AnimatePresence>
        {pendingGoals.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pt-4"
          >
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="flex items-center gap-1.5 font-display text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                <Flag size={13} weight="duotone" className="text-accent" />
                Objetivos pendientes
              </h2>
              <button
                onClick={() => navigate("/diario/objetivos")}
                className="text-[10px] font-display font-medium text-accent"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-2">
              {pendingGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  layout
                  exit={{ opacity: 0, x: 40, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/80 p-3.5"
                >
                  <button
                    onClick={() => completeGoal(goal)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-accent/40 transition-all active:scale-90 active:bg-accent/20"
                  >
                    <Check size={12} weight="bold" className="text-accent opacity-0 group-active:opacity-100" />
                  </button>
                  <span className="flex-1 text-sm text-foreground font-body leading-snug">{goal.goal_text}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Consecutive low alert ───── */}
      <AnimatePresence>
        {consecutiveLow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 mt-4 mb-4 rounded-2xl border border-mood-2 bg-mood-2/10 p-4"
          >
            <p className="text-sm text-foreground">
              Venís pasando días difíciles, ¿te gustaría{" "}
              <button onClick={() => navigate("/diario/terapia")} className="underline font-medium text-accent">
                anotar esto para charlarlo en tu sesión
              </button>
              ?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick actions ───── */}
      <section className="px-6 pt-4 pb-2">
        <h2 className="mb-3 font-display text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          ¿Qué necesitás ahora?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Wind, label: "Respirar", route: "/herramientas/respiracion" },
            { icon: PencilSimple, label: "Escribir", route: "/diario/escribir" },
            { icon: Heartbeat, label: "Calmar", route: "/herramientas/grounding" },
          ].map(({ icon: Icon, label, route }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className="flex flex-col items-center gap-2.5 rounded-2xl bg-card/60 border border-border/50 p-4 transition-colors active:bg-muted/60"
            >
              <Icon size={22} weight="duotone" className="text-accent" />
              <span className="font-display text-[11px] font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Affirmation ────────────── */}
      {affirmation && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-6 mt-5 mb-4 rounded-2xl bg-accent/8 border border-accent/15 p-6"
        >
          <p className="text-sm italic text-foreground/80 leading-relaxed text-center font-body">
            "{affirmation}"
          </p>
        </motion.section>
      )}

      {/* ── Blog ───── */}
      <BlogCarousel />

      {/* ── Treatment CTA ───── */}
      <section className="px-6 pb-6">
        <button
          onClick={() => navigate("/tratamiento")}
          className="flex w-full items-center gap-4 rounded-2xl border border-accent/20 bg-card/60 p-4 text-left transition-colors active:bg-muted/40"
        >
          <Stethoscope size={20} className="text-accent" weight="duotone" />
          <div className="flex-1">
            <p className="font-display text-sm font-medium text-foreground">Solicitar tratamiento</p>
            <p className="text-[11px] text-muted-foreground">Conectá con un profesional RESMA</p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground" />
        </button>
      </section>

      {/* ═══════════════════════════════════════════
          DAY DETAIL MODAL
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            key="day-fullscreen"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: "spring", damping: 32, stiffness: 280 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-[#FDFCFB] px-6 pb-8 pt-12 safe-area-top dark:bg-background"
          >
            {/* Fullscreen header */}
            <div className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-center bg-[#FDFCFB]/95 px-6 pb-4 pt-1 backdrop-blur dark:bg-background/95">
              <button
                onClick={() => setSelectedDay(null)}
                className="absolute left-5 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted/45"
                aria-label="Volver"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="text-center">
                <h2 className="font-display text-lg font-semibold text-foreground capitalize">
                  {format(selectedDay, "EEEE d", { locale: es })}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {format(selectedDay, "MMMM yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* ── Mood Thermometer ──── */}
              <section>
                <h3 className="font-display text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
                  Termómetro emocional
                </h3>

                {modalSubmitted ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2 py-3">
                    <div className={cn("mx-auto h-12 w-12 rounded-full flex items-center justify-center", modalMood ? moodBg[modalMood] : "")}>
                      <span className="font-display text-lg font-semibold">✓</span>
                    </div>
                    <p className="font-display text-sm font-medium text-foreground">
                      {moodLevels.find(m => m.value === modalMood)?.label}
                    </p>
                    {empathicMsg && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xs text-muted-foreground italic">
                        {empathicMsg}
                      </motion.p>
                    )}
                    {checkinMap[selectedDayStr]?.note && (
                      <p className="text-xs text-muted-foreground mt-1 bg-muted/30 rounded-xl px-3 py-2">
                        {checkinMap[selectedDayStr].note}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      {moodLevels.map((mood) => (
                        <button
                          key={mood.value}
                          onClick={() => setModalMood(mood.value)}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <motion.div
                            animate={modalMood === mood.value ? { scale: 1.15 } : { scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className={cn(
                              "h-11 w-11 rounded-full border-2 transition-colors",
                              mood.tw,
                              modalMood === mood.value
                                ? "border-accent shadow-md"
                                : "border-transparent opacity-60"
                            )}
                          />
                          <span className="font-display text-[9px] text-muted-foreground">{mood.label}</span>
                        </button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {modalMood && (
                        <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center text-xs italic text-muted-foreground">
                          {getEmpathicMsg(modalMood)}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <textarea
                      value={modalNote}
                      onChange={(e) => setModalNote(e.target.value)}
                      placeholder="¿Querés agregar algo? (opcional)"
                      className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      rows={2}
                    />

                    <button
                      onClick={handleCheckin}
                      disabled={!modalMood}
                      className={cn(
                        "w-full rounded-xl py-2.5 font-display text-sm font-medium transition-all",
                        modalMood
                          ? "bg-primary text-primary-foreground active:scale-[0.98]"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      Registrar
                    </button>
                  </div>
                )}
              </section>

              {/* ── Quick links from calendar ── */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setSelectedDay(null); navigate("/diario/checkin"); }}
                  className="flex min-h-[132px] flex-col items-start rounded-[2.5rem] border border-resource-safety-accent/15 bg-resource-safety-bg p-5 text-left text-resource-safety-accent shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/70">
                    <Heart size={20} weight="duotone" />
                  </span>
                  <span className="mt-auto pt-4 font-display text-sm font-semibold leading-tight">Check-in rápido</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setSelectedDay(null); navigate("/diario/objetivos"); }}
                  className="flex min-h-[132px] flex-col items-start rounded-[2.5rem] border border-resource-values-accent/15 bg-resource-values-bg p-5 text-left text-resource-values-accent shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/70">
                    <Flag size={20} weight="duotone" />
                  </span>
                  <span className="mt-auto pt-4 font-display text-sm font-semibold leading-tight">Mis objetivos</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setSelectedDay(null); navigate("/diario/logros"); }}
                  className="col-span-2 flex min-h-[118px] flex-col items-start rounded-[2.5rem] border border-resource-breathing-accent/15 bg-resource-breathing-bg p-5 text-left text-resource-breathing-accent shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/70">
                    <Trophy size={20} weight="duotone" />
                  </span>
                  <span className="mt-auto pt-4 font-display text-sm font-semibold leading-tight">Micro-logros</span>
                </motion.button>
              </div>

              {/* ── Separator ──── */}
              <div className="h-px bg-border/60" />

              {/* ── Day Bitácora ──── */}
              <section>
                <h3 className="font-display text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
                  Bitácora del día
                </h3>

                {loadingActivities ? (
                  <div className="flex justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                ) : dayActivities.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground italic">
                      {isSelectedToday ? "Aún no registraste actividad hoy." : "No hubo actividad registrada este día."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dayActivities.map((act, i) => {
                      const cfg = activityConfig[act.type];
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 rounded-xl bg-card/80 border border-border/40 p-3"
                        >
                          <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/40", cfg.color)}>
                            <Icon size={14} weight="duotone" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-[12px] font-medium text-foreground leading-snug">{act.label}</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{act.detail}</p>
                          </div>
                          <span className="shrink-0 text-[9px] text-muted-foreground/60 mt-0.5">{act.time}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
