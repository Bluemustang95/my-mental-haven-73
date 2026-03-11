import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type BreathingPreset = {
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdAfter?: number;
  description: string;
};

const presets: BreathingPreset[] = [
  { name: "4-7-8", inhale: 4, hold: 7, exhale: 8, description: "Relajación profunda" },
  { name: "Box Breathing", inhale: 4, hold: 4, exhale: 4, holdAfter: 4, description: "Calma y enfoque" },
  { name: "Coherencia", inhale: 5, hold: 0, exhale: 5, description: "Equilibrio cardíaco" },
];

type Phase = "inhale" | "hold" | "exhale" | "holdAfter" | "idle";

const phaseLabels: Record<Phase, string> = {
  inhale: "Inhalá",
  hold: "Sostené",
  exhale: "Exhalá",
  holdAfter: "Sostené",
  idle: "Preparado",
};

export default function Breathing() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  const preset = presets[selectedPreset];

  const totalCycleTime = preset.inhale + preset.hold + preset.exhale + (preset.holdAfter || 0);

  const getPhaseAndProgress = useCallback((time: number) => {
    const cycleTime = time % totalCycleTime;
    if (cycleTime < preset.inhale) return { phase: "inhale" as Phase, progress: cycleTime / preset.inhale };
    if (cycleTime < preset.inhale + preset.hold) return { phase: "hold" as Phase, progress: (cycleTime - preset.inhale) / preset.hold };
    if (cycleTime < preset.inhale + preset.hold + preset.exhale) return { phase: "exhale" as Phase, progress: (cycleTime - preset.inhale - preset.hold) / preset.exhale };
    return { phase: "holdAfter" as Phase, progress: (cycleTime - preset.inhale - preset.hold - preset.exhale) / (preset.holdAfter || 1) };
  }, [preset, totalCycleTime]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.05;
        const { phase: newPhase } = getPhaseAndProgress(next);
        setPhase(newPhase);
        const prevCycle = Math.floor(prev / totalCycleTime);
        const nextCycle = Math.floor(next / totalCycleTime);
        if (nextCycle > prevCycle) setCycleCount((c) => c + 1);
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isRunning, getPhaseAndProgress, totalCycleTime]);

  const reset = () => {
    setIsRunning(false);
    setPhase("idle");
    setElapsed(0);
    setCycleCount(0);
  };

  const { progress } = isRunning ? getPhaseAndProgress(elapsed) : { progress: 0 };
  const scale = phase === "inhale" ? 0.6 + progress * 0.4 : phase === "exhale" ? 1 - progress * 0.4 : phase === "idle" ? 0.6 : 1;

  return (
    <div className="flex min-h-screen flex-col items-center px-5 pt-14 pb-4 safe-area-top">
      <h1 className="mb-2 font-display text-xl font-semibold">Respiración guiada</h1>
      <p className="mb-8 text-sm text-muted-foreground">Elegí un patrón y dejá que tu cuerpo se regule.</p>

      {/* Preset selection */}
      <div className="mb-10 flex gap-2">
        {presets.map((p, i) => (
          <button
            key={p.name}
            onClick={() => { setSelectedPreset(i); reset(); }}
            className={cn(
              "rounded-full border px-4 py-2 font-display text-xs font-medium transition-all",
              i === selectedPreset ? "border-accent bg-accent/10" : "border-border bg-card text-muted-foreground"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Breathing circle */}
      <div className="relative mb-4 flex h-56 w-56 items-center justify-center">
        <motion.div
          animate={{ scale }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border-2 border-accent/30 bg-accent/10"
        />
        <motion.div
          animate={{ scale: scale * 0.7 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute inset-8 rounded-full bg-accent/20"
        />
        <p className="relative z-10 font-display text-sm font-medium">
          {phaseLabels[phase]}
        </p>
      </div>

      <p className="mb-8 text-xs text-muted-foreground">
        {preset.description} · {cycleCount} {cycleCount === 1 ? "ciclo" : "ciclos"}
      </p>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
        >
          {isRunning ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" />}
        </button>
        {elapsed > 0 && (
          <button
            onClick={reset}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-transform active:scale-95"
          >
            <ArrowCounterClockwise size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
