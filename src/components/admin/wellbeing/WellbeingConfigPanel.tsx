import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";
import { AdminButton, AdminCard, AdminLabel, AdminToggle } from "@/components/admin/ui/AdminPrimitives";
import { DEFAULT_CONFIG, type WellbeingConfig } from "@/lib/wellbeing/types";
import { loadWellbeingConfig, saveWellbeingConfig, sumCare, sumWellbeing } from "@/lib/wellbeing/config";

function Slider({ label, value, min, max, suffix = "%", onChange }: {
  label: string; value: number; min: number; max: number; suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-resma-navy font-semibold tabular-nums">{value}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-resma-teal"
        aria-label={label}
      />
    </div>
  );
}

export default function WellbeingConfigPanel() {
  const [cfg, setCfg] = useState<WellbeingConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadWellbeingConfig(true).then(setCfg); }, []);

  if (!cfg) return <div className="text-sm text-slate-500">Cargando configuración…</div>;

  const wSum = sumWellbeing(cfg);
  const cSum = sumCare(cfg);
  const patch = (p: Partial<WellbeingConfig>) => setCfg({ ...cfg, ...p });

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveWellbeingConfig(cfg);
      setCfg(saved);
      toast.success("Configuración del índice guardada");
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <AdminCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <AdminLabel>BIENESTAR (SENTIR)</AdminLabel>
            <div className="text-sm text-slate-500 mt-0.5">Pesos base de los pilares subjetivos.</div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${wSum === 100 ? "bg-resma-teal/10 text-resma-teal" : "bg-amber-100 text-amber-700"}`}>
            Suma {wSum}%
          </span>
        </div>
        <Slider label="Ánimo (A1)" value={cfg.wellbeingWeights.mood} min={0} max={100}
                onChange={(v) => patch({ wellbeingWeights: { ...cfg.wellbeingWeights, mood: v } })} />
        <Slider label="Sueño (S0/S1/S2)" value={cfg.wellbeingWeights.sleep} min={0} max={100}
                onChange={(v) => patch({ wellbeingWeights: { ...cfg.wellbeingWeights, sleep: v } })} />
        <Slider label="Balance emocional (B1)" value={cfg.wellbeingWeights.balance} min={0} max={100}
                onChange={(v) => patch({ wellbeingWeights: { ...cfg.wellbeingWeights, balance: v } })} />
        {wSum !== 100 && (
          <p className="text-xs text-amber-700">
            La suma no da 100%. El motor renormaliza igual, pero conviene ajustarla para que los porcentajes sean legibles.
          </p>
        )}
      </AdminCard>

      <AdminCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <AdminLabel>CUIDADO (HACER)</AdminLabel>
            <div className="text-sm text-slate-500 mt-0.5">Pesos base de las conductas de autocuidado.</div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${cSum === 100 ? "bg-resma-teal/10 text-resma-teal" : "bg-amber-100 text-amber-700"}`}>
            Suma {cSum}%
          </span>
        </div>
        <Slider label="Uso de recursos (R1)" value={cfg.careWeights.resources} min={0} max={100}
                onChange={(v) => patch({ careWeights: { ...cfg.careWeights, resources: v } })} />
        <Slider label="Tratamiento (T1A-D)" value={cfg.careWeights.treatment} min={0} max={100}
                onChange={(v) => patch({ careWeights: { ...cfg.careWeights, treatment: v } })} />
      </AdminCard>

      <AdminCard className="p-5 space-y-5">
        <div>
          <AdminLabel>UMBRAL DE FIABILIDAD</AdminLabel>
          <div className="text-sm text-slate-500 mt-0.5">
            Se necesitan <b>{cfg.minDays}</b> días con check-in dentro de una ventana de <b>{cfg.windowDays}</b> días.
            Por debajo del umbral el índice se muestra como “sin datos suficientes”.
          </div>
        </div>
        <Slider label="Días mínimos con check-in" value={cfg.minDays} min={1} max={7} suffix=" días"
                onChange={(v) => patch({ minDays: Math.min(v, cfg.windowDays) })} />
        <Slider label="Ventana de cálculo" value={cfg.windowDays} min={3} max={30} suffix=" días"
                onChange={(v) => patch({ windowDays: v, minDays: Math.min(cfg.minDays, v) })} />
      </AdminCard>

      <AdminCard className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-resma-navy text-sm">Modulador clínico (Módulo B)</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Resta hasta 15 puntos al Bienestar según la severidad del último test (BDI-II, BAI, PHQ-9, GAD-7),
              con decaimiento lineal entre los 30 y los 45 días.
            </div>
          </div>
          <AdminToggle value={cfg.modulatorEnabled} onChange={(v) => patch({ modulatorEnabled: v })} label="Modulador clínico" />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <div className="font-semibold text-resma-navy text-sm">Modo de visualización</div>
            <div className="text-xs text-slate-500 mt-0.5">
              “Split” muestra Bienestar y Cuidado por separado; “Combinado” muestra un único número (35/30/15/20).
            </div>
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(["split", "combined"] as const).map((m) => (
              <button key={m} onClick={() => patch({ displayMode: m })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${cfg.displayMode === m ? "bg-white text-resma-navy shadow-sm" : "text-slate-500"}`}>
                {m === "split" ? "Split" : "Combinado"}
              </button>
            ))}
          </div>
        </div>
      </AdminCard>

      <div className="flex justify-end gap-2">
        <AdminButton variant="secondary" onClick={() => setCfg(DEFAULT_CONFIG)}>
          <RotateCcw size={14} /> Restaurar valores por defecto
        </AdminButton>
        <AdminButton onClick={save} disabled={saving}>
          <Save size={14} /> {saving ? "Guardando…" : "Guardar configuración"}
        </AdminButton>
      </div>
      <p className="text-xs text-slate-500">
        Los cambios aplican a todos los pacientes en su próxima carga de “Mi Proceso” y al preview del panel.
      </p>
    </div>
  );
}
