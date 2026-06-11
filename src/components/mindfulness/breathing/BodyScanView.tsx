import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { SessionToolbar, nextMusic } from "@/components/mindfulness/breathing/SessionToolbar";
import { OrganicStage } from "@/components/mindfulness/stage/OrganicStage";
import { LottiePlayer } from "@/components/mindfulness/stage/LottiePlayer";
import bodyScanAnimation from "@/assets/lottie/body-scan.json";

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
  initialVoice: boolean;
  initialMusic: MusicTrack;
  onComplete: () => void;
  onAbort: () => void;
}

export function BodyScanView({ totalSeconds, initialVoice, initialMusic, onComplete, onAbort }: Props) {
  const [zoneIdx, setZoneIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const [voice, setVoice] = useState(initialVoice);
  const [music, setMusic] = useState<MusicTrack>(initialMusic);
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
    if (voice && running) audio.speak(ZONES[zoneIdx].speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneIdx]);

  const zone = ZONES[zoneIdx];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative h-full w-full">
      <OrganicStage
        accentColor="#FB923C"
        secondaryColor="#10B981"
        particleColor="#FDFCFB"
        particleCount={12}
      >
        <div className="relative flex h-full w-full flex-col items-center justify-between px-5 pt-12 pb-40">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">Escáner corporal</div>
        <div className="mt-1 font-display text-2xl font-semibold text-white tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="relative h-[320px] w-[180px]">
          <LottiePlayer
            data={bodyScanAnimation}
            loop
            speed={running ? 1 : 0}
            className="h-full w-full"
          />
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-12 rounded-full"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(251,146,60,0.45), transparent)",
              filter: "blur(8px)",
            }}
            animate={{ y: zone.y * (320 / 320) - 24 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </div>
      </div>


      <div className="text-center max-w-xs">
        <div className="font-display text-2xl font-semibold text-[#FB923C]">{zone.label}</div>
        <p className="mt-2 font-serif text-sm leading-relaxed text-white/70">{zone.speech}</p>
        <button
          onClick={() => setRunning((r) => !r)}
          className="mt-4 flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-white/10"
        >
          {running ? <Pause size={20} /> : <Play size={18} fill="currentColor" />}
        </button>
      </div>

      <SessionToolbar
        voice={voice}
        onVoiceToggle={() => setVoice((v) => !v)}
        music={music}
        onMusicCycle={() => setMusic((m) => nextMusic(m))}
        onFinish={onAbort}
      />
        </div>
      </OrganicStage>
    </div>
  );
}
