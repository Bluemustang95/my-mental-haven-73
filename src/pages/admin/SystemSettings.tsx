import { useState } from "react";
import { Mic, Settings as SettingsIcon, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VOICE_PRESETS, getGlobalVoice, setGlobalVoice } from "@/lib/globalVoice";

export default function SystemSettings() {
  const initial = getGlobalVoice();
  const [presetIdx, setPresetIdx] = useState<number>(() => {
    const i = VOICE_PRESETS.findIndex((p) => p.voiceId === initial.voiceId);
    return i >= 0 ? i : -1;
  });
  const [customId, setCustomId] = useState<string>(presetIdx === -1 ? initial.voiceId : "");
  const [customLabel, setCustomLabel] = useState<string>(presetIdx === -1 ? initial.label : "");

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
              Esta voz se usará por defecto en todos los recursos guiados (respiración, body scan, 5-4-3-2-1).
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

          <button
            onClick={save}
            className="flex items-center gap-2 rounded-2xl bg-[#6B4EFF] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(107,78,255,0.6)] hover:brightness-110"
          >
            <Save size={14} /> Guardar voz global
          </button>

          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
            Nota: La síntesis actual usa el motor del navegador. El <code>voiceId</code> se propaga
            a los reproductores y se usará automáticamente cuando se integre el endpoint de ElevenLabs.
          </p>
        </div>
      </section>
    </div>
  );
}
