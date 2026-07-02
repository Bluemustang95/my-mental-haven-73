import { useEffect, useMemo, useRef, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui/AdminPrimitives";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Volume2, DollarSign, Plus, Trash2, Play, Music, Pause, Upload, Pencil, Check as CheckIcon, X as XIcon, RotateCcw, Wind } from "lucide-react";
import { COUNTRY_OPTIONS, mindfulnessCountry } from "@/lib/countryCodes";
import { AMBIENT_CATALOG, CATALOG_CATEGORY_LABELS, type CatalogCategory, type CatalogEntry } from "@/lib/ambientCatalog";
import { invalidateAmbientOverrides } from "@/lib/ambientResolver";


const COUNTRIES = COUNTRY_OPTIONS.map((country) => ({ ...country, label: country.code === "default" ? "Predeterminado" : country.label }));

type VoiceRow = { id?: string; country_code: string; gender: "female" | "male"; voice_id: string; label: string | null };
type ElevenVoice = { voice_id: string; name: string; labels?: Record<string, string> };

export default function GeneralAdmin() {
  const [tab, setTab] = useState<"voces" | "audios" | "gasto">("voces");
  return (
    <>
      <AdminPageHeader title="General" subtitle="Configuración global de voces, audios y gasto de IA" />
      <div className="px-8 py-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("voces")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === "voces" ? "bg-resma-teal text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <Volume2 size={14} /> Voces
          </button>
          <button
            onClick={() => setTab("audios")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === "audios" ? "bg-resma-teal text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <Music size={14} /> Audios
          </button>
          <button
            onClick={() => setTab("gasto")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === "gasto" ? "bg-resma-teal text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <DollarSign size={14} /> Gasto de IA
          </button>
        </div>
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 pb-32">
        {tab === "voces" ? <VoicesTab /> : tab === "audios" ? <AudiosTab /> : <SpendTab />}
      </div>
    </>
  );
}

type CachedAudio = {
  id: string;
  script_id: string | null;
  voice_id: string;
  storage_path: string;
  created_at: string;
  script_title: string | null;
  minutes: number | null;
  exercise_id: string | null;
  country_code: string | null;
  orphan?: boolean;
};

// ---------- Ambient overrides (rain, waves, wind, etc.) ----------

type OverrideRow = { id: string; sound_id: string; storage_path: string; active: boolean; updated_at: string };

function AmbientOverridesSection() {
  const [overrides, setOverrides] = useState<Map<string, OverrideRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const previewTimeout = useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ambient_audio_overrides")
      .select("id, sound_id, storage_path, active, updated_at");
    const map = new Map<string, OverrideRow>();
    (data as OverrideRow[] | null ?? []).forEach((r) => map.set(r.sound_id, r));
    setOverrides(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  };

  const stopPreview = () => {
    if (stopRef.current) { try { stopRef.current(); } catch { /* noop */ } stopRef.current = null; }
    if (previewTimeout.current) { clearTimeout(previewTimeout.current); previewTimeout.current = null; }
    setPlayingId(null);
  };

  const preview = async (entry: CatalogEntry) => {
    if (playingId === entry.id) { stopPreview(); return; }
    stopPreview();
    const ctx = ensureCtx();
    const ov = overrides.get(entry.id);
    if (ov) {
      const { data } = await supabase.storage.from("ambient-audio").createSignedUrl(ov.storage_path, 300);
      if (!data?.signedUrl) { toast.error("No se pudo generar URL"); return; }
      const audio = new Audio(data.signedUrl);
      audio.loop = true;
      audio.volume = 0.7;
      audio.play().catch(() => toast.error("No se pudo reproducir"));
      stopRef.current = () => { audio.pause(); audio.src = ""; };
    } else if (entry.synth) {
      const handle = entry.synth.build(ctx, 0.7);
      stopRef.current = handle.stop;
    } else {
      toast.info("Este sonido sólo funciona con MP3 subido.");
      return;
    }
    setPlayingId(entry.id);
    previewTimeout.current = window.setTimeout(stopPreview, 12000);
  };

  const uploadOverride = async (entry: CatalogEntry, file: File) => {
    if (file.size > 12 * 1024 * 1024) { toast.error("Máximo 12 MB"); return; }
    setUploadingId(entry.id);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const path = `ambient/${entry.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("ambient-audio")
        .upload(path, file, { cacheControl: "3600", contentType: file.type || "audio/mpeg", upsert: true });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("ambient_audio_overrides")
        .upsert(
          { sound_id: entry.id, label: entry.label, category: entry.category, storage_path: path, active: true },
          { onConflict: "sound_id" }
        );
      if (dbErr) throw dbErr;
      invalidateAmbientOverrides();
      toast.success(`MP3 subido para "${entry.label}"`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploadingId(null);
    }
  };

  const restoreSynth = async (entry: CatalogEntry) => {
    if (!confirm(`¿Restaurar sonido sintetizado para "${entry.label}"? Se borrará el MP3 subido.`)) return;
    const ov = overrides.get(entry.id);
    if (!ov) return;
    await supabase.storage.from("ambient-audio").remove([ov.storage_path]);
    await supabase.from("ambient_audio_overrides").delete().eq("id", ov.id);
    invalidateAmbientOverrides();
    toast.success("Sonido restaurado");
    await load();
  };

  useEffect(() => () => stopPreview(), []);

  const grouped = useMemo(() => {
    const map = new Map<CatalogCategory, CatalogEntry[]>();
    AMBIENT_CATALOG.forEach((e) => {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category)!.push(e);
    });
    return [...map.entries()];
  }, []);

  return (
    <AdminCard className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white flex items-center gap-2">
        <Wind size={16} className="text-resma-teal" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-resma-navy">Sonidos ambientales</div>
          <div className="text-[11px] text-slate-500">
            Por defecto generados en tiempo real (Web Audio). Subí un MP3 para reemplazar cualquiera con audio real.
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {loading ? "Cargando…" : `${overrides.size}/${AMBIENT_CATALOG.length} personalizados`}
        </div>
      </div>

      {grouped.map(([cat, items]) => (
        <div key={cat}>
          <div className="px-4 py-1.5 bg-slate-50 text-[10px] font-admin-label text-slate-500 uppercase tracking-wider">
            {CATALOG_CATEGORY_LABELS[cat]}
          </div>
          {items.map((entry) => {
            const ov = overrides.get(entry.id);
            const isPlaying = playingId === entry.id;
            const isUploading = uploadingId === entry.id;
            return (
              <div key={entry.id} className="grid grid-cols-[36px_1fr_auto_auto] gap-3 items-center px-4 py-2.5 border-b border-slate-50 last:border-0">
                <button
                  onClick={() => preview(entry)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition ${isPlaying ? "bg-resma-teal text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-resma-navy truncate">{entry.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{entry.id}</div>
                </div>
                <div>
                  {ov ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-resma-teal/10 text-resma-teal text-[10px] font-semibold">
                      <Music size={10} /> MP3 personalizado
                    </span>
                  ) : entry.synth ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                      Sintetizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
                      Necesita MP3
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <label className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-resma-teal text-white text-[11px] font-semibold cursor-pointer hover:opacity-90">
                    {isUploading ? <Loader2 className="animate-spin" size={11} /> : <Upload size={11} />}
                    {ov ? "Reemplazar" : "Subir MP3"}
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadOverride(entry, f); e.currentTarget.value = ""; }}
                    />
                  </label>
                  {ov && (
                    <button
                      onClick={() => restoreSynth(entry)}
                      title="Restaurar sintetizado"
                      className="h-7 w-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </AdminCard>
  );
}

// ---------- Voces de guiones (Mindfulness) ----------

function AudiosTab() {



  const [rows, setRows] = useState<CachedAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: cache }, { data: files }] = await Promise.all([
      supabase
        .from("mindfulness_audio_cache")
        .select("id, script_id, voice_id, storage_path, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.storage.from("mindfulness-audio").list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } }),
    ]);
    const list = (cache as Array<Omit<CachedAudio, "script_title" | "minutes" | "exercise_id" | "country_code">>) ?? [];
    const scriptIds = [...new Set(list.map(r => r.script_id).filter(Boolean) as string[])];
    let scriptMap = new Map<string, { title: string | null; minutes: number | null; exercise_id: string | null; country_code: string | null }>();
    if (scriptIds.length) {
      const { data: scripts } = await supabase
        .from("mindfulness_scripts_v2")
        .select("id, title, minutes, exercise_id, country_code")
        .in("id", scriptIds);
      scriptMap = new Map((scripts ?? []).map((s: { id: string; title: string | null; minutes: number | null; exercise_id: string | null; country_code: string | null }) =>
        [s.id, { title: s.title, minutes: s.minutes, exercise_id: s.exercise_id, country_code: s.country_code }]));
    }
    const cached: CachedAudio[] = list.map(r => {
      const meta = r.script_id ? scriptMap.get(r.script_id) : undefined;
      return { ...r, script_title: meta?.title ?? null, minutes: meta?.minutes ?? null, exercise_id: meta?.exercise_id ?? null, country_code: meta?.country_code ?? null };
    });
    // Add orphan files (in storage but not in cache) so admin sees them all
    const cachedPaths = new Set(cached.map(r => r.storage_path));
    const orphanFolders = (files ?? []).filter(f => f.id === null); // folders
    const orphanFiles: CachedAudio[] = [];
    for (const folder of orphanFolders) {
      const { data: sub } = await supabase.storage.from("mindfulness-audio").list(folder.name, { limit: 500 });
      (sub ?? []).forEach(f => {
        if (f.id === null) return;
        const path = `${folder.name}/${f.name}`;
        if (cachedPaths.has(path)) return;
        orphanFiles.push({
          id: `orphan:${path}`,
          script_id: null,
          voice_id: "—",
          storage_path: path,
          created_at: f.created_at ?? new Date().toISOString(),
          script_title: f.name.replace(/\.[^.]+$/, ""),
          minutes: null,
          exercise_id: null,
          country_code: null,
          orphan: true,
        });
      });
    }
    (files ?? []).forEach(f => {
      if (f.id === null) return;
      if (cachedPaths.has(f.name)) return;
      orphanFiles.push({
        id: `orphan:${f.name}`,
        script_id: null,
        voice_id: "—",
        storage_path: f.name,
        created_at: f.created_at ?? new Date().toISOString(),
        script_title: f.name.replace(/\.[^.]+$/, ""),
        minutes: null,
        exercise_id: null,
        country_code: null,
        orphan: true,
      });
    });
    setRows([...cached, ...orphanFiles]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.script_title ?? "").toLowerCase().includes(q) ||
      (r.exercise_id ?? "").toLowerCase().includes(q) ||
      (r.country_code ?? "").toLowerCase().includes(q) ||
      r.voice_id.toLowerCase().includes(q) ||
      r.storage_path.toLowerCase().includes(q)
    );
  }, [rows, filter]);

  const togglePlay = async (row: CachedAudio) => {
    if (audioEl) { audioEl.pause(); setAudioEl(null); }
    if (playing === row.id) { setPlaying(null); return; }
    const { data: signed } = await supabase.storage.from("mindfulness-audio").createSignedUrl(row.storage_path, 3600);
    if (!signed?.signedUrl) { toast.error("No se pudo generar URL"); return; }
    const a = new Audio(signed.signedUrl);
    a.play().catch(() => toast.error("No se pudo reproducir"));
    a.onended = () => { setPlaying(null); setAudioEl(null); };
    setAudioEl(a);
    setPlaying(row.id);
  };

  const deleteAudio = async (row: CachedAudio) => {
    if (!confirm("¿Eliminar este audio? Se regenerará la próxima vez si tiene guion asociado.")) return;
    await supabase.storage.from("mindfulness-audio").remove([row.storage_path]);
    if (!row.orphan) {
      await supabase.from("mindfulness_audio_cache").delete().eq("id", row.id);
    }
    setRows(prev => prev.filter(r => r.id !== row.id));
    toast.success("Audio eliminado");
  };

  const startEdit = (row: CachedAudio) => {
    setEditingId(row.id);
    setEditTitle(row.script_title ?? "");
  };
  const saveEdit = async (row: CachedAudio) => {
    const title = editTitle.trim();
    if (!title) { toast.error("Título vacío"); return; }
    if (row.script_id) {
      const { error } = await supabase.from("mindfulness_scripts_v2").update({ title }).eq("id", row.script_id);
      if (error) { toast.error(error.message); return; }
    }
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, script_title: title } : r));
    setEditingId(null);
    toast.success("Título actualizado");
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `custom/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("mindfulness-audio").upload(path, file, {
        cacheControl: "3600", contentType: file.type || "audio/mpeg", upsert: false,
      });
      if (upErr) throw upErr;
      toast.success("Audio subido");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-slate-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Cargando audios…</div>;

  return (
    <div className="space-y-6">
      <AmbientOverridesSection />

      <AdminCard className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-resma-navy">Voces de guiones (Mindfulness)</div>
            <div className="text-xs text-slate-500 mt-0.5">
              MP3 pregenerados para Mindfulness + archivos personalizados en el bucket <code className="text-[10px] bg-slate-100 px-1 rounded">mindfulness-audio</code>.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-resma-teal text-white text-xs font-semibold cursor-pointer hover:opacity-90">
              {uploading ? <Loader2 className="animate-spin" size={13} /> : <Upload size={13} />}
              Subir audio
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.currentTarget.value = ""; }}
                disabled={uploading}
              />
            </label>
            <input
              placeholder="Buscar…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 w-52 px-3 rounded-lg border border-slate-200 bg-white text-sm"
            />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Total: {rows.length} audios · Mostrando {filtered.length}
        </div>
      </AdminCard>

      <AdminCard className="p-0 overflow-hidden">
        <div className="grid grid-cols-[36px_1fr_100px_90px_110px_130px_90px] gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50 text-[10px] font-admin-label text-slate-500">
          <div></div>
          <div>Título / Archivo</div>
          <div>Duración</div>
          <div>País</div>
          <div>Voz</div>
          <div>Creado</div>
          <div></div>
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-8">Sin audios.</div>
        )}
        {filtered.map(row => {
          const isPlaying = playing === row.id;
          const isEditing = editingId === row.id;
          return (
            <div key={row.id} className="grid grid-cols-[36px_1fr_100px_90px_110px_130px_90px] gap-2 px-4 py-2.5 border-b border-slate-50 last:border-0 items-center text-xs">
              <button
                onClick={() => togglePlay(row)}
                className={`h-8 w-8 rounded-full flex items-center justify-center ${isPlaying ? "bg-resma-teal text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <div className="min-w-0">
                {isEditing ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(row); if (e.key === "Escape") setEditingId(null); }}
                    className="h-7 w-full px-2 rounded border border-resma-teal bg-white text-xs"
                  />
                ) : (
                  <div className="font-semibold text-resma-navy truncate flex items-center gap-1.5">
                    {row.script_title ?? "(sin título)"}
                    {row.orphan && <span className="text-[9px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">huérfano</span>}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 truncate">{row.exercise_id ?? "—"} · {row.storage_path}</div>
              </div>
              <div className="text-slate-600">{row.minutes ? `${row.minutes} min` : "—"}</div>
              <div className="text-slate-600">{row.country_code ?? "default"}</div>
              <div className="font-mono text-[10px] text-slate-500 truncate">{row.voice_id}</div>
              <div className="text-slate-500">{new Date(row.created_at).toLocaleDateString("es-AR")}</div>
              <div className="flex items-center gap-1 justify-end">
                {isEditing ? (
                  <>
                    <button onClick={() => saveEdit(row)} className="text-emerald-600 hover:text-emerald-700 p-1"><CheckIcon size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1"><XIcon size={14} /></button>
                  </>
                ) : (
                  <>
                    {!row.orphan && (
                      <button onClick={() => startEdit(row)} className="text-slate-500 hover:text-resma-teal p-1">
                        <Pencil size={13} />
                      </button>
                    )}
                    <button onClick={() => deleteAudio(row)} className="text-rose-500 hover:text-rose-700 p-1">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </AdminCard>
    </div>
  );
}


function VoicesTab() {
  const [rows, setRows] = useState<VoiceRow[]>([]);
  const [voices, setVoices] = useState<ElevenVoice[]>([]);
  const [customVoices, setCustomVoices] = useState<ElevenVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newVoice, setNewVoice] = useState({ voice_id: "", label: "", gender: "female" as "female" | "male", accent: "" });

  const loadAll = async () => {
    const [{ data }, { data: v }, { data: custom }] = await Promise.all([
      supabase.from("voice_settings").select("*"),
      supabase.functions.invoke("list-elevenlabs-voices"),
      supabase.from("voice_library_custom").select("*").order("created_at", { ascending: false }),
    ]);
    setRows((data as VoiceRow[]) ?? []);
    const voicesData = (v as { voices?: ElevenVoice[] } | null)?.voices ?? [];
    setVoices(voicesData);
    const custRows = (custom as Array<{ voice_id: string; label: string; accent: string | null }>) ?? [];
    setCustomVoices(custRows.map(c => ({ voice_id: c.voice_id, name: c.label, labels: c.accent ? { accent: c.accent } : {} })));
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const allVoices = useMemo(() => {
    const map = new Map<string, ElevenVoice>();
    for (const v of voices) map.set(v.voice_id, v);
    for (const v of customVoices) if (!map.has(v.voice_id)) map.set(v.voice_id, v);
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [voices, customVoices]);

  const getRow = (country: string, gender: "female" | "male"): VoiceRow => {
    const canonical = mindfulnessCountry(country);
    return rows.find(r => mindfulnessCountry(r.country_code) === canonical && r.gender === gender)
      ?? { country_code: canonical, gender, voice_id: "", label: null };
  };

  const setRow = (row: VoiceRow) => {
    setRows(prev => {
      const normalized = { ...row, country_code: mindfulnessCountry(row.country_code) };
      const idx = prev.findIndex(r => mindfulnessCountry(r.country_code) === normalized.country_code && r.gender === normalized.gender);
      if (idx >= 0) { const next = [...prev]; next[idx] = normalized; return next; }
      return [...prev, normalized];
    });
  };

  const save = async () => {
    setSaving(true);
    const deduped = new Map<string, VoiceRow>();
    rows.filter(r => r.voice_id).forEach((r) => {
      const normalized = { ...r, country_code: mindfulnessCountry(r.country_code) };
      deduped.set(`${normalized.country_code}:${normalized.gender}`, normalized);
    });
    const payload = [...deduped.values()].map(r => ({
      country_code: r.country_code, gender: r.gender, voice_id: r.voice_id, label: r.label,
    }));
    const { error } = await supabase.from("voice_settings").upsert(payload, { onConflict: "country_code,gender" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Voces guardadas");
  };

  const refreshCatalog = async () => {
    setReloading(true);
    const { data: v } = await supabase.functions.invoke("list-elevenlabs-voices");
    const voicesData = (v as { voices?: ElevenVoice[] } | null)?.voices ?? [];
    setVoices(voicesData);
    setReloading(false);
    toast.success(`${voicesData.length} voces cargadas desde ElevenLabs`);
  };

  const addCustomVoice = async () => {
    const vid = newVoice.voice_id.trim();
    const label = newVoice.label.trim();
    if (!vid || !label) { toast.error("Voice ID y nombre son obligatorios"); return; }
    const { error } = await supabase.from("voice_library_custom").insert({
      voice_id: vid, label, gender: newVoice.gender, accent: newVoice.accent.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Voz agregada");
    setNewVoice({ voice_id: "", label: "", gender: "female", accent: "" });
    setAddOpen(false);
    loadAll();
  };

  const removeCustomVoice = async (vid: string) => {
    if (!confirm("¿Eliminar esta voz custom?")) return;
    const { error } = await supabase.from("voice_library_custom").delete().eq("voice_id", vid);
    if (error) { toast.error(error.message); return; }
    toast.success("Voz eliminada");
    loadAll();
  };

  if (loading) return <div className="text-slate-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Cargando…</div>;

  return (
    <div className="space-y-4">
      <AdminCard className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-slate-600 leading-relaxed">
            Las voces provienen de tu cuenta de ElevenLabs. Para <b>agregar más voces</b>, entrá a{" "}
            <a href="https://elevenlabs.io/app/voice-library" target="_blank" rel="noreferrer" className="text-resma-teal underline">
              ElevenLabs Voice Library
            </a>{" "}
            y guardalas en tu cuenta — después tocá "Recargar catálogo". También podés agregar una voz manual pegando su <code className="text-[10px] bg-slate-100 px-1 rounded">voice_id</code>.
          </div>
          <div className="flex gap-2 shrink-0">
            <AdminButton variant="secondary" onClick={refreshCatalog}>
              {reloading ? <Loader2 className="animate-spin" size={14} /> : null} Recargar catálogo
            </AdminButton>
            <AdminButton variant="purple" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Agregar voz manual
            </AdminButton>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-slate-500">
          Catálogo actual: {voices.length} voces de ElevenLabs · {customVoices.length} voces manuales
        </div>
      </AdminCard>

      {addOpen && (
        <AdminCard className="p-4 border-2 border-resma-purple/40">
          <div className="font-semibold text-sm text-resma-navy mb-3">Nueva voz manual</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="voice_id (ej: EXAVITQu4vr4xnSDxMaL)"
              value={newVoice.voice_id}
              onChange={(e) => setNewVoice({ ...newVoice, voice_id: e.target.value })}
              className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm"
            />
            <input
              placeholder="Nombre visible (ej: Nadia AR)"
              value={newVoice.label}
              onChange={(e) => setNewVoice({ ...newVoice, label: e.target.value })}
              className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm"
            />
            <select
              value={newVoice.gender}
              onChange={(e) => setNewVoice({ ...newVoice, gender: e.target.value as "female" | "male" })}
              className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm"
            >
              <option value="female">Femenina</option>
              <option value="male">Masculina</option>
            </select>
            <input
              placeholder="Acento / región (opcional)"
              value={newVoice.accent}
              onChange={(e) => setNewVoice({ ...newVoice, accent: e.target.value })}
              className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <AdminButton variant="secondary" onClick={() => setAddOpen(false)}>Cancelar</AdminButton>
            <AdminButton variant="purple" onClick={addCustomVoice}>Guardar voz</AdminButton>
          </div>
        </AdminCard>
      )}

      {customVoices.length > 0 && (
        <AdminCard className="p-4">
          <div className="font-semibold text-sm text-resma-navy mb-2">Voces manuales</div>
          <div className="space-y-1">
            {customVoices.map(v => (
              <div key={v.voice_id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-resma-navy">{v.name}</span>
                  <span className="text-slate-400 font-mono ml-2 text-[10px]">{v.voice_id}</span>
                  {v.labels?.accent && <span className="ml-2 text-slate-500">· {v.labels.accent}</span>}
                </div>
                <button onClick={() => removeCustomVoice(v.voice_id)} className="text-rose-500 hover:text-rose-700">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      <AdminCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-resma-navy">Voces por país</h2>
            <p className="text-xs text-slate-500 mt-0.5">Elegí la voz femenina y masculina que se usará según el país del usuario. La persona podrá elegir en Ajustes cuál prefiere.</p>
          </div>
          <AdminButton variant="purple" onClick={save}>
            {saving ? <Loader2 className="animate-spin" size={14} /> : null} Guardar cambios
          </AdminButton>
        </div>

        <div className="grid grid-cols-[180px_1fr_1fr] gap-3 pb-2 border-b border-slate-100 mb-2">
          <div className="text-[10px] font-admin-label text-slate-500">País</div>
          <div className="text-[10px] font-admin-label text-slate-500">Voz femenina</div>
          <div className="text-[10px] font-admin-label text-slate-500">Voz masculina</div>
        </div>

        {COUNTRIES.map(c => {
          const f = getRow(c.code, "female");
          const m = getRow(c.code, "male");
          return (
            <div key={c.code} className="grid grid-cols-[180px_1fr_1fr] gap-3 py-2.5 border-b border-slate-50 items-center">
              <div>
                <div className="text-sm font-semibold text-resma-navy">{c.label}</div>
                {c.iso !== "DEFAULT" && <div className="text-[10px] text-slate-400 font-mono">Usuarios {c.iso} usan esta voz</div>}
              </div>
              <VoiceSelect voices={allVoices} row={f} onChange={setRow} />
              <VoiceSelect voices={allVoices} row={m} onChange={setRow} />
            </div>
          );
        })}
      </AdminCard>
    </div>
  );
}

function VoiceSelect({ voices, row, onChange }: { voices: ElevenVoice[]; row: VoiceRow; onChange: (r: VoiceRow) => void }) {
  const current = voices.find(v => v.voice_id === row.voice_id);
  return (
    <div className="flex items-center gap-2">
      <select
        value={row.voice_id}
        onChange={(e) => {
          const v = voices.find(x => x.voice_id === e.target.value);
          onChange({ ...row, voice_id: e.target.value, label: v?.name ?? null });
        }}
        className="flex-1 h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm text-resma-navy"
      >
        <option value="">— Sin configurar —</option>
        {voices.map(v => (
          <option key={v.voice_id} value={v.voice_id}>{v.name}{v.labels?.accent ? ` · ${v.labels.accent}` : ""}</option>
        ))}
      </select>
      {current && (
        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{current.labels?.accent ?? ""}</span>
      )}
    </div>
  );
}

function SpendTab() {
  const [rows, setRows] = useState<{ feature: string; total: number; count: number; chars: number }[]>([]);
  const [byUser, setByUser] = useState<{ user_id: string | null; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"30d" | "7d" | "month">("30d");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date();
      if (range === "7d") since.setDate(since.getDate() - 7);
      else if (range === "30d") since.setDate(since.getDate() - 30);
      else since.setDate(1);

      const { data } = await supabase
        .from("ai_usage_log")
        .select("feature, cost_usd, chars, user_id")
        .gte("created_at", since.toISOString());
      const list = (data as { feature: string; cost_usd: number; chars: number; user_id: string | null }[]) ?? [];

      const byFeat = new Map<string, { total: number; count: number; chars: number }>();
      const byU = new Map<string | null, number>();
      for (const r of list) {
        const f = byFeat.get(r.feature) ?? { total: 0, count: 0, chars: 0 };
        f.total += Number(r.cost_usd ?? 0);
        f.count += 1;
        f.chars += Number(r.chars ?? 0);
        byFeat.set(r.feature, f);
        byU.set(r.user_id, (byU.get(r.user_id) ?? 0) + Number(r.cost_usd ?? 0));
      }
      setRows([...byFeat.entries()].map(([feature, v]) => ({ feature, ...v })).sort((a, b) => b.total - a.total));
      setByUser([...byU.entries()].map(([user_id, total]) => ({ user_id, total })).sort((a, b) => b.total - a.total).slice(0, 10));
      setLoading(false);
    })();
  }, [range]);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["7d", "30d", "month"] as const).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              range === r ? "bg-resma-teal text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {r === "7d" ? "Últimos 7 días" : r === "30d" ? "Últimos 30 días" : "Mes en curso"}
          </button>
        ))}
      </div>

      <AdminCard className="p-6">
        <div className="text-[10px] font-admin-label text-slate-500 mb-1">Gasto total</div>
        <div className="text-3xl font-bold text-resma-navy">${grandTotal.toFixed(2)} USD</div>
        <div className="text-xs text-slate-500 mt-1">
          {loading ? "Cargando…" : `${rows.reduce((s, r) => s + r.count, 0)} llamadas · ${rows.reduce((s, r) => s + r.chars, 0).toLocaleString()} caracteres`}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="text-sm font-semibold text-resma-navy mb-3">Por feature</h3>
        {rows.length === 0 && <div className="text-xs text-slate-400">Sin llamadas registradas en este período.</div>}
        <div className="space-y-2">
          {rows.map(r => {
            const pct = grandTotal > 0 ? (r.total / grandTotal) * 100 : 0;
            return (
              <div key={r.feature}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-resma-navy">{r.feature}</span>
                  <span className="text-slate-500">${r.total.toFixed(3)} · {r.count} llamadas</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-resma-teal" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="text-sm font-semibold text-resma-navy mb-3">Top usuarios (por costo)</h3>
        {byUser.length === 0 && <div className="text-xs text-slate-400">Sin datos.</div>}
        <div className="space-y-1.5">
          {byUser.map((u, i) => (
            <div key={u.user_id ?? "anon"} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-600 font-mono truncate max-w-[60%]">#{i + 1} · {u.user_id ?? "anónimo"}</span>
              <span className="font-semibold text-resma-navy">${u.total.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
