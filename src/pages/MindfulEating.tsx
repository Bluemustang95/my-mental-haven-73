import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Apple, CloudRain, Coffee, Frown, Heart, Smile, Wind } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn, localDateStr } from "@/lib/utils";

type EatingEntry = {
  id: string;
  meal_moment: string;
  hunger_level: number;
  emotions: string[];
  notes: string | null;
  entry_date: string;
  entry_time: string;
};

const moments = ["Desayuno", "Almuerzo", "Merienda", "Cena", "Snack"];
const emotions = [
  { label: "Ansiedad", Icon: CloudRain },
  { label: "Calma", Icon: Smile },
  { label: "Tristeza", Icon: Frown },
  { label: "Aburrimiento", Icon: Coffee },
  { label: "Disfrute", Icon: Heart },
];

const localTimeStr = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
};

export default function MindfulEating() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moment, setMoment] = useState("Almuerzo");
  const [hunger, setHunger] = useState([5]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<EatingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pauseSeconds, setPauseSeconds] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("mindful_eating_entries")
        .select("id, meal_moment, hunger_level, emotions, notes, entry_date, entry_time")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setEntries((data as EatingEntry[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (pauseSeconds <= 0) return;
    const timer = window.setInterval(() => setPauseSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [pauseSeconds]);

  const pauseCue = useMemo(() => {
    if (!pauseSeconds) return "Conectá con tu respiración antes de seguir.";
    return pauseSeconds % 8 > 4 ? "Exhalá suave" : "Inhalá lento";
  }, [pauseSeconds]);

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((current) =>
      current.includes(emotion) ? current.filter((item) => item !== emotion) : [...current, emotion],
    );
  };

  const saveEntry = async () => {
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("mindful_eating_entries")
      .insert({
        user_id: user.id,
        meal_moment: moment,
        hunger_level: hunger[0],
        emotions: selectedEmotions,
        notes: notes.trim() || null,
        entry_date: localDateStr(),
        entry_time: localTimeStr(),
      })
      .select("id, meal_moment, hunger_level, emotions, notes, entry_date, entry_time")
      .single();

    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar el registro.");
      return;
    }
    if (data) setEntries((current) => [data as EatingEntry, ...current]);
    setSelectedEmotions([]);
    setNotes("");
    setHunger([5]);
    toast.success("Registro guardado en tu historial.");
  };

  return (
    <div className="min-h-screen bg-resource-eating-bg px-5 pt-12 pb-6 text-resource-eating-accent safe-area-top">
      <button onClick={() => navigate("/herramientas")} className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm">
        <ArrowLeft size={20} />
      </button>

      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-card/85 shadow-sm shadow-resource-eating-accent/10">
          <Apple size={34} strokeWidth={2.1} />
        </div>
        <h1 className="font-mindful text-3xl leading-tight sm:text-4xl">Alimentación Consciente</h1>
        <p className="mx-auto mt-3 max-w-sm font-sans text-xs font-normal leading-6 text-resource-eating-accent/75 sm:text-sm sm:leading-7">
          Tomar conciencia de cómo nos sentimos frente a la comida es el primer paso para un vínculo saludable.
        </p>
      </motion.header>

      <section className="space-y-4">
        <div className="rounded-[2.5rem] border border-resource-eating-accent/15 bg-card/85 p-5 shadow-sm">
          <p className="mb-3 font-display text-sm font-semibold">Momento</p>
          <div className="flex flex-wrap gap-2">
            {moments.map((item) => (
              <button
                key={item}
                onClick={() => setMoment(item)}
                className={cn(
                  "rounded-full border px-4 py-2 font-display text-xs font-semibold transition-colors",
                  moment === item
                    ? "border-resource-eating-accent bg-resource-eating-accent text-primary-foreground"
                    : "border-resource-eating-accent/15 bg-resource-eating-bg/60 text-resource-eating-accent/75",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-resource-eating-accent/15 bg-card/85 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-sm font-semibold">Nivel de hambre previa</p>
            <span className="rounded-full bg-resource-eating-bg px-3 py-1 font-display text-sm font-semibold">{hunger[0]}/10</span>
          </div>
          <Slider value={hunger} onValueChange={setHunger} min={1} max={10} step={1} className="[&_[role=slider]]:border-resource-eating-accent [&_[role=slider]]:bg-card [&>span>span]:bg-resource-eating-accent" />
        </div>

        <div className="rounded-[2.5rem] border border-resource-eating-accent/15 bg-card/85 p-5 shadow-sm">
          <p className="mb-3 font-display text-sm font-semibold">¿Qué emoción aparece?</p>
          <div className="grid grid-cols-2 gap-2">
            {emotions.map(({ label, Icon }) => {
              const active = selectedEmotions.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => toggleEmotion(label)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left font-display text-xs font-semibold transition-colors",
                    active
                      ? "border-resource-eating-accent bg-resource-eating-accent text-primary-foreground"
                      : "border-resource-eating-accent/15 bg-resource-eating-bg/60 text-resource-eating-accent/75",
                  )}
                >
                  <Icon size={16} /> {label}
                </button>
              );
            })}
          </div>
        </div>

        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="¿Qué estás comiendo o qué sentís ahora?"
          className="min-h-28 rounded-[2rem] border-resource-eating-accent/15 bg-card/85 p-5 font-sans text-sm text-resource-eating-accent placeholder:text-resource-eating-accent/40 focus-visible:ring-resource-eating-accent/25"
        />

        <button onClick={saveEntry} disabled={saving} className="w-full rounded-[3rem] bg-resource-eating-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-eating-accent/20 active:scale-[0.98] disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar registro"}
        </button>
      </section>

      <section className="mt-5 rounded-[2.5rem] border border-resource-eating-accent/15 bg-card/85 p-5 text-center shadow-sm">
        <motion.div animate={pauseSeconds ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ duration: 4, repeat: pauseSeconds ? Infinity : 0, ease: "easeInOut" }} className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-resource-eating-bg">
          <Wind size={24} />
        </motion.div>
        <p className="font-display text-base font-semibold">Pausa de 1 minuto</p>
        <p className="mt-1 text-xs leading-5 text-resource-eating-accent/70">{pauseCue}</p>
        <button onClick={() => setPauseSeconds(60)} className="mt-4 rounded-full border border-resource-eating-accent/20 bg-resource-eating-bg/70 px-5 py-2.5 font-display text-xs font-semibold active:scale-[0.98]">
          {pauseSeconds ? `${pauseSeconds}s` : "Empezar pausa"}
        </button>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 font-display text-sm font-semibold">Historial</h2>
        {loading ? (
          <div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-2 border-resource-eating-accent border-t-transparent" /></div>
        ) : entries.length === 0 ? (
          <div className="rounded-[2rem] border border-resource-eating-accent/15 bg-card/70 p-5 text-sm text-resource-eating-accent/65">
            Todavía no hay registros. Cuando guardes uno, va a aparecer acá.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <article key={entry.id} className="rounded-[2rem] border border-resource-eating-accent/15 bg-card/75 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm font-semibold">{entry.meal_moment}</p>
                    <p className="text-[11px] text-resource-eating-accent/55">{entry.entry_date} · {entry.entry_time.slice(0, 5)}</p>
                  </div>
                  <span className="rounded-full bg-resource-eating-bg px-3 py-1 font-display text-xs font-semibold">Hambre {entry.hunger_level}/10</span>
                </div>
                {entry.emotions.length > 0 && <p className="mt-3 text-xs text-resource-eating-accent/70">{entry.emotions.join(" · ")}</p>}
                {entry.notes && <p className="mt-2 text-sm leading-6 text-resource-eating-accent/80">{entry.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}