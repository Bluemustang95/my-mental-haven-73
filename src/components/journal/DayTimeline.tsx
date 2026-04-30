import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, CloudSun, Moon } from "@phosphor-icons/react";
import { cn, localDateStr } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HistoryPanel from "./HistoryPanel";
import { useConsistentBack } from "@/hooks/useConsistentBack";

const periods = [
  { key: "morning", label: "Mañana", icon: Sun },
  { key: "afternoon", label: "Tarde", icon: CloudSun },
  { key: "night", label: "Noche", icon: Moon },
];

const moodLabels = ["", "Muy mal", "Mal", "Regular", "Bien", "Muy bien"];

export default function DayTimeline() {
  const navigate = useNavigate();
  const goBack = useConsistentBack("/diario/herramientas");
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
      goBack();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const hasData = Object.values(entries).some((e) => e.mood > 0);

  return (
    <div className="flex min-h-screen flex-col bg-resource-sleep-bg px-5 pt-14 pb-4 text-resource-sleep-accent safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-sleep-accent/15 bg-card/75 text-resource-sleep-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-3xl leading-tight">Línea del día</h1>
          <p className="font-sans text-xs leading-5 text-resource-sleep-accent/65">Cómo fue cada momento</p>
        </div>
        <HistoryPanel<{ id: string; created_at: string | null; period: string; mood_score: number | null; note: string | null; entry_date: string | null }>
          tableName="day_timeline_entries"
          renderItem={(item) => {
            const periodLabel = item.period === "morning" ? "Mañana" : item.period === "afternoon" ? "Tarde" : "Noche";
            return (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-foreground">{periodLabel}</span>
                <span className="text-[10px] text-muted-foreground">· {moodLabels[item.mood_score || 0]}</span>
              </div>
            );
          }}
          renderDetail={(item) => {
            const periodLabel = item.period === "morning" ? "Mañana" : item.period === "afternoon" ? "Tarde" : "Noche";
            return (
              <div className="space-y-3">
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">Momento</p>
                  <p className="text-sm font-body font-medium">{periodLabel}</p>
                </div>
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">Estado</p>
                  <p className="text-sm font-body">{moodLabels[item.mood_score || 0]}</p>
                </div>
                {item.note && (
                  <div>
                    <p className="font-display text-xs text-muted-foreground mb-1">Nota</p>
                    <p className="text-sm font-body whitespace-pre-wrap">{item.note}</p>
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      <div className="flex-1 space-y-4">
        {periods.map((p) => {
          const Icon = p.icon;
          const data = entries[p.key];
          return (
            <div key={p.key} className="rounded-[2rem] border border-resource-sleep-accent/15 bg-card/75 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-resource-sleep-bg/70">
                  <Icon size={16} weight="duotone" />
                </div>
                <span className="font-display text-sm font-semibold">{p.label}</span>
              </div>

              <div className="mb-3 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => updatePeriod(p.key, "mood", v)}
                    className={cn(
                      "flex-1 rounded-xl py-1.5 font-display text-[10px] font-semibold transition-all",
                      data.mood === v
                        ? "bg-resource-sleep-accent text-primary-foreground"
                        : "bg-resource-sleep-bg/55 text-resource-sleep-accent/70"
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
                rows={2}
                className="w-full resize-none rounded-xl border border-resource-sleep-accent/15 bg-resource-sleep-bg/40 p-2.5 font-sans text-xs text-resource-sleep-accent placeholder:text-resource-sleep-accent/45 focus:outline-none focus:ring-2 focus:ring-resource-sleep-accent/20"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={!hasData || saving}
        className={cn(
          "mt-4 w-full rounded-2xl py-3 font-display text-sm font-semibold transition-all",
          hasData ? "bg-resource-sleep-accent text-primary-foreground active:scale-[0.98]" : "bg-card/55 text-resource-sleep-accent/45"
        )}
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}
