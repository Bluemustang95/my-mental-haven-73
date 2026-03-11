import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon, CloudSun, Stethoscope, ArrowRight, Wind, TrendUp } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyGoalsWidget } from "@/components/WeeklyGoalsWidget";

const moodShapes = [
  { value: 1, label: "Muy bajo", color: "bg-destructive/60" },
  { value: 2, label: "Bajo", color: "bg-destructive/30" },
  { value: 3, label: "Neutro", color: "bg-accent/40" },
  { value: 4, label: "Bien", color: "bg-success/40" },
  { value: 5, label: "Muy bien", color: "bg-success/60" },
];

function getGreeting(): { text: string; icon: typeof Sun } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Buenos días", icon: Sun };
  if (h < 19) return { text: "Buenas tardes", icon: CloudSun };
  return { text: "Buenas noches", icon: Moon };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const greeting = useMemo(() => getGreeting(), []);
  const GreetingIcon = greeting.icon;

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";

  const handleCheckin = async () => {
    if (!selectedMood || !user) return;

    await supabase.from("daily_checkins").upsert({
      user_id: user.id,
      mood_score: selectedMood,
      note: note || null,
      checkin_date: new Date().toISOString().split("T")[0],
    }, { onConflict: "user_id,checkin_date" });

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setSelectedMood(null);
    setNote("");
  };

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      {/* Greeting */}
      <div className="mb-8 flex items-center gap-3">
        <GreetingIcon size={28} weight="duotone" className="text-accent" />
        <div>
          <h1 className="font-display text-xl font-semibold">
            {greeting.text}{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="text-xs text-muted-foreground">¿Cómo te sentís hoy?</p>
        </div>
      </div>

      <div className="mb-6 h-px bg-border" />

      {/* Check-in */}
      <section className="mb-6">
        <h2 className="mb-4 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Check-in del día
        </h2>

        {submitted ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl bg-success/10 p-6 text-center"
          >
            <p className="font-display text-sm font-medium text-success">Registrado ✓</p>
            <p className="mt-1 text-xs text-muted-foreground">Tu registro fue guardado</p>
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex justify-between">
              {moodShapes.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full border-2 transition-all",
                      mood.color,
                      selectedMood === mood.value
                        ? "border-accent scale-110 shadow-md"
                        : "border-transparent opacity-60"
                    )}
                  />
                  <span className="font-display text-[9px] text-muted-foreground">{mood.label}</span>
                </button>
              ))}
            </div>

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
          </div>
        )}
      </section>

      <div className="mb-6 h-px bg-border" />

      {/* Foco del día */}
      <section className="mb-6">
        <h2 className="mb-4 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Foco de hoy
        </h2>
        <button
          onClick={() => navigate("/herramientas/respiracion")}
          className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-muted"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
            <Wind size={24} weight="duotone" className="text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-display text-sm font-medium">Respiración guiada</p>
            <p className="text-xs text-muted-foreground">3 minutos para reconectar</p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground" />
        </button>
      </section>

      <div className="mb-6 h-px bg-border" />

      {/* Solicitar tratamiento CTA */}
      <section>
        <button
          onClick={() => navigate("/tratamiento")}
          className="flex w-full items-center gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left"
        >
          <Stethoscope size={24} className="text-accent" weight="duotone" />
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
