import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "@/components/admin/ui/AdminPrimitives";
import { computeCheckinCore, WEIGHTS, type WellbeingSnapshot } from "@/lib/wellbeingScore";
import { WellbeingCardV2 } from "@/components/proceso/WellbeingCardV2";
import { SubIndexGrid } from "@/components/proceso/SubIndexGrid";
import { Eye, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

type Patient = { user_id: string; email: string | null; display_name: string | null };
type Row = {
  checkin_date: string;
  mood_score: number | null;
  sleep_score: number | null;
  dawn_score: string | null;
  emotions: string[] | null;
  mode: string | null;
};

export default function WellbeingPreview() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
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
    const { data, error } = await supabase.rpc("admin_wellbeing_checkins", { _user_id: userId });
    setLoading(false);
    if (error) { toast.error(error.message); setRows([]); return; }
    setRows((data ?? []) as Row[]);
  }

  const snapshot: WellbeingSnapshot | null = useMemo(() => {
    if (!selected) return null;
    const core = computeCheckinCore(rows as any[]);
    return { ...core, selfCare: { habits: null, engagement: null, medication: null, tests: null } };
  }, [rows, selected]);

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
                Exactamente lo que la persona ve en “Mi proceso”, calculado con la misma fórmula.
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
            <div className="mx-auto w-full max-w-[380px] rounded-[28px] bg-[#FDFCFB] p-4 shadow-[0_20px_50px_-30px_rgba(16,25,39,0.6)]">
              <WellbeingCardV2
                score={snapshot?.score ?? 0}
                delta={snapshot?.delta ?? 0}
                message={snapshot?.message}
                trend={snapshot?.trend ?? []}
                hasEnoughData={snapshot?.hasEnoughData}
                daysWithCheckin={snapshot?.daysWithCheckin}
                minDays={snapshot?.minDays}
                onOpen={() => {}}
              />
              <SubIndexGrid snapshot={snapshot} />
            </div>
          )}
        </AdminCard>

        {selected && (
          <AdminCard className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-resma-navy">Datos crudos usados (14 días)</h3>
            {rows.length === 0 ? (
              <p className="text-xs text-slate-400">Este paciente no tiene check-ins en los últimos 14 días.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-3">Fecha</th>
                      <th className="py-2 pr-3">Momento</th>
                      <th className="py-2 pr-3">Ánimo</th>
                      <th className="py-2 pr-3">Sueño</th>
                      <th className="py-2 pr-3">Despertar</th>
                      <th className="py-2">Emociones</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    {rows.map((r, i) => (
                      <tr key={`${r.checkin_date}-${r.mode}-${i}`} className="border-b border-slate-100">
                        <td className="py-2 pr-3 font-semibold text-resma-navy">{r.checkin_date}</td>
                        <td className="py-2 pr-3">{r.mode ?? "—"}</td>
                        <td className="py-2 pr-3 tabular-nums">{r.mood_score ?? "—"}</td>
                        <td className="py-2 pr-3 tabular-nums">{r.sleep_score ?? "—"}</td>
                        <td className="py-2 pr-3">{r.dawn_score ?? "—"}</td>
                        <td className="py-2">{(r.emotions ?? []).join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-500">
              Pesos base: Ánimo {WEIGHTS.mood}% · Sueño {WEIGHTS.sleep}% · Balance {WEIGHTS.balance}% · Despertar {WEIGHTS.dawn}%.
            </p>
          </AdminCard>
        )}
      </div>
    </div>
  );
}
