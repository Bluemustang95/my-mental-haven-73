import { useState } from "react";
import { Volume2, VolumeX, Music, X } from "lucide-react";
import { AmbientSoundSheet } from "@/components/mindfulness/AmbientSoundSheet";
import { getAmbientById } from "@/lib/ambientLibrary";

interface Props {
  voice: boolean;
  onVoiceToggle: () => void;
  music: string;
  onMusicChange: (id: string) => void;
  volume?: number;
  onVolumeChange?: (v: number) => void;
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
  onFinish,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const normalized = LEGACY_MAP[music] ?? music;
  const def = getAmbientById(normalized);
  const isOff = normalized === "off";

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#1E293B]/80 backdrop-blur-xl rounded-t-[32px] p-6">
        <div className="flex items-center justify-around">
          <button
            onClick={onVoiceToggle}
            className="flex flex-col items-center gap-1.5 text-white/85 active:scale-95 transition"
            aria-label="Activar voz"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              {voice ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </div>
            <span className="text-[10px] font-medium tracking-wide text-white/65">
              {voice ? "Voz" : "Sin voz"}
            </span>
          </button>

          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center gap-1.5 text-white/85 active:scale-95 transition"
            aria-label="Cambiar sonido ambiente"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              {isOff ? <VolumeX size={20} /> : <Music size={20} />}
            </div>
            <span className="text-[10px] font-medium tracking-wide text-white/65 max-w-[90px] truncate">
              {def.label}
            </span>
          </button>

          <button
            onClick={onFinish}
            className="flex flex-col items-center gap-1.5 text-rose-300 active:scale-95 transition"
            aria-label="Finalizar sesión"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/15">
              <X size={20} />
            </div>
            <span className="text-[10px] font-medium tracking-wide">Finalizar</span>
          </button>
        </div>
      </div>

      <AmbientSoundSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentId={normalized}
        volume={volume}
        onPick={(id) => onMusicChange(id)}
        onVolume={(v) => onVolumeChange?.(v)}
      />
    </>
  );
}

/** @deprecated Kept for back-compat with old call sites; sheet picker replaces cycling. */
export function nextMusic(current: string): string {
  return current;
}
