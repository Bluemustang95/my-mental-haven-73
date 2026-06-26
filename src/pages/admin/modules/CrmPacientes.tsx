import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminButton, AdminCard, AdminModal, AdminPageHeader, AdminTabs, ProgressBar } from "@/components/admin/ui/AdminPrimitives";
import { Search } from "lucide-react";
import { toast } from "sonner";

type Patient = {
  user_id: string; email: string | null; display_name: string | null;
  plan: string | null; treatment_status: string | null;
  created_at: string; is_admin: boolean; country: string | null;
};

export default function CrmPacientes() {
  const [list, setList] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);

  useEffect(() => {
    supabase.rpc("admin_list_patients").then(({ data }) => setList((data as Patient[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((p) =>
      [p.display_name, p.email, p.plan].some((v) => (v ?? "").toLowerCase().includes(term))
    );
  }, [q, list]);

  return (
    <>
      <AdminPageHeader title="CRM de Pacientes" subtitle="Gestión clínica y membresías" />
      <div className="px-8 pt-4">
        <AdminTabs tabs={[{ id: "dir", label: "Directorio de Pacientes" }]} value="dir" onChange={() => {}} />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-resma-navy">Directorio</h2>
              <p className="text-xs text-slate-500 mt-0.5">{filtered.length} pacientes</p>
            </div>
            <div className="relative w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar usuario, email o plan…"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-resma-teal focus:bg-white"
              />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-admin-label text-[10px] text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3">Paciente</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Última Actividad</th>
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
  if (!patient) return null;
  return (
    <AdminModal open={!!patient} onClose={onClose} title={patient.display_name ?? "Paciente"} subtitle={patient.email ?? undefined}>
      <AdminTabs<"perfil" | "uso" | "membresia">
        tabs={[{ id: "perfil", label: "Perfil" }, { id: "uso", label: "Uso de la App" }, { id: "membresia", label: "Membresía" }]}
        value={tab} onChange={setTab}
      />
      <div className="pt-5">
        {tab === "perfil" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Edad" value="—" />
            <Field label="Ocupación" value="—" />
            <Field label="País" value={patient.country ?? "—"} />
            <Field label="Estado tratamiento" value={patient.treatment_status ?? "—"} />
            <Field label="Motivo de consulta" value="—" full />
            <Field label="BDI-II inicial" value="—" />
          </div>
        )}
        {tab === "uso" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Módulo más usado" value="Diario" />
              <Field label="Check-ins (30d)" value="12" />
            </div>
            <div>
              <div className="font-admin-label text-[10px] text-slate-500 mb-2">Constancia últimos 7 días</div>
              <div className="flex items-end gap-1 h-24">
                {[3, 5, 2, 6, 4, 7, 3].map((v, i) => (
                  <div key={i} className="flex-1 bg-resma-teal/30 rounded-t" style={{ height: `${v * 12}%` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === "membresia" && (
          <div className="space-y-4">
            <Field label="Plan actual" value={patient.plan ?? "free"} />
            <div className="flex gap-2">
              <AdminButton variant="secondary" onClick={() => toast.success("Suscripción pausada")}>Pausar suscripción</AdminButton>
              <AdminButton variant="danger" onClick={() => toast.error("Suscripción revocada")}>Revocar suscripción</AdminButton>
            </div>
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
