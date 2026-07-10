import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Save, RotateCcw } from "lucide-react";
import {
  ALGO_VERSION,
  CATEGORY_CONTENT,
  TOOL_META,
  type PlanCategory,
} from "@/lib/onboardingAlgorithm";
import { clearAlgoConfigCache } from "@/lib/algoConfigLoader";

// Default weights mirror the ones baked in onboardingAlgorithm.ts
const DEFAULT_WEIGHTS = {
  q1_multiplier: 3,
  q2_multiplier: 2,
  q3_multiplier: 2.5,
  age_teen_boost: 1.2,
  pack_ar_only: true,
  notes:
    "Q1 (brújula) × 3, Q2 (maleta) × 2, Q3 (sueño) × 2.5, Q4 (formato) multiplica los módulos ya scoreados. pack_actividades solo cuenta para AR.",
};

type Metrics = {
  total_completed: number;
  total_in_progress: number;
  by_category: { category: string; count: number }[];
  by_priority_module: { module: string; count: number }[];
  by_algo_version: { version: number; count: number }[];
  completion_rate_30d: number | null;
};

export default function OnboardingAlgoAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weightsText, setWeightsText] = useState("");
  const [contentText, setContentText] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recalcEmail, setRecalcEmail] = useState("");
  const [recalcBusy, setRecalcBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: cfg }, { data: m }] = await Promise.all([
      supabase.from("algo_onboarding_config").select("*").eq("id", 1).maybeSingle(),
      supabase.rpc("admin_onboarding_metrics"),
    ]);
    const w = (cfg?.weights as any) ?? {};
    const c = (cfg?.category_content as any) ?? {};
    setWeightsText(
      JSON.stringify(Object.keys(w).length ? w : DEFAULT_WEIGHTS, null, 2),
    );
    setContentText(
      JSON.stringify(Object.keys(c).length ? c : CATEGORY_CONTENT, null, 2),
    );
    setMetrics((m as any) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    let weights: any, content: any;
    try {
      weights = JSON.parse(weightsText);
      content = JSON.parse(contentText);
    } catch (e: any) {
      toast.error("JSON inválido: " + e.message);
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("admin_save_algo_config", {
      _weights: weights,
      _category_content: content,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    clearAlgoConfigCache();
    toast.success("Configuración guardada");
  }

  async function resetPlan() {
    if (!recalcEmail.trim()) return;
    setRecalcBusy(true);
    const { data: profile, error: pe } = await supabase
      .from("patient_app_profiles")
      .select("user_id")
      .ilike("display_name", `%${recalcEmail}%`)
      .limit(1)
      .maybeSingle();
    if (pe || !profile) {
      // Try via auth email lookup through admin_list_patients
      const { data: list } = await supabase.rpc("admin_list_patients");
      const match = (list as any[])?.find(
        (p) => p.email?.toLowerCase() === recalcEmail.toLowerCase(),
      );
      if (!match) {
        toast.error("Paciente no encontrado");
        setRecalcBusy(false);
        return;
      }
      const { error } = await supabase.rpc("admin_reset_plan", {
        _user_id: match.user_id,
        _reason: "Reset manual desde panel",
      });
      setRecalcBusy(false);
      if (error) toast.error(error.message);
      else toast.success("Plan reseteado. Se recalculará al próximo ingreso.");
      return;
    }
    const { error } = await supabase.rpc("admin_reset_plan", {
      _user_id: profile.user_id,
      _reason: "Reset manual desde panel",
    });
    setRecalcBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Plan reseteado");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Algoritmo de onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Versión activa: v{ALGO_VERSION} · edita pesos, contenido de categorías y consulta métricas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCcw className="w-4 h-4 mr-2" /> Refrescar
        </Button>
      </header>

      <Tabs defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="weights">Ponderaciones</TabsTrigger>
          <TabsTrigger value="content">Categorías</TabsTrigger>
          <TabsTrigger value="tools">Mapeo de herramientas</TabsTrigger>
          <TabsTrigger value="recalc">Recalcular plan</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Metric label="Onboarding completado" value={metrics.total_completed} />
              <Metric label="En proceso" value={metrics.total_in_progress} />
              <Metric
                label="Finalización 30d"
                value={metrics.completion_rate_30d != null ? `${metrics.completion_rate_30d}%` : "—"}
              />
              <Metric label="Versión algo" value={`v${ALGO_VERSION}`} />
            </div>
          )}
          <Card className="p-4">
            <h3 className="font-medium mb-2">Distribución por categoría</h3>
            <BarList rows={metrics?.by_category.map((r) => ({ label: r.category, value: r.count })) ?? []} />
          </Card>
          <Card className="p-4">
            <h3 className="font-medium mb-2">Módulo prioritario asignado</h3>
            <BarList rows={metrics?.by_priority_module.map((r) => ({ label: r.module, value: r.count })) ?? []} />
          </Card>
          <Card className="p-4">
            <h3 className="font-medium mb-2">Usuarios por versión de algoritmo</h3>
            <BarList rows={metrics?.by_algo_version.map((r) => ({ label: `v${r.version}`, value: r.count })) ?? []} />
          </Card>
        </TabsContent>

        <TabsContent value="weights" className="space-y-3">
          <Card className="p-4 space-y-3">
            <div>
              <Label>Pesos del algoritmo (JSON)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Multiplicadores por pregunta y modificadores blandos. Los cambios se aplican en el próximo cálculo.
              </p>
              <Textarea
                value={weightsText}
                onChange={(e) => setWeightsText(e.target.value)}
                className="font-mono text-xs min-h-[280px]"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setWeightsText(JSON.stringify(DEFAULT_WEIGHTS, null, 2))}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Restaurar defaults
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-3">
          <Card className="p-4 space-y-3">
            <div>
              <Label>Contenido de categorías (JSON)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Título, subtítulo, descripción, icono y color de acento por categoría del plan.
              </p>
              <Textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="font-mono text-xs min-h-[420px]"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setContentText(JSON.stringify(CATEGORY_CONTENT, null, 2))}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Restaurar defaults
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card className="p-4">
            <h3 className="font-medium mb-3">Herramientas del algoritmo</h3>
            <div className="grid gap-2">
              {Object.entries(TOOL_META).map(([id, meta]) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-2 border rounded-md text-sm"
                >
                  <div>
                    <div className="font-medium">{meta.label}</div>
                    <div className="text-xs text-muted-foreground">
                      widget: {meta.widget_id} · id: {id}
                    </div>
                  </div>
                  <code className="text-xs text-muted-foreground">{meta.route}</code>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="recalc">
          <Card className="p-4 space-y-3">
            <div>
              <Label>Email del paciente</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Resetea plan_category, top3_tools y home_seeded. En el próximo ingreso se recalcula con los pesos actuales.
              </p>
              <div className="flex gap-2">
                <Input
                  value={recalcEmail}
                  onChange={(e) => setRecalcEmail(e.target.value)}
                  placeholder="paciente@correo.com"
                />
                <Button onClick={resetPlan} disabled={recalcBusy || !recalcEmail.trim()}>
                  {recalcBusy ? "…" : "Resetear plan"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-muted-foreground">Sin datos aún.</p>;
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-sm">
          <div className="w-40 truncate text-muted-foreground">{r.label}</div>
          <div className="flex-1 bg-muted/50 h-4 rounded overflow-hidden">
            <div
              className="h-full bg-primary/60"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <div className="w-10 text-right tabular-nums">{r.value}</div>
        </div>
      ))}
    </div>
  );
}
