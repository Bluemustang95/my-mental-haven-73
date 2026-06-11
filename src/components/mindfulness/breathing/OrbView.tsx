import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import { BreathingPattern } from "@/lib/breathingPatterns";
import { useHaptics } from "@/hooks/useHaptics";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";

interface OrbViewProps {
  pattern: BreathingPattern;
  totalSeconds: number;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  music: MusicTrack;
  onComplete: () => void;
  onAbort: () => void;
}

export function OrbView({ pattern, totalSeconds, voiceEnabled, hapticsEnabled, music, onComplete }: OrbViewProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const completedRef = useRef(false);

  const haptics = useHaptics(hapticsEnabled);
  const audio = useMindfulAudio();

  const phase = pattern.phases[phaseIdx];
  const phaseProgress = Math.min(1, phaseElapsed / phase.seconds);

  // Music
  useEffect(() => {
    audio.playMusic(music);
    return () => audio.stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music]);

  // Tick
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setPhaseElapsed((e) => e + 0.1);
      setTimeLeft((t) => {
        const nv = +(t - 0.1).toFixed(1);
        if (nv <= 0 && !completedRef.current) {
          completedRef.current = true;
          window.setTimeout(onComplete, 200);
        }
        return Math.max(0, nv);
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [running, onComplete]);

  // Phase transitions
  useEffect(() => {
    if (phaseElapsed < phase.seconds) return;
    const next = (phaseIdx + 1) % pattern.phases.length;
    setPhaseIdx(next);
    setPhaseElapsed(0);
  }, [phaseElapsed, phase.seconds, phaseIdx, pattern.phases.length]);

  // Speech + haptics on phase enter
  useEffect(() => {
    if (!running) return;
    if (voiceEnabled) audio.speak(phase.speech);
    if (phase.haptic === "inhale") haptics.inhale();
    else if (phase.haptic === "exhale") haptics.exhale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx, running, voiceEnabled]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);

  // Progress ring
  const ringR = 130;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - phaseProgress);

  return (
    <div className="flex h-full w-full flex-col items-center justify-between px-5 pt-16 pb-10">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">{pattern.name}</div>
        <div className="mt-1 font-display text-2xl font-semibold text-white tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <button
        onClick={() => { haptics.tap(); setRunning((r) => !r); }}
        className="relative flex items-center justify-center"
        aria-label={running ? "Pausar" : "Reanudar"}
      >
        {/* Glow */}
        <motion.div
          className="absolute h-[300px] w-[300px] rounded-full blur-3xl"
          style={{ background: phase.color }}
          animate={{ scale: phase.scale, opacity: running ? 0.45 : 0.2 }}
          transition={{ duration: phase.seconds, ease: "easeInOut" }}
        />
        {/* Orb */}
        <motion.div
          className="relative h-[220px] w-[220px] rounded-full"
          style={{ background: `radial-gradient(circle at 30% 30%, ${phase.color}, ${phase.color}33 70%, transparent 100%)` }}
          animate={{ scale: phase.scale }}
          transition={{ duration: phase.seconds, ease: "easeInOut" }}
        />
        {/* Progress ring */}
        <svg className="absolute h-[280px] w-[280px] -rotate-90" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r={ringR} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
          <circle
            cx="140" cy="140" r={ringR}
            stroke={phase.color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={ringC}
            strokeDashoffset={ringOffset}
            style={{ transition: "stroke-dashoffset 100ms linear" }}
          />
        </svg>
        {/* Phase label */}
        <div className="absolute font-display text-3xl font-bold text-white drop-shadow-lg">
          {running ? phase.label : <Pause size={32} />}
        </div>
      </button>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur"
        >
          {running ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
        </button>
        <p className="text-xs text-white/50">Tocá el orbe para pausar</p>
      </div>
    </div>
  );
}
