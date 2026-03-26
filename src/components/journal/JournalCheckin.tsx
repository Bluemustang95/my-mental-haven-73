import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn, localDateStr } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BodyMapSvg } from "./BodyMapSvg";
import { motion } from "framer-motion";
import { toast } from "sonner";

const moodOptions = [
  { value: 1, label: "Muy mal", emoji: "😞" },
  { value: 2, label: "Mal", emoji: "😔" },
  { value: 3, label: "Regular", emoji: "😐" },
  { value: 4, label: "Bien", emoji: "🙂" },
  { value: 5, label: "Muy bien", emoji: "😊" },
];

export default function JournalCheckin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleBody = (part: string) => {
    setBodyParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const save = async () => {
    if (!user || !mood) return;
    setSaving(true);

    try {
      // Save mood check-in
      await supabase.from("daily_checkins").upsert({
        user_id: user.id,
        mood_score: mood,
        note: note || null,
        checkin_date: localDateStr(),
      }, { onConflict: "user_id,checkin_date" });

      // Save body map entries
      if (bodyParts.length > 0) {
        const entries = bodyParts.map((part) => ({
          user_id: user.id,
          body_part: part,
        }));
        await supabase.from("body_map_entries").insert(entries);
      }

      toast.success("Check-in guardado");
      navigate("/diario");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Check-in rápido</h1>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Mood */}
        <section className="mb-6">
          <p className="mb-4 font-display text-base font-medium">¿Cómo te sentís hoy?</p>
          <div className="flex justify-between">
            {moodOptions.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl p-2 transition-all",
                  mood === m.value
                    ? "bg-accent/15 scale-110"
                    : "opacity-60 hover:opacity-80"
                )}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="font-display text-[9px] text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="mb-6 h-px bg-border" />

        {/* Body map */}
        <section className="mb-6">
          <p className="mb-2 font-display text-sm font-medium">¿Dónde sentís tensión o malestar?</p>
          <p className="mb-3 text-xs text-muted-foreground">Tocá las zonas del cuerpo donde notás algo.</p>
          <BodyMapSvg selected={bodyParts} onToggle={toggleBody} />
        </section>

        <div className="mb-6 h-px bg-border" />

        {/* Note */}
        <section className="mb-6">
          <p className="mb-2 font-display text-sm font-medium">¿Algo más que quieras registrar?</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcional..."
            className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
          />
        </section>

        <button
          onClick={save}
          disabled={!mood || saving}
          className={cn(
            "w-full rounded-2xl py-3 font-display text-sm font-medium transition-all",
            mood ? "bg-primary text-primary-foreground active:scale-[0.98]" : "bg-muted text-muted-foreground"
          )}
        >
          {saving ? "Guardando..." : "Registrar check-in"}
        </button>
      </motion.div>
    </div>
  );
}
