import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminModal, AdminPageHeader } from "@/components/admin/ui/AdminPrimitives";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

type Row = { emotion: string; criterion: string; opposite: string };
const DEFAULT: Row[] = [
  { emotion: "Miedo", criterion: "La amenaza es real y proporcional", opposite: "Acercarte de forma gradual al estímulo." },
  { emotion: "Tristeza", criterion: "Hay una pérdida significativa", opposite: "Activarte: salir, moverte, conectar." },
  { emotion: "Ira", criterion: "La frontera fue genuinamente vulnerada", opposite: "Suavizar la voz, validar al otro." },
  { emotion: "Culpa", criterion: "Violaste un valor propio", opposite: "Reparar; si no aplica, soltar la culpa con compasión." },
  { emotion: "Vergüenza", criterion: "El grupo te rechazaría si supiera", opposite: "Exponer lo escondido en un entorno seguro." },
];

export default function RegulacionDbtAdmin() {
  const [rows, setRows] = useState<Row[]>(DEFAULT);
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => { loadSetting<Row[]>("dbt_matrix", DEFAULT).then(setRows); }, []);

  const persist = async (next: Row[]) => {
    setRows(next);
    await saveSetting("dbt_matrix", next);
    toast.success("Matriz DBT actualizada");
  };

  return (
    <>
      <AdminPageHeader title="Regulación Emocional (DBT)" subtitle="Matriz de Efectividad - Ficha 9 (Linehan)" />
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        <AdminCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-admin-label text-[10px] text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 w-40">Emoción</th>
                <th className="px-5 py-3">Criterio de Ajuste</th>
                <th className="px-5 py-3">Acción Opuesta</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-resma-navy">{r.emotion}</td>
                  <td className="px-5 py-4 text-slate-700">{r.criterion}</td>
                  <td className="px-5 py-4 text-slate-700">{r.opposite}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setEditing(i)} className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-500 transition flex items-center justify-center mx-auto">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      </div>

      {editing !== null && (
        <AdminModal open onClose={() => setEditing(null)} title={`Editar: ${rows[editing].emotion}`} subtitle="Criterio y acción opuesta">
          <div className="space-y-4">
            <div>
              <label className="font-admin-label text-[10px] text-slate-500">Criterio de Ajuste</label>
              <textarea
                value={rows[editing].criterion}
                onChange={(e) => { const next = [...rows]; next[editing] = { ...next[editing], criterion: e.target.value }; setRows(next); }}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-resma-teal focus:bg-white resize-none"
              />
            </div>
            <div>
              <label className="font-admin-label text-[10px] text-slate-500">Acción Opuesta</label>
              <textarea
                value={rows[editing].opposite}
                onChange={(e) => { const next = [...rows]; next[editing] = { ...next[editing], opposite: e.target.value }; setRows(next); }}
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-resma-teal focus:bg-white resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setEditing(null)}>Cancelar</AdminButton>
              <AdminButton onClick={async () => { await persist(rows); setEditing(null); }}>Guardar</AdminButton>
            </div>
          </div>
        </AdminModal>
      )}
    </>
  );
}
