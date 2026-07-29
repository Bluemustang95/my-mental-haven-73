import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "@/components/admin/ui/AdminPrimitives";
import { loadWellbeingV3Admin } from "@/lib/wellbeing/fetch";
import { loadWellbeingConfig } from "@/lib/wellbeing/config";
import type { WellbeingSnapshotV3 } from "@/lib/wellbeing/types";
import { WELLBEING_WEIGHTS, CARE_WEIGHTS } from "@/lib/wellbeing/types";
import { WellbeingHeroV3 } from "@/components/proceso/WellbeingHeroV3";
import { PillarDetailGrid } from "@/components/proceso/PillarDetailGrid";
import { Eye, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

type Patient = { user_id: string; email: string | null; display_name: string | null };

const SUB_LABELS: Record<string, string> = {
  A1: "A1 · Ánimo consolidado",
  A1Delta: "A1Δ · Delta intradía (informativo)",
  B1: "B1 · Balance emocional nocturno",
  S0: "S0 · Calidad de sueño",
  S1: "S1 · Higiene y sueños",
  S2: "S2 · Sensación al despertar",
  R1: "R1 · Uso de recursos",
  T1A: "T1A · Asistencia a terapia",
  T1B: "T1B · Adherencia a medicación",
  T1C: "T1C · Notas de sesión",
  T1D: "T1D · Notas compartidas",
};

export default function WellbeingPreview() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<WellbeingSnapshotV3 | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_list_patients");
      if (error) { toast.error("No se pudo cargar la lista de pacientes"); return; }
      setPatients((data ?? []) as Patient[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients.slice(0, 60);
    return patients
      .filter((p) => (p.email ?? "").toLowerCase().includes(s) || (p.display_name ?? "").toLowerCase().includes(s))
      .slice(0, 60);
  }, [patients, q]);

  async function load(userId: string) {
    setSelected(userId);
    setLoading(true);
    setSnapshot(null);
    try {
      setSnapshot(await loadWellbeingV3Admin(userId, await loadWellbeingConfig()));
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo calcular el índice");
    } finally {
      setLoading(false);
    }
  }

  const current = patients.find((p) => p.user_id === selected);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <AdminCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Eye size={15} className="text-resma-teal" />
          <h3 className="text-sm font-semibold text-resma-navy">Elegí un paciente</h3>
        </div>
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-resma-navy outline-none focus:border-resma-teal"
          />
        </div>
        <div className="admin-scroll max-h-[520px] space-y-1 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.user_id}
              onClick={() => load(p.user_id)}
              className={`w-full rounded-xl px-3 py-2 text-left transition ${
                selected === p.user_id ? "bg-resma-navy text-white" : "hover:bg-slate-100 text-resma-navy"
              }`}
            >
              <div className="truncate text-xs font-semibold">{p.display_name || "Sin nombre"}</div>
              <div className={`truncate text-[10px] ${selected === p.user_id ? "text-white/60" : "text-slate-500"}`}>
                {p.email}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-2 py-6 text-center text-xs text-slate-400">Sin resultados</p>}
        </div>
      </AdminCard>

      <div className="space-y-4">
        <AdminCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-resma-navy">
                {current ? `Índice de ${current.display_name || current.email}` : "Vista del paciente"}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Índice v3: mismos datos, misma fórmula y mismos componentes que ve la persona en “Mi Proceso”.
              </p>
            </div>
            {selected && (
              <button
                onClick={() => load(selected)}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-resma-navy hover:bg-slate-50"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Actualizar
              </button>
            )}
          </div>

          {!selected ? (
            <p className="py-16 text-center text-xs text-slate-400">
              Seleccioná un paciente de la lista para ver su índice.
            </p>
          ) : (
            <div className="mx-auto w-full max-w-[400px] rounded-[28px] bg-[#f9f9fb] p-4 shadow-[0_20px_50px_-30px_rgba(16,25,39,0.6)]">
              <WellbeingHeroV3 snapshot={snapshot} variant="detail" onOpen={() => {}} />
              <PillarDetailGrid snapshot={snapshot} onOpenMonth={() => {}} />
            </div>
          )}
        </AdminCard>

        {selected && snapshot && (
          <>
            <AdminCard className="p-6">
              <h4 className="text-sm font-semibold text-resma-navy">Auditoría del cálculo</h4>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Umbral {snapshot.minDays}/7 días · registrados: {snapshot.daysWithCheckin} ·{" "}
                {snapshot.hasEnoughData ? "índice calculado" : `faltan ${snapshot.daysMissing} día(s)`}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric label="Bienestar (SENTIR)" value={snapshot.wellbeingScore} />
                <Metric label="Bienestar sin modulador" value={snapshot.wellbeingRaw} />
                <Metric label="Cuidado (HACER)" value={snapshot.careScore} />
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
                <p className="font-semibold text-resma-navy">Modulador clínico</p>
                {snapshot.modulator.penalty > 0 ? (
                  <p className="mt-1">
                    {snapshot.modulator.testType} · severidad {snapshot.modulator.severity} ·{" "}
                    {snapshot.modulator.ageDays} días → −{snapshot.modulator.penalty} pts
                  </p>
                ) : (
                  <p className="mt-1">
                    Sin penalización{snapshot.modulator.stale ? " (test vencido, >45 días)" : ""}.
                  </p>
                )}
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Pilar</th>
                      <th className="px-3 py-2 font-semibold">Índice</th>
                      <th className="px-3 py-2 font-semibold">Score</th>
                      <th className="px-3 py-2 font-semibold">Peso base</th>
                      <th className="px-3 py-2 font-semibold">Peso aplicado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(snapshot.pillars).map((p) => (
                      <tr key={p.key}>
                        <td className="px-3 py-2 font-medium text-resma-navy">{p.key}</td>
                        <td className="px-3 py-2 text-slate-500">
                          {p.key in WELLBEING_WEIGHTS ? "Bienestar" : p.key in CARE_WEIGHTS ? "Cuidado" : "—"}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{p.score === null ? "sin datos" : Math.round(p.score)}</td>
                        <td className="px-3 py-2 tabular-nums text-slate-500">{p.baseWeight}%</td>
                        <td className="px-3 py-2 tabular-nums font-semibold">
                          {p.appliedWeight}%
                          {p.appliedWeight !== p.baseWeight && (
                            <span className="ml-1 text-[10px] font-normal text-amber-600">renormalizado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>

            <AdminCard className="p-6">
              <h4 className="text-sm font-semibold text-resma-navy">Sub-ítems crudos</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(snapshot.subItems).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px]">
                    <span className="text-slate-600">{SUB_LABELS[k] ?? k}</span>
                    <span className={`tabular-nums font-semibold ${v === null ? "text-slate-400" : "text-resma-navy"}`}>
                      {v === null ? "sin datos" : Math.round(v as number)}
                    </span>
                  </div>
                ))}
              </div>
            </AdminCard>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-resma-navy">
        {value === null ? "—" : Math.round(value)}
      </p>
    </div>
  );
}
