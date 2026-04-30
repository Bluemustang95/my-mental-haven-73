import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Star, Trophy } from "@phosphor-icons/react";
import { cn, localDateStr } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ClockCounterClockwise } from "@phosphor-icons/react";

const suggestions = [
  "Hoy puse un límite",
  "Hoy pedí ayuda",
  "Hoy me elegí",
  "Hoy me tomé un descanso",
  "Hoy expresé lo que sentía",
  "Hoy salí a caminar",
  "Hoy no me juzgué",
];

interface Achievement {
  id: string;
  achievement_text: string;
  achievement_date: string;
  created_at: string;
}

export default function MicroAchievements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const today = localDateStr();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("micro_achievements")
      .select("*")
      .eq("user_id", user.id)
      .eq("achievement_date", today)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAchievements((data as Achievement[]) || []);
        setLoading(false);
      });
  }, [user]);

  const add = async (text: string) => {
    if (!user || !text.trim()) return;
    const trimmed = text.trim().slice(0, 200);

    const { data, error } = await supabase
      .from("micro_achievements")
      .insert({ user_id: user.id, achievement_text: trimmed })
      .select()
      .single();

    if (!error && data) {
      setAchievements([data as Achievement, ...achievements]);
      setNewText("");
      toast.success("🎉 ¡Logro registrado!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-resource-breathing-bg px-5 pt-14 pb-4 text-resource-breathing-accent safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-breathing-accent/15 bg-card/75 text-resource-breathing-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-3xl leading-tight">Micro-logros</h1>
          <p className="font-sans text-xs leading-5 text-resource-breathing-accent/65">Pequeñas victorias del día</p>
        </div>
        <button
          onClick={() => navigate("/diario/logros/historial")}
          className="flex items-center gap-1.5 rounded-full border border-resource-breathing-accent/15 bg-card/75 px-3 py-1.5 font-display text-[11px] font-semibold text-resource-breathing-accent shadow-sm transition-all active:scale-95"
        >
          <ClockCounterClockwise size={13} weight="duotone" />
          Historial
        </button>
      </div>

      <p className="mb-4 font-sans text-xs leading-5 text-resource-breathing-accent/65">
        Cada pequeña victoria cuenta. Registrá las de hoy.
      </p>

      {/* Add custom */}
      <div className="mb-4 flex gap-2 rounded-[2.5rem] border border-resource-breathing-accent/15 bg-card/75 p-3 shadow-sm">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Escribí tu logro..."
          maxLength={200}
          onKeyDown={(e) => e.key === "Enter" && add(newText)}
          className="min-w-0 flex-1 rounded-[2rem] border border-resource-breathing-accent/15 bg-resource-breathing-bg/55 px-4 py-3 font-sans text-sm text-resource-breathing-accent placeholder:text-resource-breathing-accent/40 focus:outline-none focus:ring-2 focus:ring-resource-breathing-accent/20"
        />
        <button
          onClick={() => add(newText)}
          disabled={!newText.trim()}
          className={cn(
            "rounded-full px-4 transition-all",
            newText.trim() ? "bg-resource-breathing-accent text-primary-foreground" : "bg-resource-breathing-bg text-resource-breathing-accent/35"
          )}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Suggestions */}
      <div className="mb-5">
        <p className="mb-2 font-display text-xs font-semibold text-resource-breathing-accent/70">Ideas rápidas:</p>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-resource-breathing-accent/25 bg-card/55 px-2.5 py-1 font-display text-[10px] font-semibold text-resource-breathing-accent/70 transition-colors active:bg-card/85"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 h-px bg-resource-breathing-accent/15" />

      {/* Today's achievements */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-resource-breathing-accent border-t-transparent" />
        </div>
      ) : achievements.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Trophy size={40} weight="duotone" className="mb-3 text-resource-breathing-accent/35" />
          <p className="font-sans text-sm text-resource-breathing-accent/65">Todavía no registraste logros hoy.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-resource-breathing-accent/65">
            Hoy: {achievements.length} {achievements.length === 1 ? "logro" : "logros"}
          </p>
          <AnimatePresence>
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 rounded-2xl border border-resource-breathing-accent/15 bg-card/70 p-3 shadow-sm"
              >
                <Star size={16} weight="fill" className="shrink-0 text-resource-breathing-accent" />
                <p className="font-sans text-sm text-resource-breathing-accent">{a.achievement_text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
