import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, CloudSun, Wind, PencilSimple, Heartbeat, ArrowRight, TrendUp, Stethoscope, CalendarBlank } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyGoalsWidget } from "@/components/WeeklyGoalsWidget";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  if (h < 12) return { text: "Buen día", icon: Sun };
  if (h < 19) return { text: "Buenas tardes", icon: CloudSun };
  return { text: "Buenas noches", icon: Moon };
}

/* ── Calendar helpers ─────────────────────── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}
const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

type Checkin = { checkin_date: string; mood_score: number | null; note: string | null };

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(), []);
  const GreetingIcon = greeting.icon;
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const firstName = displayName.split(" ")[0];

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  /* ── State ──────────────────────────── */
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [consecutiveLow, setConsecutiveLow] = useState(false);
  const [affirmation, setAffirmation] = useState("");

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

    // Check consecutive low
    const recent2 = list.slice(0, 2);
    if (recent2.length === 2 && recent2.every(c => (c.mood_score ?? 3) <= 2)) {
      setConsecutiveLow(true);
    }

    // Affirmation
    const recentScores = list.slice(0, 5).map(c => c.mood_score ?? 3);
    setAffirmation(pickAffirmation(recentScores));

    // If today already checked in, show submitted
    const todayCheckin = list.find(c => c.checkin_date === todayStr);
    if (todayCheckin && todayCheckin.mood_score) {
      setSelectedMood(todayCheckin.mood_score);
      setSubmitted(true);
    }
  }, [user, todayStr]);

  useEffect(() => { fetchCheckins(); }, [fetchCheckins]);

  /* ── Handle check-in ───────────────── */
  const handleCheckin = async () => {
    if (!selectedMood || !user) return;
    await supabase.from("daily_checkins").upsert({
      user_id: user.id,
      mood_score: selectedMood,
      note: note || null,
      checkin_date: todayStr,
    }, { onConflict: "user_id,checkin_date" });
    setSubmitted(true);
    setNote("");
    fetchCheckins();
  };

  /* ── Calendar data ─────────────────── */
  const checkinMap = useMemo(() => {
    const m: Record<string, Checkin> = {};
    checkins.forEach(c => { m[c.checkin_date] = c; });
    return m;
  }, [checkins]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);

  const isToday = (day: number) =>
    calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();

  const dateStr = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const empathicMsg = selectedMood ? getEmpathicMsg(selectedMood) : null;

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      {/* ── Greeting ─────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <GreetingIcon size={28} weight="duotone" className="text-accent" />
        <div>
          <h1 className="font-display text-xl font-semibold">
            {greeting.text}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-xs text-muted-foreground">¿Cómo te sentís hoy?</p>
        </div>
      </div>

      {/* ── Emotional Calendar ────────── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CalendarBlank size={16} /> Calendario emocional
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="text-muted-foreground active:text-foreground p-1">‹</button>
            <span className="font-display text-xs font-medium min-w-[100px] text-center">{monthNames[calMonth]} {calYear}</span>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="text-muted-foreground active:text-foreground p-1">›</button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayLabels.map(d => (
              <div key={d} className="text-center font-display text-[10px] text-muted-foreground">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const ds = dateStr(day);
              const checkin = checkinMap[ds];
              const mood = checkin?.mood_score;
              const isTodayDay = isToday(day);

              return (
                <Popover key={day}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "relative flex h-9 w-full items-center justify-center rounded-lg text-xs font-display transition-all",
                        mood ? moodBg[mood] : "bg-transparent",
                        mood ? "text-foreground font-medium" : "text-muted-foreground",
                        isTodayDay && "ring-2 ring-accent ring-offset-1 ring-offset-background",
                        !mood && !isTodayDay && "hover:bg-muted/50"
                      )}
                    >
                      {day}
                    </button>
                  </PopoverTrigger>
                  {checkin && checkin.mood_score && (
                    <PopoverContent className="w-52 p-3" side="top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", moodBg[checkin.mood_score!])} />
                          <span className="font-display text-xs font-medium">
                            {moodLevels.find(m => m.value === checkin.mood_score)?.label}
                          </span>
                        </div>
                        {checkin.note && <p className="text-xs text-muted-foreground">{checkin.note}</p>}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            {moodLevels.map(m => (
              <div key={m.value} className="flex items-center gap-1">
                <div className={cn("h-2.5 w-2.5 rounded-full", m.tw)} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mood Thermometer ─────────── */}
      <section className="mb-6">
        <h2 className="mb-3 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Termómetro emocional
        </h2>
        <div className="rounded-2xl border border-border bg-card p-5">
          {submitted ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
              <div className={cn("mx-auto h-12 w-12 rounded-full flex items-center justify-center", selectedMood ? moodBg[selectedMood] : "")}>
                <span className="font-display text-lg font-semibold">✓</span>
              </div>
              <p className="font-display text-sm font-medium">Registrado</p>
              <AnimatePresence>
                {empathicMsg && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xs text-muted-foreground italic">
                    {empathicMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <>
              <div className="mb-4 flex justify-between">
                {moodLevels.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <motion.div
                      animate={selectedMood === mood.value ? { scale: 1.15 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={cn(
                        "h-11 w-11 rounded-full border-2 transition-colors",
                        mood.tw,
                        selectedMood === mood.value
                          ? "border-accent shadow-md"
                          : "border-transparent opacity-60"
                      )}
                    />
                    <span className="font-display text-[9px] text-muted-foreground">{mood.label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {selectedMood && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-3 text-center text-xs italic text-muted-foreground">
                    {getEmpathicMsg(selectedMood)}
                  </motion.p>
                )}
              </AnimatePresence>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="¿Querés agregar algo? (opcional)"
                className="mb-3 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                rows={2}
              />

              <button
                onClick={handleCheckin}
                disabled={!selectedMood}
                className={cn(
                  "w-full rounded-xl py-2.5 font-display text-sm font-medium transition-all",
                  selectedMood
                    ? "bg-primary text-primary-foreground active:scale-[0.98]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                Registrar
              </button>
            </>
          )}
        </div>
      </section>

      {/* ── Consecutive low alert ───── */}
      <AnimatePresence>
        {consecutiveLow && !submitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 rounded-2xl border border-mood-2 bg-mood-2/10 p-4"
          >
            <p className="text-sm text-foreground">
              Venís pasando días difíciles, ¿te gustaría{" "}
              <button onClick={() => navigate("/herramientas/sesiones")} className="underline font-medium text-accent">
                anotar esto para charlarlo en tu sesión
              </button>
              ?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Crisis: ¿Qué necesitás ahora? ── */}
      <section className="mb-6">
        <h2 className="mb-3 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
          ¿Qué necesitás ahora?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate("/herramientas/respiracion")}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted"
          >
            <Wind size={24} weight="duotone" className="text-accent" />
            <span className="font-display text-xs font-medium">Respirar</span>
          </button>
          <button
            onClick={() => navigate("/herramientas/journal/escribir")}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted"
          >
            <PencilSimple size={24} weight="duotone" className="text-accent" />
            <span className="font-display text-xs font-medium">Escribir</span>
          </button>
          <button
            onClick={() => navigate("/herramientas/grounding")}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted"
          >
            <Heartbeat size={24} weight="duotone" className="text-accent" />
            <span className="font-display text-xs font-medium">Calmar</span>
          </button>
        </div>
      </section>

      {/* ── Contextual Affirmation ───── */}
      {affirmation && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6 rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="mb-2 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Para vos
          </h2>
          <p className="text-sm italic text-foreground leading-relaxed">"{affirmation}"</p>
        </motion.section>
      )}

      <div className="mb-6 h-px bg-border" />

      {/* ── Weekly goals ─────────────── */}
      <WeeklyGoalsWidget />

      <div className="mb-6 h-px bg-border" />

      {/* ── Bottom links ─────────────── */}
      <section className="space-y-3">
        <button
          onClick={() => navigate("/progreso")}
          className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-muted"
        >
          <TrendUp size={20} weight="duotone" className="text-accent" />
          <div className="flex-1">
            <p className="font-display text-sm font-medium">Mi progreso</p>
            <p className="text-xs text-muted-foreground">Mirá tu evolución</p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate("/tratamiento")}
          className="flex w-full items-center gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left"
        >
          <Stethoscope size={20} className="text-accent" weight="duotone" />
          <div className="flex-1">
            <p className="font-display text-sm font-medium">Solicitar tratamiento</p>
            <p className="text-xs text-muted-foreground">Conectá con un profesional RESMA</p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground" />
        </button>
      </section>
    </div>
  );
}
