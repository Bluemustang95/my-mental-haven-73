import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const durations = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
];

export default function Mindfulness() {
  const navigate = useNavigate();
  const [selectedDuration, setSelectedDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durations[0].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRunning(false);
            setCompleted(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(durations[selectedDuration].seconds);
    setCompleted(false);
  };

  const selectDuration = (i: number) => {
    setSelectedDuration(i);
    setTimeLeft(durations[i].seconds);
    setIsRunning(false);
    setCompleted(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / durations[selectedDuration].seconds;

  return (
    <div className="flex min-h-screen flex-col items-center px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex w-full items-center gap-3">
        <button onClick={() => navigate("/herramientas")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Mindfulness</h1>
      </div>

      {/* Duration picker */}
      <div className="mb-10 flex gap-2">
        {durations.map((d, i) => (
          <button
            key={d.label}
            onClick={() => selectDuration(i)}
            className={cn(
              "rounded-full border px-4 py-2 font-display text-xs font-medium transition-all",
              i === selectedDuration ? "border-accent bg-accent/10" : "border-border bg-card text-muted-foreground"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="relative mb-4 flex h-56 w-56 items-center justify-center">
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          <motion.circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={Math.PI * 90}
            strokeDashoffset={Math.PI * 90 * (1 - progress)}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="text-center">
          <p className="font-display text-3xl font-light tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          {completed && <p className="mt-1 font-display text-xs text-success">Completado</p>}
        </div>
      </div>

      <p className="mb-8 text-center text-xs text-muted-foreground max-w-[240px]">
        {isRunning ? "Cerrá los ojos. Enfocate en tu respiración." : completed ? "Buen trabajo. ¿Cómo te sentís?" : "Encontrá un lugar cómodo y presioná play."}
      </p>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          disabled={completed}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95",
            completed ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
          )}
        >
          {isRunning ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" />}
        </button>
        {(timeLeft < durations[selectedDuration].seconds) && (
          <button
            onClick={reset}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <ArrowCounterClockwise size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
