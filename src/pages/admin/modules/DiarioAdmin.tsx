import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminCard, AdminButton, AdminPageHeader, AdminTabs } from "@/components/admin/ui/AdminPrimitives";

type Prompt = { id: string; text: string; tag: string | null; active: boolean; sort_order: number };

export default function DiarioAdmin() {
  const [tab, setTab] = useState<"inspire">("inspire");
  return (
    <div className="p-6 space-y-4">
      <AdminPageHeader
        title="Diario"
        subtitle="Contenido y prompts que aparecen en el módulo Diario de los usuarios."
      />
      <AdminTabs
        tabs={[{ id: "inspire", label: "Inspirarme" }]}
        value={tab}
        onChange={(v) => setTab(v as "inspire")}
      />
      <InspirePanel />
    </div>
  );
}

function InspirePanel() {
  const [rows, setRows] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ text: string; tag: string }>({ text: "", tag: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ text: string; tag: string }>({ text: "", tag: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("diary_inspire_prompts")
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false });
    setRows((data as Prompt[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!draft.text.trim()) return;
    const { error } = await supabase.from("diary_inspire_prompts").insert({
      text: draft.text.trim(),
      tag: draft.tag.trim() || null,
    });
    if (error) return toast.error(error.message);
    setDraft({ text: "", tag: "" });
    toast.success("Prompt creado");
    load();
  };

  const toggle = async (r: Prompt) => {
    await supabase.from("diary_inspire_prompts").update({ active: !r.active }).eq("id", r.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar prompt?")) return;
    await supabase.from("diary_inspire_prompts").delete().eq("id", id);
    load();
  };

  const saveEdit = async (id: string) => {
    await supabase
      .from("diary_inspire_prompts")
      .update({ text: editDraft.text, tag: editDraft.tag || null })
      .eq("id", id);
    setEditId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <AdminCard className="p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Nuevo prompt de Inspirarme</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-2">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Pregunta o consigna para escribir"
            value={draft.text}
            onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Categoría (opcional, uso interno)"
            value={draft.tag}
            onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))}
          />
          <AdminButton onClick={add}><Plus size={14} />Crear</AdminButton>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          El usuario ve solo el texto del prompt. La categoría es para tu organización interna.
        </p>
      </AdminCard>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Prompts ({rows.length})</p>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aún no hay prompts.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="p-4 flex items-start gap-3">
                {editId === r.id ? (
                  <div className="flex-1 space-y-2">
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={editDraft.text}
                      onChange={(e) => setEditDraft((d) => ({ ...d, text: e.target.value }))}
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={editDraft.tag}
                      placeholder="Categoría (opcional)"
                      onChange={(e) => setEditDraft((d) => ({ ...d, tag: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <AdminButton onClick={() => saveEdit(r.id)}><Check size={14} />Guardar</AdminButton>
                      <AdminButton variant="ghost" onClick={() => setEditId(null)}><X size={14} />Cancelar</AdminButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">{r.text}</p>
                      {r.tag && <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">{r.tag}</p>}
                    </div>
                    <button
                      onClick={() => toggle(r)}
                      className={`text-[11px] rounded-full px-2.5 py-1 font-semibold ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {r.active ? "Activo" : "Pausado"}
                    </button>
                    <button
                      className="text-slate-500 hover:text-slate-800"
                      onClick={() => { setEditId(r.id); setEditDraft({ text: r.text, tag: r.tag ?? "" }); }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button className="text-rose-500 hover:text-rose-700" onClick={() => remove(r.id)}>
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
