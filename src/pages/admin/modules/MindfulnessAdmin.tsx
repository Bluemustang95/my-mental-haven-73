import { useEffect, useMemo, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui/AdminPrimitives";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Folder, FileAudio, Volume2, Plus, Trash2, CheckCircle2, Loader2, PlayCircle, Globe } from "lucide-react";

type Script = {
  id: string;
  exercise_id: string;
  minutes: number;
  version: number;
  country_code: string;
  title: string;
  script_text: string;
  active: boolean;
};

const EXERCISES = [
  { id: "478", name: "4-7-8 (Sueño)" },
  { id: "sigh", name: "Suspiro fisiológico" },
  { id: "box", name: "Respiración cuadrada" },
  { id: "coh", name: "Coherencia cardíaca" },
];
const MINUTES_OPTIONS = [5, 10, 15, 20] as const;
const COUNTRIES = [
  { code: "default", label: "Default" },
  { code: "Argentina", label: "Argentina" },
  { code: "Uruguay", label: "Uruguay" },
  { code: "Chile", label: "Chile" },
  { code: "México", label: "México" },
  { code: "Colombia", label: "Colombia" },
  { code: "Perú", label: "Perú" },
  { code: "España", label: "España" },
  { code: "Estados Unidos", label: "EE.UU." },
];

type AudioRow = { script_id: string; voice_id: string; storage_path: string };
type VoiceRow = { country_code: string; gender: "female" | "male"; voice_id: string };

export default function MindfulnessAdmin() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [audio, setAudio] = useState<AudioRow[]>([]);
  const [voiceRows, setVoiceRows] = useState<VoiceRow[]>([]);
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [minutes, setMinutes] = useState<number>(5);
  const [country, setCountry] = useState<string>("default");
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [batching, setBatching] = useState(false);

  const reload = async () => {
    const { data } = await supabase
      .from("mindfulness_scripts_v2")
      .select("*")
      .order("exercise_id")
      .order("minutes")
      .order("version");
    setScripts((data as Script[]) ?? []);
    const { data: aud } = await supabase.from("mindfulness_audio_cache").select("script_id, voice_id, storage_path");
    setAudio((aud as AudioRow[]) ?? []);
    const { data: vs } = await supabase.from("voice_settings").select("country_code, gender, voice_id");
    setVoiceRows((vs as VoiceRow[]) ?? []);
  };
  useEffect(() => { reload(); }, []);

  const versionsForBucket = scripts.filter(
    s => s.exercise_id === exerciseId && s.minutes === minutes && (s.country_code ?? "default") === country
  );
  const current = versionsForBucket.find(s => s.id === activeVersionId) ?? versionsForBucket[0];

  useEffect(() => {
    setActiveVersionId(versionsForBucket[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, minutes, country, scripts.length]);

  const voiceForCountry = (c: string, gender: "female" | "male" = "female") =>
    voiceRows.find(v => v.country_code === c && v.gender === gender)?.voice_id
    ?? voiceRows.find(v => v.country_code === "default" && v.gender === gender)?.voice_id
    ?? "";

  const addVersion = async () => {
    const nextVersion = Math.max(0, ...versionsForBucket.map(v => v.version)) + 1;
    const { data, error } = await supabase
      .from("mindfulness_scripts_v2")
      .insert({
        exercise_id: exerciseId,
        minutes,
        version: nextVersion,
        country_code: country,
        title: `Versión ${nextVersion}`,
        script_text: "",
        active: true,
      })
      .select("*")
      .single();
    if (error) { toast.error(error.message); return; }
    setScripts([...scripts, data as Script]);
    setActiveVersionId((data as Script).id);
  };

  const updateCurrent = (patch: Partial<Script>) => {
    if (!current) return;
    setScripts(scripts.map(s => s.id === current.id ? { ...s, ...patch } : s));
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    const { error } = await supabase.from("mindfulness_scripts_v2").update({
      title: current.title,
      script_text: current.script_text,
      active: current.active,
    }).eq("id", current.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Guion guardado");
  };

  const remove = async () => {
    if (!current) return;
    if (!confirm("¿Eliminar esta versión?")) return;
    const { error } = await supabase.from("mindfulness_scripts_v2").delete().eq("id", current.id);
    if (error) { toast.error(error.message); return; }
    setScripts(scripts.filter(s => s.id !== current.id));
    setActiveVersionId(null);
  };

  const persistCurrent = async () => {
    if (!current) return null;
    const text = current.script_text.trim();
    if (!text) { toast.error("Redactá el guion primero"); return null; }
    const { error } = await supabase.from("mindfulness_scripts_v2").update({
      title: current.title, script_text: current.script_text, active: current.active,
    }).eq("id", current.id);
    if (error) { toast.error(error.message); return null; }
    return current;
  };

  const generateAudio = async () => {
    const s = await persistCurrent();
    if (!s) return;
    const voiceId = voiceForCountry(country, "female");
    if (!voiceId) { toast.error(`Configurá primero la voz para "${country}" en General → Voces`); return; }
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("mindfulness-precache", {
      body: { scriptId: s.id, voiceId, countryCode: country, force: false },
    });
    setGenerating(false);
    if (error) { toast.error(error.message); return; }
    if ((data as { error?: string })?.error) { toast.error(String((data as { error?: string }).error)); return; }
    toast.success((data as { cached?: boolean })?.cached ? "Audio ya estaba en cache" : "Audio generado");
    reload();
  };

  const generateAllCountries = async () => {
    const s = await persistCurrent();
    if (!s) return;
    setBatching(true);
    let ok = 0, fail = 0;
    for (const c of COUNTRIES) {
      const voiceId = voiceForCountry(c.code, "female");
      if (!voiceId) { fail++; continue; }
      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await supabase.functions.invoke("mindfulness-precache", {
        body: { scriptId: s.id, voiceId, countryCode: c.code, force: false },
      });
      if (error || (data as { error?: string })?.error) fail++; else ok++;
    }
    setBatching(false);
    toast.success(`Batch listo: ${ok} ok · ${fail} sin voz/error`);
    reload();
  };

  const hasAudioForCountry = (scriptId: string, countryCode: string) => {
    const vid = voiceForCountry(countryCode, "female");
    if (!vid) return false;
    return audio.some(a => a.script_id === scriptId && a.voice_id === vid);
  };
  const hasAudio = (scriptId: string) => hasAudioForCountry(scriptId, country);

  return (
    <>
      <AdminPageHeader title="Mindfulness & Respiración" subtitle="Guiones por duración y versión · Audio pregenerado con ElevenLabs" />
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        {/* Ejercicio */}
        <AdminCard className="p-4 mb-4">
          <div className="font-admin-label text-[10px] text-slate-500 mb-2">Ejercicio</div>
          <div className="flex flex-wrap gap-2">
            {EXERCISES.map(e => (
              <button
                key={e.id}
                onClick={() => setExerciseId(e.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  exerciseId === e.id ? "bg-resma-teal text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>
        </AdminCard>

        {/* Duración */}
        <AdminCard className="p-4 mb-4">
          <div className="font-admin-label text-[10px] text-slate-500 mb-2">Duración</div>
          <div className="flex gap-2">
            {MINUTES_OPTIONS.map(m => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  minutes === m ? "bg-resma-purple text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
        </AdminCard>

        <div className="grid grid-cols-[280px_1fr] gap-5">
          {/* Versiones */}
          <AdminCard className="p-3 h-fit">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="font-admin-label text-[10px] text-slate-500">Versiones ({versionsForBucket.length})</div>
              <button onClick={addVersion} className="text-resma-teal hover:text-resma-teal/70">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-0.5">
              {versionsForBucket.length === 0 && (
                <div className="text-xs text-slate-400 px-2 py-6 text-center">
                  Sin versiones aún.<br/>Creá la primera con "+"
                </div>
              )}
              {versionsForBucket.map((s) => {
                const active = s.id === (current?.id ?? "");
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveVersionId(s.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                      active ? "bg-resma-teal/10 text-resma-teal font-semibold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Folder size={14} />
                    <span className="flex-1 truncate">v{s.version} · {s.title || "Sin título"}</span>
                    {hasAudio(s.id) && <CheckCircle2 size={12} className="text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </AdminCard>

          {/* Editor */}
          <AdminCard className="p-6">
            {!current ? (
              <div className="text-sm text-slate-500 text-center py-12">
                Seleccioná una versión o creá una nueva.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <FileAudio size={18} className="text-resma-purple" />
                    <input
                      value={current.title}
                      onChange={(e) => updateCurrent({ title: e.target.value })}
                      placeholder="Título de la versión"
                      className="flex-1 h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-resma-navy"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-500 ml-3">
                    <input type="checkbox" checked={current.active} onChange={(e) => updateCurrent({ active: e.target.checked })} />
                    Activo
                  </label>
                </div>

                <textarea
                  value={current.script_text}
                  onChange={(e) => updateCurrent({ script_text: e.target.value })}
                  rows={18}
                  placeholder={`Redactá el guion para ${minutes} minutos. La duración debe alinearse con la lectura hablada del texto.`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-resma-navy font-serifElegant focus:outline-none focus:border-resma-teal focus:bg-white admin-scroll resize-none"
                />

                <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{current.script_text.length} caracteres · costo estimado ${(current.script_text.length / 1000 * 0.30).toFixed(3)} USD</span>
                  {hasAudio(current.id)
                    ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> audio cacheado</span>
                    : <span className="text-amber-600">audio no generado</span>}
                </div>

                <div className="flex justify-between gap-2 mt-4">
                  <AdminButton variant="secondary" onClick={remove}>
                    <Trash2 size={14} /> Eliminar
                  </AdminButton>
                  <div className="flex gap-2">
                    <AdminButton variant="secondary" onClick={generateAudio}>
                      {generating ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />} Generar audio
                    </AdminButton>
                    <AdminButton variant="purple" onClick={save}>
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />} Guardar guion
                    </AdminButton>
                  </div>
                </div>
              </>
            )}
          </AdminCard>
        </div>
      </div>
    </>
  );
}
