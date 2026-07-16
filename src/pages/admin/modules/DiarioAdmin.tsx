import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminCard, AdminButton, AdminPageHeader, AdminTabs } from "@/components/admin/ui/AdminPrimitives";

type Prompt = { id: string; text: string; tag: string | null; active: boolean; sort_order: number };
type Chip = {
  id: string; kind: "emotion" | "cause"; name: string; icon: string | null;
  image_url: string | null; is_primary: boolean; active: boolean; sort_order: number;
};
type TabKey = "inspire" | "causes" | "tags";

export default function DiarioAdmin() {
  const [tab, setTab] = useState<TabKey>("inspire");
  return (
    <>
      <AdminPageHeader
        title="Diario"
        subtitle="Contenido, prompts, causas y etiquetas del módulo Diario."
      />
      <div className="px-8 pt-2">
        <AdminTabs
          tabs={[
            { id: "inspire", label: "Inspirarme" },
            { id: "causes", label: "Causas" },
            { id: "tags", label: "Etiquetas" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
        />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32 space-y-4">
        {tab === "inspire" && <InspirePanel />}
        {tab === "causes" && <ChipsPanel kind="cause" title="Causas" />}
        {tab === "tags" && <ChipsPanel kind="emotion" title="Etiquetas (Siento…)" />}
      </div>
    </>
  );
}

/* ───────────────────────── Inspirarme ───────────────────────── */

function InspirePanel() {
  const [rows, setRows] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ text: string; tag: string }>({ text: "", tag: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ text: string; tag: string }>({ text: "", tag: "" });
  const [bulk, setBulk] = useState("");
  const [bulkTag, setBulkTag] = useState("");

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

  const addBulk = async () => {
    const lines = bulk.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;
    const payload = lines.map((text) => ({ text, tag: bulkTag.trim() || null }));
    const { error } = await supabase.from("diary_inspire_prompts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(`${lines.length} frases cargadas`);
    setBulk("");
    setBulkTag("");
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
      </AdminCard>

      <AdminCard className="p-4">
        <p className="text-sm font-semibold text-slate-700 mb-1">Cargado masivo</p>
        <p className="text-[11px] text-slate-500 mb-3">
          Pegá una frase por línea. Se crea un prompt activo por cada línea no vacía.
        </p>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[140px] font-mono"
          placeholder={`¿Qué está bajo tu control hoy?\n¿Qué te hizo sonreír esta semana?`}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
        />
        <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Categoría común (opcional)"
            value={bulkTag}
            onChange={(e) => setBulkTag(e.target.value)}
          />
          <AdminButton onClick={addBulk}>
            <Plus size={14} />
            Cargar {bulk.split("\n").filter((l) => l.trim()).length || ""} frases
          </AdminButton>
        </div>
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

/* ───────────────────── Chips (Causas / Etiquetas) ───────────────────── */

function ChipsPanel({ kind, title }: { kind: "emotion" | "cause"; title: string }) {
  const [rows, setRows] = useState<Chip[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ name: string; icon: string; image_url: string; is_primary: boolean }>(
    { name: "", icon: "", image_url: "", is_primary: true }
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; icon: string; image_url: string; is_primary: boolean }>(
    { name: "", icon: "", image_url: "", is_primary: true }
  );

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("diary_chips")
      .select("*")
      .eq("kind", kind)
      .order("is_primary", { ascending: false })
      .order("sort_order");
    setRows((data as Chip[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [kind]);

  const add = async () => {
    if (!draft.name.trim()) return toast.error("El nombre es obligatorio");
    if (!draft.icon.trim() && !draft.image_url.trim()) return toast.error("Agregá un emoji o una imagen");
    const { error } = await supabase.from("diary_chips").insert({
      kind,
      name: draft.name.trim(),
      icon: draft.icon.trim() || null,
      image_url: draft.image_url.trim() || null,
      is_primary: draft.is_primary,
      sort_order: rows.length + 1,
    });
    if (error) return toast.error(error.message);
    setDraft({ name: "", icon: "", image_url: "", is_primary: true });
    toast.success("Creado");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    await supabase.from("diary_chips").delete().eq("id", id);
    load();
  };

  const toggleActive = async (r: Chip) => {
    await supabase.from("diary_chips").update({ active: !r.active }).eq("id", r.id);
    load();
  };

  const togglePrimary = async (r: Chip) => {
    await supabase.from("diary_chips").update({ is_primary: !r.is_primary }).eq("id", r.id);
    load();
  };

  const saveEdit = async (id: string) => {
    await supabase.from("diary_chips").update({
      name: editDraft.name.trim(),
      icon: editDraft.icon.trim() || null,
      image_url: editDraft.image_url.trim() || null,
      is_primary: editDraft.is_primary,
    }).eq("id", id);
    setEditId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <AdminCard className="p-4">
        <p className="text-sm font-semibold text-slate-700 mb-1">Nueva {title.toLowerCase()}</p>
        <p className="text-[11px] text-slate-500 mb-3">
          Cargá un nombre y un emoji (o una URL de imagen). Las "principales" se muestran sin "Ver más".
        </p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_1fr_auto] gap-2 items-center">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Nombre (ej: Trabajo)"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-center"
            placeholder="Emoji"
            value={draft.icon}
            onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="URL de imagen (opcional)"
            value={draft.image_url}
            onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
          />
          <AdminButton onClick={add}><Plus size={14} />Crear</AdminButton>
        </div>
        <label className="mt-2 flex items-center gap-2 text-[12px] text-slate-600">
          <input
            type="checkbox"
            checked={draft.is_primary}
            onChange={(e) => setDraft((d) => ({ ...d, is_primary: e.target.checked }))}
          />
          Mostrar como principal (visible sin abrir "Ver más")
        </label>
      </AdminCard>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">{title} ({rows.length})</p>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aún no hay elementos.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="p-4 flex items-center gap-3">
                {editId === r.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_120px_1fr_auto_auto] gap-2 items-center">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-center"
                      value={editDraft.icon}
                      onChange={(e) => setEditDraft((d) => ({ ...d, icon: e.target.value }))}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="URL de imagen"
                      value={editDraft.image_url}
                      onChange={(e) => setEditDraft((d) => ({ ...d, image_url: e.target.value }))}
                    />
                    <label className="flex items-center gap-1 text-[11px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={editDraft.is_primary}
                        onChange={(e) => setEditDraft((d) => ({ ...d, is_primary: e.target.checked }))}
                      />
                      Principal
                    </label>
                    <div className="flex gap-1">
                      <AdminButton onClick={() => saveEdit(r.id)}><Check size={14} /></AdminButton>
                      <AdminButton variant="ghost" onClick={() => setEditId(null)}><X size={14} /></AdminButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fdf6ec] text-lg overflow-hidden">
                      {r.image_url
                        ? <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                        : <span>{r.icon}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{r.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {r.is_primary ? "Principal" : "Secundaria"} · orden {r.sort_order}
                      </p>
                    </div>
                    <button
                      onClick={() => togglePrimary(r)}
                      className={`text-[10px] rounded-full px-2 py-0.5 font-semibold ${r.is_primary ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {r.is_primary ? "★ Principal" : "☆ Secundaria"}
                    </button>
                    <button
                      onClick={() => toggleActive(r)}
                      className={`text-[10px] rounded-full px-2 py-0.5 font-semibold ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {r.active ? "Activo" : "Pausado"}
                    </button>
                    <button
                      className="text-slate-500 hover:text-slate-800"
                      onClick={() => {
                        setEditId(r.id);
                        setEditDraft({
                          name: r.name, icon: r.icon ?? "", image_url: r.image_url ?? "",
                          is_primary: r.is_primary,
                        });
                      }}
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
