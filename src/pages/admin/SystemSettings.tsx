import { useState } from "react";
import { Mic, Settings as SettingsIcon, Save, Play, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VOICE_PRESETS, getGlobalVoice, setGlobalVoice } from "@/lib/globalVoice";
import { speak as ttsSpeak } from "@/lib/elevenLabsTTS";
import { AMBIENT_SOUNDS, CATEGORY_LABELS, type AmbientCategory } from "@/lib/ambientLibrary";
import { useAmbientPlayer } from "@/hooks/useAmbientPlayer";

const CATEGORIES: AmbientCategory[] = ["lluvia", "viento", "agua", "naturaleza", "abstractos"];

export default function SystemSettings() {
  const initial = getGlobalVoice();
  const [presetIdx, setPresetIdx] = useState<number>(() => {
    const i = VOICE_PRESETS.findIndex((p) => p.voiceId === initial.voiceId);
    return i >= 0 ? i : -1;
  });
  const [customId, setCustomId] = useState<string>(presetIdx === -1 ? initial.voiceId : "");
  const [customLabel, setCustomLabel] = useState<string>(presetIdx === -1 ? initial.label : "");
  const [testing, setTesting] = useState(false);

  const player = useAmbientPlayer();
  const [previewing, setPreviewing] = useState<string>("off");

  const save = () => {
    if (presetIdx >= 0) {
      setGlobalVoice(VOICE_PRESETS[presetIdx]);
    } else {
      if (!customId.trim()) {
        toast.error("Ingresá un voiceId válido");
        return;
      }
      setGlobalVoice({ label: customLabel.trim() || "Custom", voiceId: customId.trim() });
    }
    toast.success("Voz global guardada");
  };

  const testVoice = async () => {
    const v = presetIdx >= 0 ? VOICE_PRESETS[presetIdx].voiceId : customId.trim();
    if (!v) {
      toast.error("Elegí o ingresá un voiceId");
      return;
    }
    setTesting(true);
    try {
      await ttsSpeak(
        "Hola, soy tu voz guía. Vamos a respirar juntos. Inhalá despacio… y exhalá soltando todo lo que no necesitás.",
        v,
      );
      toast.success("Reproduciendo prueba…");
    } catch {
      toast.error("No se pudo generar el audio");
    } finally {
      setTesting(false);
    }
  };

  const togglePreview = (id: string) => {
    if (previewing === id) {
      player.setSound("off");
      setPreviewing("off");
    } else {
      player.setSound(id);
      setPreviewing(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6B4EFF]/10 text-[#6B4EFF]">
          <SettingsIcon size={18} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Configuración</h1>
          <p className="text-sm text-slate-500">
            Ajustes globales del sistema. Aplican a toda la app.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8A365]/15 text-[#B5701F]">
            <Mic size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-800">
              Voz Global del Sistema (ElevenLabs)
            </h2>
            <p className="text-xs text-slate-500">
              Esta voz se usa en <strong>todos</strong> los ejercicios guiados: respiración (Orbe), body scan,
              5-4-3-2-1 (Observar) y Describir.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Preset</label>
            <select
              value={presetIdx}
              onChange={(e) => setPresetIdx(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              {VOICE_PRESETS.map((p, i) => (
                <option key={p.voiceId} value={i}>
                  {p.label} — {p.voiceId.slice(0, 10)}…
                </option>
              ))}
              <option value={-1}>Custom (voiceId manual)</option>
            </select>
          </div>

          {presetIdx === -1 && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr]">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Etiqueta</label>
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Ej. Nora_Esp"
                  className="h-10"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">voiceId</label>
                <Input
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="JBFqnCBsd6RMkjVDRZzb"
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              className="flex items-center gap-2 rounded-2xl bg-[#6B4EFF] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(107,78,255,0.6)] hover:brightness-110"
            >
              <Save size={14} /> Guardar voz global
            </button>
            <button
              onClick={testVoice}
              disabled={testing}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Play size={14} /> {testing ? "Generando…" : "Probar voz"}
            </button>
          </div>

          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 ring-1 ring-emerald-200">
            La voz por defecto es <strong>Nadia (Argentina)</strong>. Se sintetiza con ElevenLabs y se cachea
            localmente para que no se regenere en cada sesión.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#1D4ED8]">
            <Music size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-800">
              Biblioteca de sonidos ambientales
            </h2>
            <p className="text-xs text-slate-500">
              Estos sonidos están disponibles dentro de los ejercicios. Tocá uno para previsualizarlo.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {AMBIENT_SOUNDS.filter((s) => s.category === cat).map((s) => {
                  const active = previewing === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => togglePreview(s.id)}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "border-[#6B4EFF] bg-[#6B4EFF]/10 text-[#4338CA]"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      <Play size={12} className="shrink-0 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
