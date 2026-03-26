import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, CloudSun, Moon } from "@phosphor-icons/react";
import { cn, localDateStr } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const periods = [
  { key: "morning", label: "Mañana", icon: Sun, color: "bg-accent/15 text-accent-foreground" },
  { key: "afternoon", label: "Tarde", icon: CloudSun, color: "bg-secondary text-secondary-foreground" },
  { key: "night", label: "Noche", icon: Moon, color: "bg-primary/10 text-foreground" },
];

const moodLabels = ["", "Muy mal", "Mal", "Regular", "Bien", "Muy bien"];

export default function DayTimeline() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<Record<string, { mood: number; note: string }>>({
    morning: { mood: 0, note: "" },
    afternoon: { mood: 0, note: "" },
    night: { mood: 0, note: "" },
  });
  const [saving, setSaving] = useState(false);
  const today = localDateStr();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("day_timeline_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", today)
      .then(({ data }) => {
        if (data) {
          const loaded: Record<string, { mood: number; note: string }> = { ...entries };
          data.forEach((d: any) => {
            loaded[d.period] = { mood: d.mood_score || 0, note: d.note || "" };
          });
          setEntries(loaded);
        }
      });
  }, [user]);

  const updatePeriod = (period: string, field: "mood" | "note", value: number | string) => {
    setEntries((prev) => ({
      ...prev,
      [period]: { ...prev[period], [field]: value },
    }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      for (const [period, data] of Object.entries(entries)) {
        if (data.mood === 0) continue;
        await supabase.from("day_timeline_entries").upsert(
          {
            user_id: user.id,
            period,
            mood_score: data.mood,
            note: data.note || null,
            entry_date: today,
          },
          { onConflict: "user_id,entry_date,period" }
        );
      }
      toast.success("Línea del día guardada");
      navigate("/diario");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const hasData = Object.values(entries).some((e) => e.mood > 0);

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Línea del día</h1>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">Registrá cómo fue cada momento de tu día.</p>

      <div className="flex-1 space-y-4">
        {periods.map((p) => {
          const Icon = p.icon;
          const data = entries[p.key];
          return (
            <div key={p.key} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${p.color}`}>
                  <Icon size={16} weight="duotone" />
                </div>
                <span className="font-display text-sm font-medium">{p.label}</span>
              </div>

              {/* Mood selector */}
              <div className="mb-3 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => updatePeriod(p.key, "mood", v)}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 font-display text-[10px] transition-all",
                      data.mood === v
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {moodLabels[v]}
                  </button>
                ))}
              </div>

              <textarea
                value={data.note}
                onChange={(e) => updatePeriod(p.key, "note", e.target.value)}
                placeholder="¿Qué pasó? (opcional)"
                className="w-full resize-none rounded-xl border border-border bg-background p-2.5 text-xs font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                rows={2}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={!hasData || saving}
        className={cn(
          "mt-4 w-full rounded-2xl py-3 font-display text-sm font-medium transition-all",
          hasData ? "bg-primary text-primary-foreground active:scale-[0.98]" : "bg-muted text-muted-foreground"
        )}
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}
