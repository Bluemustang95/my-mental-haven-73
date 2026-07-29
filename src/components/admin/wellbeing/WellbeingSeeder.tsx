import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminButton } from "@/components/admin/ui/AdminPrimitives";
import { MIN_DAYS } from "@/lib/wellbeingScore";
import { toast } from "sonner";
import { FlaskConical, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ScenarioId = "high" | "mid" | "low" | "partial";

type Scenario = {
  id: ScenarioId;
  label: string;
  description: string;
  mood: number;
  sleep: number;
  dawn: string | null;
  emotions: string[] | null;
};

const SCENARIOS: Scenario[] = [
  { id: "high", label: "Bienestar alto", description: "Ánimo 5 · Sueño 5 · Excelente · emociones positivas", mood: 5, sleep: 5, dawn: "Excelente", emotions: ["Calma", "Alegría", "Energía"] },
  { id: "mid", label: "Medio", description: "Ánimo 3 · Sueño 3 · Normal · emociones mixtas", mood: 3, sleep: 3, dawn: "Normal", emotions: ["Calma", "Ansiedad"] },
  { id: "low", label: "Bajo", description: "Ánimo 2 · Sueño 1 · Mal · emociones difíciles", mood: 2, sleep: 1, dawn: "Mal", emotions: ["Ansiedad", "Tristeza", "Agotamiento"] },
  { id: "partial", label: "Incompleto", description: "Sin despertar ni emociones → muestra la renormalización", mood: 4, sleep: 4, dawn: null, emotions: null },
];

function localDateStr(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export default function WellbeingSeeder() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<ScenarioId>("mid");
  const [busy, setBusy] = useState(false);
  const [seeded, setSeeded] = useState<number | null>(null);

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase
      .from("daily_checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_test_seed", true);
    setSeeded(count ?? 0);
  };

  useEffect(() => { refresh(); }, []);

  const seed = async () => {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no encontrada");
      const s = SCENARIOS.find((x) => x.id === scenario)!;

      const rows: any[] = [];
      for (let i = 0; i < MIN_DAYS; i++) {
        const date = localDateStr(i);
        rows.push({
          user_id: user.id,
          checkin_date: date,
          mode: "morning",
          mood_score: s.mood,
          dawn_score: s.dawn,
          is_test_seed: true,
        });
        rows.push({
          user_id: user.id,
          checkin_date: date,
          mode: "night",
          sleep_score: s.sleep,
          emotions: s.emotions,
          is_test_seed: true,
        });
      }

      const { error } = await supabase
        .from("daily_checkins")
        .upsert(rows, { onConflict: "user_id,checkin_date,mode" });
      if (error) throw error;

      toast.success(`${MIN_DAYS} días sembrados en tu cuenta`);
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo sembrar");
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no encontrada");
      const { error } = await supabase
        .from("daily_checkins")
        .delete()
        .eq("user_id", user.id)
        .eq("is_test_seed", true);
      if (error) throw error;
      toast.success("Datos de prueba eliminados");
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo borrar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard className="p-6">
        <div className="mb-1 flex items-center gap-2">
          <FlaskConical size={16} className="text-resma-teal" />
          <h2 className="text-base font-semibold text-resma-navy">Sembrar {MIN_DAYS} días de prueba</h2>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Crea check-ins de mañana y noche para hoy y los {MIN_DAYS - 1} días anteriores en <strong>tu propia cuenta</strong>,
          para ver el índice ya calculado con el umbral cumplido.
        </p>

        <div className="mb-5 grid gap-2 md:grid-cols-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                scenario === s.id ? "border-resma-teal bg-resma-teal/10" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-semibold text-resma-navy">{s.label}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{s.description}</div>
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Escribe registros reales en tu cuenta (marcados como prueba). Sobrescribe tus check-ins de estos {MIN_DAYS} días.
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminButton disabled={busy} onClick={seed}>
            <FlaskConical size={14} /> Sembrar {MIN_DAYS} días
          </AdminButton>
          <AdminButton variant="danger" disabled={busy || seeded === 0} onClick={clear}>
            <Trash2 size={14} /> Borrar datos de prueba{seeded ? ` (${seeded})` : ""}
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => navigate("/mi-proceso")}>
            <ExternalLink size={14} /> Ver en Mi proceso
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
}
