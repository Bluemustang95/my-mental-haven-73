import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X, ExternalLink, Star, StarOff, Rss } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminCard, AdminButton, AdminPageHeader, AdminTabs } from "@/components/admin/ui/AdminPrimitives";

type Quote = { id: string; text: string; author: string | null; active: boolean; sort_order: number };
type News = {
  id: string; title: string; summary: string | null; url: string | null; image_url: string | null;
  active: boolean; published_at: string;
  source: string | null; author: string | null; tags: string[] | null; featured: boolean; sort_order: number;
  auto_generated?: boolean;
};
type ResearchConfig = {
  id: number; enabled: boolean; queries: string[]; language: string; country: string;
  max_per_run: number; auto_publish: boolean;
  last_run_at: string | null; last_run_summary: Record<string, unknown> | null;
};

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
          { id: "quotes", label: "Frases del día" },
          { id: "news", label: "Noticias de psicología" },
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
  const [draft, setDraft] = useState({ title: "", summary: "", url: "", image_url: "", source: "", tags: "" });

  const [cfg, setCfg] = useState<ResearchConfig | null>(null);
  const [running, setRunning] = useState(false);
  const [queriesText, setQueriesText] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("psychology_news").select("*").order("featured", { ascending: false }).order("published_at", { ascending: false });
    setRows(((data as unknown) as News[]) ?? []);
    setLoading(false);
  };

  const loadCfg = async () => {
    const { data } = await supabase.from("research_feed_config" as never).select("*").eq("id", 1).maybeSingle();
    const c = (data as unknown) as ResearchConfig | null;
    setCfg(c);
    if (c) setQueriesText((c.queries ?? []).join("\n"));
  };

  useEffect(() => { load(); loadCfg(); }, []);

  const add = async () => {
    if (!draft.title.trim()) return;
    const tags = draft.tags.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("psychology_news").insert({
      title: draft.title.trim(),
      summary: draft.summary.trim() || null,
      url: draft.url.trim() || null,
      image_url: draft.image_url.trim() || null,
      source: draft.source.trim() || null,
      tags,
    } as never);
    if (error) return toast.error(error.message);
    setDraft({ title: "", summary: "", url: "", image_url: "", source: "", tags: "" });
    toast.success("Noticia publicada");
    load();
  };

  const toggle = async (r: News) => {
    await supabase.from("psychology_news").update({ active: !r.active }).eq("id", r.id);
    load();
  };
  const toggleFeatured = async (r: News) => {
    await supabase.from("psychology_news").update({ featured: !r.featured } as never).eq("id", r.id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar noticia?")) return;
    await supabase.from("psychology_news").delete().eq("id", id);
    load();
  };

  const saveCfg = async (patch: Partial<ResearchConfig>) => {
    if (!cfg) return;
    const next = { ...cfg, ...patch };
    setCfg(next);
    await supabase.from("research_feed_config" as never).update(patch as never).eq("id", 1);
  };

  const saveQueries = async () => {
    const arr = queriesText.split("\n").map(s => s.trim()).filter(Boolean);
    await saveCfg({ queries: arr });
    toast.success("Búsquedas guardadas");
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("resma-research-fetch", { body: {} });
      if (error) throw error;
      const summary = (data as { inserted?: number; skipped?: number; error?: string }) ?? {};
      if (summary.error) toast.error(summary.error);
      else toast.success(`Insertadas ${summary.inserted ?? 0} · Saltadas ${summary.skipped ?? 0}`);
      await load();
      await loadCfg();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo ejecutar");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Automated fetch config */}
      <AdminCard className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Rss size={16} className="text-resma-teal" />
          <p className="text-sm font-semibold text-slate-700">Resma Research · Feed automático</p>
        </div>
        {!cfg ? (
          <p className="text-xs text-slate-500">Cargando configuración…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cfg.enabled} onChange={(e)=>saveCfg({ enabled: e.target.checked })}/>
                Activar feed automático
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cfg.auto_publish} onChange={(e)=>saveCfg({ auto_publish: e.target.checked })}/>
                Publicar automáticamente (sin revisión)
              </label>
              <label className="flex items-center gap-2 text-sm">
                Idioma
                <input value={cfg.language} onChange={(e)=>saveCfg({ language: e.target.value })} className="w-14 rounded border border-slate-200 px-2 py-1 text-sm"/>
              </label>
              <label className="flex items-center gap-2 text-sm">
                País
                <input value={cfg.country} onChange={(e)=>saveCfg({ country: e.target.value })} className="w-14 rounded border border-slate-200 px-2 py-1 text-sm"/>
              </label>
              <label className="flex items-center gap-2 text-sm">
                Máx por ejecución
                <input type="number" min={1} max={30} value={cfg.max_per_run} onChange={(e)=>saveCfg({ max_per_run: Number(e.target.value)||6 })} className="w-16 rounded border border-slate-200 px-2 py-1 text-sm"/>
              </label>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">Búsquedas (una por línea)</p>
              <textarea
                rows={4}
                value={queriesText}
                onChange={(e)=>setQueriesText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="salud mental investigación&#10;mindfulness research&#10;DBT terapia"
              />
              <div className="mt-2 flex gap-2">
                <AdminButton variant="secondary" onClick={saveQueries}>Guardar búsquedas</AdminButton>
                <AdminButton onClick={runNow} disabled={running || !cfg.enabled}>
                  {running ? "Buscando…" : "Ejecutar ahora"}
                </AdminButton>
              </div>
              {cfg.last_run_at && (
                <p className="mt-2 text-xs text-slate-500">
                  Última ejecución: {new Date(cfg.last_run_at).toLocaleString("es-AR")}
                  {cfg.last_run_summary && ` · ${JSON.stringify(cfg.last_run_summary)}`}
                </p>
              )}
              {!cfg.enabled && (
                <p className="mt-2 text-xs text-amber-600">
                  El feed automático está apagado. Activalo y ejecutalo para probar. Requiere el conector Firecrawl vinculado al proyecto.
                </p>
              )}
            </div>
          </>
        )}
      </AdminCard>

      {/* Manual add */}
      <AdminCard className="p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-700">Nueva noticia manual</p>
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Título"
               value={draft.title} onChange={(e)=>setDraft(d=>({...d,title:e.target.value}))}/>
        <textarea rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Resumen breve"
                  value={draft.summary} onChange={(e)=>setDraft(d=>({...d,summary:e.target.value}))}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="URL de la nota"
                 value={draft.url} onChange={(e)=>setDraft(d=>({...d,url:e.target.value}))}/>
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Imagen (URL)"
                 value={draft.image_url} onChange={(e)=>setDraft(d=>({...d,image_url:e.target.value}))}/>
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Fuente (ej. APA, Nature)"
                 value={draft.source} onChange={(e)=>setDraft(d=>({...d,source:e.target.value}))}/>
          <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Tags separados por coma"
                 value={draft.tags} onChange={(e)=>setDraft(d=>({...d,tags:e.target.value}))}/>
        </div>
        <div><AdminButton onClick={add}><Plus size={14}/>Publicar</AdminButton></div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                    {r.auto_generated && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">auto</span>}
                    {r.featured && <Star size={12} className="text-amber-500"/>}
                  </div>
                  {r.source && <p className="text-[11px] text-slate-400">{r.source}</p>}
                  {r.summary && <p className="text-xs text-slate-500 mt-1">{r.summary}</p>}
                  {(r.tags ?? []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(r.tags ?? []).map(t => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">#{t}</span>)}
                    </div>
                  )}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-resma-teal">
                      Abrir <ExternalLink size={11}/>
                    </a>
                  )}
                </div>
                <button onClick={()=>toggleFeatured(r)} title="Destacar" className="text-slate-400 hover:text-amber-500">
                  {r.featured ? <Star size={16} className="fill-amber-500 text-amber-500"/> : <StarOff size={16}/>}
                </button>
                <button onClick={()=>toggle(r)} className={`text-[11px] rounded-full px-2.5 py-1 font-semibold ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {r.active ? "Activa" : "Pausada"}
                </button>
                <button className="text-rose-500 hover:text-rose-700" onClick={()=>remove(r.id)}>
                  <Trash2 size={15}/>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}

