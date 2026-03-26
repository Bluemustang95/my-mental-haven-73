import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Star, Trophy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  const today = new Date().toISOString().split("T")[0];

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
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Micro-logros</h1>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Cada pequeña victoria cuenta. Registrá las de hoy.
      </p>

      {/* Add custom */}
      <div className="mb-4 flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Escribí tu logro..."
          maxLength={200}
          onKeyDown={(e) => e.key === "Enter" && add(newText)}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={() => add(newText)}
          disabled={!newText.trim()}
          className={cn(
            "rounded-xl px-3 transition-all",
            newText.trim() ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Suggestions */}
      <div className="mb-5">
        <p className="mb-2 font-display text-xs text-muted-foreground">Ideas rápidas:</p>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 font-display text-[10px] text-muted-foreground transition-colors active:bg-accent/10"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mb-4" />

      {/* Today's achievements */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : achievements.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Trophy size={40} weight="duotone" className="mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Todavía no registraste logros hoy.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-display text-xs uppercase tracking-wider text-muted-foreground">
            Hoy: {achievements.length} {achievements.length === 1 ? "logro" : "logros"}
          </p>
          <AnimatePresence>
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 rounded-xl border border-accent/20 bg-accent/5 p-3"
              >
                <Star size={16} weight="fill" className="text-accent shrink-0" />
                <p className="text-sm font-body">{a.achievement_text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
