import { Volume2, VolumeX, CloudRain, Sparkles, X } from "lucide-react";
import type { MusicTrack } from "@/hooks/useMindfulAudio";

const MUSIC_CYCLE: MusicTrack[] = ["silence", "rain", "ambient"];
const MUSIC_META: Record<MusicTrack, { label: string; Icon: typeof VolumeX }> = {
  silence: { label: "Silencio", Icon: VolumeX },
  rain: { label: "Lluvia", Icon: CloudRain },
  ambient: { label: "Ambient", Icon: Sparkles },
};

interface Props {
  voice: boolean;
  onVoiceToggle: () => void;
  music: MusicTrack;
  onMusicCycle: () => void;
  onFinish: () => void;
}

export function SessionToolbar({ voice, onVoiceToggle, music, onMusicCycle, onFinish }: Props) {
  const m = MUSIC_META[music];
  const MusicIcon = m.Icon;
  return (
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
          onClick={onMusicCycle}
          className="flex flex-col items-center gap-1.5 text-white/85 active:scale-95 transition"
          aria-label="Cambiar sonido ambiente"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <MusicIcon size={20} />
          </div>
          <span className="text-[10px] font-medium tracking-wide text-white/65">{m.label}</span>
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
  );
}

export function nextMusic(current: MusicTrack): MusicTrack {
  const i = MUSIC_CYCLE.indexOf(current);
  return MUSIC_CYCLE[(i + 1) % MUSIC_CYCLE.length];
}
