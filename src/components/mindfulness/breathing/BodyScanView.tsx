import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause } from "lucide-react";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";

const ZONES = [
  { id: "head", label: "Cabeza", y: 30, speech: "Llevá la atención a tu cabeza. Notá si hay tensión en la frente." },
  { id: "jaw", label: "Mandíbula", y: 55, speech: "Aflojá la mandíbula. Separá los dientes apenas." },
  { id: "neck", label: "Cuello y hombros", y: 90, speech: "Dejá caer los hombros. Soltá el cuello." },
  { id: "chest", label: "Pecho", y: 130, speech: "Sentí el aire entrar y salir del pecho." },
  { id: "abdomen", label: "Abdomen", y: 170, speech: "Notá si hay un nudo en el estómago. No lo cambies, solo observá." },
  { id: "legs", label: "Piernas", y: 220, speech: "Sentí el peso de tus piernas." },
  { id: "feet", label: "Pies", y: 270, speech: "Notá tus pies apoyados. Estás acá, ahora." },
];

interface Props {
  totalSeconds: number;
  voiceEnabled: boolean;
  music: MusicTrack;
  onComplete: () => void;
}

export function BodyScanView({ totalSeconds, voiceEnabled, music, onComplete }: Props) {
  const [zoneIdx, setZoneIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const completedRef = useRef(false);
  const audio = useMindfulAudio();

  const zoneSeconds = Math.max(20, Math.floor(totalSeconds / ZONES.length));

  useEffect(() => {
    audio.playMusic(music);
    return () => audio.stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        const nv = t - 1;
        if (nv <= 0 && !completedRef.current) {
          completedRef.current = true;
          window.setTimeout(onComplete, 200);
        }
        return Math.max(0, nv);
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, onComplete]);

  useEffect(() => {
    if (!running) return;
    const elapsed = totalSeconds - timeLeft;
    const idx = Math.min(ZONES.length - 1, Math.floor(elapsed / zoneSeconds));
    if (idx !== zoneIdx) setZoneIdx(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    if (voiceEnabled && running) audio.speak(ZONES[zoneIdx].speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneIdx]);

  const zone = ZONES[zoneIdx];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex h-full w-full flex-col items-center justify-between px-5 pt-16 pb-10">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">Escáner corporal</div>
        <div className="mt-1 font-display text-2xl font-semibold text-white tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="relative">
        <svg viewBox="0 0 200 320" className="h-[380px] w-auto">
          <defs>
            <linearGradient id="bodyGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
            <linearGradient id="beamGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* Body silhouette */}
          <ellipse cx="100" cy="30" rx="22" ry="26" fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.15)" />
          <path d="M75,60 L125,60 L140,180 L60,180 Z" fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.15)" />
          <path d="M60,180 L80,300 L95,300 L100,200 L105,300 L120,300 L140,180 Z" fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.15)" />

          {/* Scanner beam */}
          <motion.rect
            x="40" width="120" height="40"
            fill="url(#beamGrad)"
            animate={{ y: zone.y - 20 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            opacity="0.35"
          />
          <motion.line
            x1="40" x2="160"
            stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round"
            animate={{ y1: zone.y, y2: zone.y }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="text-center max-w-xs">
        <div className="font-display text-2xl font-semibold text-[#FB923C]">{zone.label}</div>
        <p className="mt-2 font-serif text-sm leading-relaxed text-white/70">{zone.speech}</p>
        <button
          onClick={() => setRunning((r) => !r)}
          className="mt-4 flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-white/10"
        >
          {running ? <Pause size={20} /> : <span className="text-xs">▶</span>}
        </button>
      </div>
    </div>
  );
}
