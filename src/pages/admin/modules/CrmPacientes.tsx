import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminButton, AdminCard, AdminModal, AdminPageHeader, AdminTabs } from "@/components/admin/ui/AdminPrimitives";
import { Search, Download, Filter } from "lucide-react";
import { toast } from "sonner";

type Patient = {
  user_id: string; email: string | null; display_name: string | null;
  plan: string | null; treatment_status: string | null;
  created_at: string; is_admin: boolean; country: string | null;
};

type UsageStats = {
  checkins30d: number;
  thoughts: number;
  dbtSessions: number;
  habits: number;
  lastActive: string | null;
};

export default function CrmPacientes() {
  const [list, setList] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "premium" | "free">("all");
  const [selected, setSelected] = useState<Patient | null>(null);

  useEffect(() => {
    supabase.rpc("admin_list_patients").then(({ data }) => setList((data as Patient[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter((p) => {
      if (planFilter === "premium" && p.plan !== "premium") return false;
      if (planFilter === "free" && p.plan === "premium") return false;
      if (!term) return true;
      return [p.display_name, p.email, p.plan, p.country].some((v) => (v ?? "").toLowerCase().includes(term));
    });
  }, [q, list, planFilter]);

  const exportCsv = () => {
    const rows = [
      ["Nombre", "Email", "Plan", "País", "Admin", "Estado", "Alta"],
      ...filtered.map((p) => [
        p.display_name ?? "",
        p.email ?? "",
        p.plan ?? "free",
        p.country ?? "",
        p.is_admin ? "sí" : "no",
        p.treatment_status ?? "",
        new Date(p.created_at).toLocaleDateString("es-AR"),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resma-pacientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} registros exportados`);
  };

  const counts = useMemo(() => ({
    total: list.length,
    premium: list.filter((p) => p.plan === "premium").length,
    free: list.filter((p) => p.plan !== "premium").length,
  }), [list]);

  return (
    <>
      <AdminPageHeader title="CRM de Pacientes" subtitle="Gestión clínica y membresías" />
      <div className="px-8 pt-4">
        <AdminTabs tabs={[{ id: "dir", label: "Directorio de Pacientes" }]} value="dir" onChange={() => {}} />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        <AdminCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-resma-navy">Directorio</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {filtered.length} de {counts.total} pacientes · {counts.premium} premium · {counts.free} free
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="h-10 pl-8 pr-7 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-resma-teal focus:bg-white"
                >
                  <option value="all">Todos los planes</option>
                  <option value="premium">Premium</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar usuario, email o país…"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-resma-teal focus:bg-white"
                />
              </div>
              <AdminButton variant="secondary" onClick={exportCsv}>
                <Download size={13} /> CSV
              </AdminButton>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-admin-label text-[10px] text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3">Paciente</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Alta</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.user_id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-resma-navy">{p.display_name ?? "Sin nombre"}</div>
                    <div className="text-xs text-slate-500">{p.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      p.plan === "premium" ? "bg-resma-gold/15 text-amber-700" : "bg-slate-100 text-slate-600"
                    }`}>{p.plan ?? "free"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">Activo</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(p.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <AdminButton variant="secondary" onClick={() => setSelected(p)}>Ver Ficha</AdminButton>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">Sin pacientes que coincidan.</td></tr>
              )}
            </tbody>
          </table>
        </AdminCard>
      </div>

      <PatientModal patient={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function PatientModal({ patient, onClose }: { patient: Patient | null; onClose: () => void }) {
  const [tab, setTab] = useState<"perfil" | "uso" | "membresia">("perfil");
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patient) return;
    setUsage(null);
    setLoading(true);
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    (async () => {
      const [ci, th, db, hb] = await Promise.all([
        supabase.from("daily_checkins").select("created_at", { count: "exact" }).eq("user_id", patient.user_id).gte("created_at", since30).order("created_at", { ascending: false }).limit(1),
        supabase.from("thought_records").select("created_at", { count: "exact" }).eq("user_id", patient.user_id).order("created_at", { ascending: false }).limit(1),
        supabase.from("dbt_emotion_sessions").select("created_at", { count: "exact" }).eq("user_id", patient.user_id).order("created_at", { ascending: false }).limit(1),
        supabase.from("habit_completions").select("created_at", { count: "exact" }).eq("user_id", patient.user_id).order("created_at", { ascending: false }).limit(1),
      ]);
      const pickDate = (res: any): string | null => res?.data?.[0]?.created_at ?? null;
      const candidates = [pickDate(ci), pickDate(th), pickDate(db), pickDate(hb)].filter(Boolean) as string[];
      const lastActive = candidates.length ? candidates.sort().slice(-1)[0] : null;
      setUsage({
        checkins30d: ci.count ?? 0,
        thoughts: th.count ?? 0,
        dbtSessions: db.count ?? 0,
        habits: hb.count ?? 0,
        lastActive,
      });
      setLoading(false);
    })();
  }, [patient]);

  if (!patient) return null;

  const setPlan = async (newPlan: "premium" | "free") => {
    const reason = prompt(`Motivo para cambiar a ${newPlan}:`);
    if (!reason) return;
    const { error } = await supabase.rpc("admin_set_plan", {
      _user_id: patient.user_id,
      _plan: newPlan,
      _expires_at: newPlan === "premium" ? new Date(Date.now() + 365 * 86400000).toISOString() : null,
      _reason: reason,
    });
    if (error) toast.error(error.message);
    else toast.success(`Plan actualizado a ${newPlan}`);
  };

  return (
    <AdminModal open={!!patient} onClose={onClose} title={patient.display_name ?? "Paciente"} subtitle={patient.email ?? undefined}>
      <AdminTabs<"perfil" | "uso" | "membresia">
        tabs={[{ id: "perfil", label: "Perfil" }, { id: "uso", label: "Uso de la App" }, { id: "membresia", label: "Membresía" }]}
        value={tab} onChange={setTab}
      />
      <div className="pt-5">
        {tab === "perfil" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="País" value={patient.country ?? "—"} />
            <Field label="Estado tratamiento" value={patient.treatment_status ?? "—"} />
            <Field label="Plan" value={patient.plan ?? "free"} />
            <Field label="Rol" value={patient.is_admin ? "Admin" : "Paciente"} />
            <Field label="Alta" value={new Date(patient.created_at).toLocaleDateString("es-AR")} full />
          </div>
        )}
        {tab === "uso" && (
          <div className="space-y-4">
            {loading && <p className="text-xs text-slate-400">Cargando métricas…</p>}
            {usage && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Check-ins (30d)" value={String(usage.checkins30d)} />
                  <Field label="Pensamientos totales" value={String(usage.thoughts)} />
                  <Field label="Sesiones DBT" value={String(usage.dbtSessions)} />
                  <Field label="Logs de hábitos" value={String(usage.habits)} />
                  <Field
                    label="Última actividad"
                    value={usage.lastActive ? new Date(usage.lastActive).toLocaleString("es-AR") : "—"}
                    full
                  />
                </div>
                {!usage.checkins30d && !usage.thoughts && !usage.dbtSessions && !usage.habits && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
                    Sin actividad clínica registrada.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {tab === "membresia" && (
          <div className="space-y-4">
            <Field label="Plan actual" value={patient.plan ?? "free"} />
            <div className="flex gap-2">
              {patient.plan !== "premium" ? (
                <AdminButton onClick={() => setPlan("premium")}>Asignar premium</AdminButton>
              ) : (
                <AdminButton variant="danger" onClick={() => setPlan("free")}>Revocar premium</AdminButton>
              )}
            </div>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 ring-1 ring-slate-200">
              Cada cambio queda registrado en el log de auditoría con tu usuario y el motivo.
            </p>
          </div>
        )}
      </div>
    </AdminModal>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`${full ? "col-span-2" : ""} rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3`}>
      <div className="font-admin-label text-[10px] text-slate-500">{label}</div>
      <div className="text-sm text-resma-navy mt-1 font-medium">{value}</div>
    </div>
  );
}
