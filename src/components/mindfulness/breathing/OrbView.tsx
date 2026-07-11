import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import { BreathingPattern } from "@/lib/breathingPatterns";
import { useHaptics } from "@/hooks/useHaptics";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { useMindfulScript } from "@/hooks/useMindfulScript";
import { SessionToolbar, nextMusic } from "@/components/mindfulness/breathing/SessionToolbar";
import { VisualizerBox } from "@/components/mindfulness/breathing/visuals/VisualizerBox";
import { VisualizerSleep } from "@/components/mindfulness/breathing/visuals/VisualizerSleep";
import { VisualizerCoherence } from "@/components/mindfulness/breathing/visuals/VisualizerCoherence";
import { VisualizerSigh } from "@/components/mindfulness/breathing/visuals/VisualizerSigh";
import { OrganicStage } from "@/components/mindfulness/stage/OrganicStage";

interface OrbViewProps {
  pattern: BreathingPattern;
  totalSeconds: number;
  initialVoice: boolean;
  initialMusic: MusicTrack;
  hapticsEnabled: boolean;
  narrationText?: string;
  onComplete: () => void;
  onAbort: () => void;
}

export function OrbView({
  pattern,
  totalSeconds,
  initialVoice,
  initialMusic,
  hapticsEnabled,
  narrationText,
  onComplete,
  onAbort,
}: OrbViewProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [voice, setVoice] = useState(initialVoice);
  const [music, setMusic] = useState<MusicTrack>(initialMusic);
  const completedRef = useRef(false);

  const haptics = useHaptics(hapticsEnabled);
  const audio = useMindfulAudio();

  const phase = pattern.phases[phaseIdx];
  const phaseProgress = Math.min(1, phaseElapsed / phase.seconds);

  useEffect(() => {
    audio.playMusic(music);
    return () => audio.stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music]);

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

  useEffect(() => {
    if (phaseElapsed < phase.seconds) return;
    const next = (phaseIdx + 1) % pattern.phases.length;
    setPhaseIdx(next);
    setPhaseElapsed(0);
  }, [phaseElapsed, phase.seconds, phaseIdx, pattern.phases.length]);

  // Pause/resume music + cut speech when paused
  useEffect(() => {
    if (running) {
      audio.resumeMusic();
    } else {
      audio.stopSpeech();
      audio.pauseMusic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Haptics on each phase change
  useEffect(() => {
    if (!running) return;
    if (phase.haptic === "inhale") haptics.inhale();
    else if (phase.haptic === "exhale") haptics.exhale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx, running]);

  // Narración por guion (intro + loop). Un solo camino de voz.
  const scriptId = pattern.id === "478" || pattern.id === "sigh" || pattern.id === "box" || pattern.id === "coherence"
    ? pattern.id
    : "478";
  const script = useMindfulScript(scriptId, { voiceEnabled: voice && running });
  const startedRef = useRef(false);
  useEffect(() => {
    if (!running || !voice) return;
    if (startedRef.current) return;
    startedRef.current = true;
    script.start();
    return () => script.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, voice]);
  useEffect(() => {
    if (!voice) script.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice]);

  const handleFinish = () => {
    audio.stopSpeech();
    audio.stopMusic();
    onAbort();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);

  const ringR = 130;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - phaseProgress);

  // Breath driver 0..1 for organic atmosphere (inhale/hold expanded, exhale contracted)
  const breath =
    phase.phaseId === "inhale" || phase.phaseId === "inhale2"
      ? phaseProgress
      : phase.phaseId === "hold"
        ? 1
        : phase.phaseId === "exhale"
          ? 1 - phaseProgress
          : 0;

  return (
    <div className="relative h-full w-full">
      <OrganicStage
        breath={breath}
        breathDuration={Math.max(1.5, phase.seconds)}
        accentColor={phase.color}
        secondaryColor="#FCD34D"
        particleColor="#FDFCFB"
        particleCount={14}
      >
        <div className="relative flex h-full w-full flex-col items-center justify-between px-5 pt-12 pb-40">
      <div className="w-full text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">
          {pattern.name}
        </div>
        <div className="mt-1 font-display text-xl font-semibold text-white tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <button
        onClick={() => {
          haptics.tap();
          setRunning((r) => !r);
        }}
        className="relative flex items-center justify-center"
        aria-label={running ? "Pausar" : "Reanudar"}
      >
        <motion.div
          className="absolute h-[300px] w-[300px] rounded-full blur-3xl"
          style={{ background: phase.color }}
          animate={{ scale: phase.scale, opacity: running ? 0.35 : 0.15 }}
          transition={{ duration: phase.seconds, ease: "easeInOut" }}
        />
        {pattern.id === "box" && (
          <VisualizerBox phaseId={phase.phaseId} duration={phase.seconds} isActive={running} />
        )}
        {pattern.id === "478" && (
          <VisualizerSleep phaseId={phase.phaseId} duration={phase.seconds} isActive={running} />
        )}
        {pattern.id === "coherence" && (
          <VisualizerCoherence phaseId={phase.phaseId} duration={phase.seconds} isActive={running} />
        )}
        {pattern.id === "sigh" && (
          <VisualizerSigh phaseId={phase.phaseId} duration={phase.seconds} isActive={running} />
        )}
        {pattern.id !== "coherence" && pattern.id !== "478" && (
          <svg className="absolute h-[280px] w-[280px] -rotate-90" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r={ringR} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
            <circle
              cx="140"
              cy="140"
              r={ringR}
              stroke={phase.color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={ringOffset}
              style={{ transition: "stroke-dashoffset 100ms linear" }}
            />
          </svg>
        )}
        <div className="absolute font-display text-3xl font-bold text-white drop-shadow-lg">
          {running ? phase.label : <Pause size={32} />}
        </div>
      </button>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur"
        >
          {running ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
        </button>
        <p className="text-[11px] text-white/45">Tocá el orbe para pausar</p>
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
