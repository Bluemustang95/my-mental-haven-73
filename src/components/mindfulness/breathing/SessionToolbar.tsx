import { useEffect, useState } from "react";
import { Mic, MicOff, Music, Volume2, X } from "lucide-react";
import { AmbientSoundSheet } from "@/components/mindfulness/AmbientSoundSheet";
import { getAmbientById } from "@/lib/ambientLibrary";

interface Props {
  voice: boolean;
  onVoiceToggle: () => void;
  music: string;
  onMusicChange: (id: string) => void;
  volume?: number;
  onVolumeChange?: (v: number) => void;
  voiceVolume?: number;
  onVoiceVolumeChange?: (v: number) => void;
  onFinish: () => void;
}

const LEGACY_MAP: Record<string, string> = {
  silence: "off",
  rain: "rain_soft",
  ambient: "drone_pad",
};

export function SessionToolbar({
  voice,
  onVoiceToggle,
  music,
  onMusicChange,
  volume = 0.8,
  onVolumeChange,
  voiceVolume = 1,
  onVoiceVolumeChange,
  onFinish,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localVoice, setLocalVoice] = useState(voiceVolume);
  const [localAmb, setLocalAmb] = useState(volume);

  useEffect(() => setLocalVoice(voiceVolume), [voiceVolume]);
  useEffect(() => setLocalAmb(volume), [volume]);

  const normalized = LEGACY_MAP[music] ?? music;
  const def = getAmbientById(normalized);
  const isOff = normalized === "off";

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#1E293B]/85 backdrop-blur-xl rounded-t-[28px] px-5 pt-4 pb-5">
        {/* Sliders inline */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onVoiceToggle}
              aria-label={voice ? "Silenciar voz" : "Activar voz"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 active:scale-95 transition"
            >
              {voice ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={localVoice}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLocalVoice(v);
                onVoiceVolumeChange?.(v);
              }}
              className="flex-1 accent-white"
              aria-label="Volumen de la voz"
            />
            <span className="w-9 text-right text-[11px] tabular-nums text-white/55">
              {Math.round(localVoice * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSheetOpen(true)}
              aria-label="Cambiar sonido ambiente"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 active:scale-95 transition"
            >
              <Music size={16} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={localAmb}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLocalAmb(v);
                onVolumeChange?.(v);
              }}
              className="flex-1 accent-white"
              aria-label="Volumen del sonido ambiente"
              disabled={isOff}
            />
            <span className="w-9 text-right text-[11px] tabular-nums text-white/55">
              {isOff ? "—" : `${Math.round(localAmb * 100)}%`}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-left text-white/85 active:scale-[0.98] transition"
          >
            <Volume2 size={14} className="shrink-0 text-white/70" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">Sonido</span>
            <span className="ml-1 truncate text-[13px] font-medium">{def.label}</span>
          </button>

          <button
            onClick={onFinish}
            className="flex items-center gap-2 rounded-full bg-rose-500/15 px-4 py-2.5 text-rose-200 active:scale-[0.98] transition"
            aria-label="Finalizar sesión"
          >
            <X size={16} />
            <span className="text-[12px] font-semibold">Finalizar</span>
          </button>
        </div>
      </div>

      <AmbientSoundSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentId={normalized}
        onPick={(id) => onMusicChange(id)}
      />
    </>
  );
}

/** @deprecated Kept for back-compat with old call sites. */
export function nextMusic(current: string): string {
  return current;
}
