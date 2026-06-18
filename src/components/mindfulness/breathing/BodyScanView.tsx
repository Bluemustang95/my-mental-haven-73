import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { SessionToolbar, nextMusic } from "@/components/mindfulness/breathing/SessionToolbar";
import { OrganicStage } from "@/components/mindfulness/stage/OrganicStage";

// Coordenadas (cx, cy) sobre el viewBox 200x360 de la silueta
const ZONES = [
  { id: "head", label: "Cabeza", cx: 100, cy: 55, speech: "Llevá la atención a tu cabeza. Notá si hay tensión en la frente." },
  { id: "jaw", label: "Mandíbula", cx: 100, cy: 90, speech: "Aflojá la mandíbula. Separá los dientes apenas." },
  { id: "neck", label: "Cuello y hombros", cx: 100, cy: 115, speech: "Dejá caer los hombros. Soltá el cuello." },
  { id: "chest", label: "Pecho", cx: 100, cy: 155, speech: "Sentí el aire entrar y salir del pecho." },
  { id: "abdomen", label: "Abdomen", cx: 100, cy: 200, speech: "Notá si hay un nudo en el estómago. No lo cambies, solo observá." },
  { id: "legs", label: "Piernas", cx: 100, cy: 265, speech: "Sentí el peso de tus piernas." },
  { id: "feet", label: "Pies", cx: 100, cy: 330, speech: "Notá tus pies apoyados. Estás acá, ahora." },
];

interface Props {
  totalSeconds: number;
  initialVoice: boolean;
  initialMusic: MusicTrack;
  narrationText?: string;
  onComplete: () => void;
  onAbort: () => void;
}

export function BodyScanView({ totalSeconds, initialVoice, initialMusic, narrationText, onComplete, onAbort }: Props) {
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

  // Narration: prefer the full DB script (spoken once). Fallback to zone cues.
  const narratedRef = useRef(false);
  useEffect(() => {
    if (!voice || !running || narratedRef.current) return;
    if (narrationText && narrationText.trim().length > 0) {
      narratedRef.current = true;
      audio.speak(narrationText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, running, narrationText]);

  useEffect(() => {
    if (!voice || !running) return;
    if (narrationText && narrationText.trim().length > 0) return;
    audio.speak(ZONES[zoneIdx].speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneIdx]);

  useEffect(() => {
    if (running) {
      audio.resumeMusic();
    } else {
      audio.stopSpeech();
      audio.pauseMusic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleFinish = () => {
    audio.stopSpeech();
    audio.stopMusic();
    onAbort();
  };

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
            <svg viewBox="0 0 200 360" className="h-[340px] w-[190px]" aria-hidden="true">
              <defs>
                <radialGradient id="bsDot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity="1" />
                  <stop offset="60%" stopColor="#FB7185" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Silueta */}
              <g fill="#0B1E3F" opacity="0.92">
                {/* cabeza */}
                <ellipse cx="100" cy="42" rx="22" ry="26" />
                {/* cuello */}
                <rect x="92" y="64" width="16" height="14" rx="4" />
                {/* torso */}
                <path d="M62 80 Q100 72 138 80 L142 180 Q100 192 58 180 Z" />
                {/* brazos */}
                <path d="M62 84 Q48 130 54 200 Q60 205 66 200 Q66 140 76 92 Z" />
                <path d="M138 84 Q152 130 146 200 Q140 205 134 200 Q134 140 124 92 Z" />
                {/* caderas */}
                <path d="M62 178 Q100 184 138 178 L136 218 Q100 226 64 218 Z" />
                {/* piernas */}
                <path d="M70 218 Q72 290 80 350 Q88 354 96 350 Q98 290 96 218 Z" />
                <path d="M130 218 Q128 290 120 350 Q112 354 104 350 Q102 290 104 218 Z" />
              </g>

              {/* Puntos: solo el activo es visible con glow */}
              {ZONES.map((z, i) => {
                const active = i === zoneIdx;
                return (
                  <g key={z.id}>
                    <AnimatePresence>
                      {active && (
                        <motion.circle
                          key={`glow-${z.id}`}
                          cx={z.cx}
                          cy={z.cy}
                          r={28}
                          fill="url(#bsDot)"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.9, 1.15, 0.9] }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{
                            opacity: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                            scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                          }}
                        />
                      )}
                    </AnimatePresence>
                    <motion.circle
                      cx={z.cx}
                      cy={z.cy}
                      r={9}
                      fill="#FB7185"
                      animate={{ opacity: active ? 1 : 0.08, scale: active ? 1 : 0.7 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      style={{ transformOrigin: `${z.cx}px ${z.cy}px` }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="text-center max-w-xs">
            <AnimatePresence mode="wait">
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
              >
                <div className="font-display text-2xl font-semibold text-[#FB923C]">{zone.label}</div>
                <p className="mt-2 font-serif text-sm leading-relaxed text-white/70">{zone.speech}</p>
              </motion.div>
            </AnimatePresence>
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
            onMusicChange={setMusic}
            volume={audio.getMusicVolume()}
            onVolumeChange={(v) => audio.setMusicVolume(v)}
            voiceVolume={audio.getVoiceVolume()}
            onVoiceVolumeChange={(v) => audio.setVoiceVolume(v)}
            onFinish={handleFinish}
          />
        </div>
      </OrganicStage>
    </div>
  );
}
