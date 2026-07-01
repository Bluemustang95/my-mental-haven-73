import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminCard, AdminButton, AdminPageHeader, AdminTabs } from "@/components/admin/ui/AdminPrimitives";

type Quote = { id: string; text: string; author: string | null; active: boolean; sort_order: number };
type News = { id: string; title: string; summary: string | null; url: string | null; image_url: string | null; active: boolean; published_at: string };

export default function ContenidoDiarioAdmin() {
  const [tab, setTab] = useState<"quotes" | "news">("quotes");

  return (
    <div className="p-6 space-y-4">
      <AdminPageHeader
        title="Contenido Diario"
        subtitle="Frases y noticias que aparecen en el Home de los usuarios."
      />
      <AdminTabs
        tabs={[
          { key: "quotes", label: "Frases del día" },
          { key: "news", label: "Noticias de psicología" },
        ]}
        value={tab}
        onChange={(v) => setTab(v as "quotes" | "news")}
      />
      {tab === "quotes" ? <QuotesPanel /> : <NewsPanel />}
    </div>
  );
}

function QuotesPanel() {
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ text: string; author: string }>({ text: "", author: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ text: string; author: string }>({ text: "", author: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("daily_quotes").select("*").order("sort_order").order("created_at", { ascending: false });
    setRows((data as Quote[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!draft.text.trim()) return;
    const { error } = await supabase.from("daily_quotes").insert({ text: draft.text.trim(), author: draft.author.trim() || null });
    if (error) return toast.error(error.message);
    setDraft({ text: "", author: "" });
    toast.success("Frase creada");
    load();
  };

  const toggle = async (r: Quote) => {
    await supabase.from("daily_quotes").update({ active: !r.active }).eq("id", r.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar frase?")) return;
    await supabase.from("daily_quotes").delete().eq("id", id);
    load();
  };

  const saveEdit = async (id: string) => {
    await supabase.from("daily_quotes").update({ text: editDraft.text, author: editDraft.author || null }).eq("id", id);
    setEditId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <AdminCard className="p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Nueva frase</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-2">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Texto de la frase"
            value={draft.text}
            onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Autor/a (opcional)"
            value={draft.author}
            onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
          />
          <AdminButton onClick={add}><Plus size={14} />Crear</AdminButton>
        </div>
      </AdminCard>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Frases ({rows.length})</p>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Todavía no hay frases.</p>
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
                      value={editDraft.author}
                      onChange={(e) => setEditDraft((d) => ({ ...d, author: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <AdminButton onClick={() => saveEdit(r.id)}><Check size={14} />Guardar</AdminButton>
                      <AdminButton variant="ghost" onClick={() => setEditId(null)}><X size={14} />Cancelar</AdminButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">"{r.text}"</p>
                      {r.author && <p className="text-xs text-slate-500 mt-1">— {r.author}</p>}
                    </div>
                    <button
                      onClick={() => toggle(r)}
                      className={`text-[11px] rounded-full px-2.5 py-1 font-semibold ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {r.active ? "Activa" : "Pausada"}
                    </button>
                    <button className="text-slate-500 hover:text-slate-800" onClick={() => { setEditId(r.id); setEditDraft({ text: r.text, author: r.author ?? "" }); }}>
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

function NewsPanel() {
  const [rows, setRows] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ title: "", summary: "", url: "", image_url: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("psychology_news").select("*").order("published_at", { ascending: false });
    setRows((data as News[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!draft.title.trim()) return;
    const { error } = await supabase.from("psychology_news").insert({
      title: draft.title.trim(),
      summary: draft.summary.trim() || null,
      url: draft.url.trim() || null,
      image_url: draft.image_url.trim() || null,
    });
    if (error) return toast.error(error.message);
    setDraft({ title: "", summary: "", url: "", image_url: "" });
    toast.success("Noticia creada");
    load();
  };

  const toggle = async (r: News) => {
    await supabase.from("psychology_news").update({ active: !r.active }).eq("id", r.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar noticia?")) return;
    await supabase.from("psychology_news").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <AdminCard className="p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-700">Nueva noticia</p>
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Título"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
        <textarea
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Resumen breve (opcional)"
          value={draft.summary}
          onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="URL de la nota (opcional)"
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Imagen (URL, opcional)"
            value={draft.image_url}
            onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
          />
        </div>
        <div><AdminButton onClick={add}><Plus size={14} />Publicar</AdminButton></div>
      </AdminCard>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Noticias ({rows.length})</p>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Todavía no hay noticias.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="p-4 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                  {r.summary && <p className="text-xs text-slate-500 mt-1">{r.summary}</p>}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-resma-teal">
                      Abrir <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => toggle(r)}
                  className={`text-[11px] rounded-full px-2.5 py-1 font-semibold ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {r.active ? "Activa" : "Pausada"}
                </button>
                <button className="text-rose-500 hover:text-rose-700" onClick={() => remove(r.id)}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
