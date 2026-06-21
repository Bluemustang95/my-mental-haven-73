import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useHabits, type Habit } from "@/hooks/useHabits";
import { HabitCard } from "@/components/habitos/HabitCard";
import { NewHabitSheet } from "@/components/habitos/NewHabitSheet";
import { HabitStatsSheet } from "@/components/habitos/HabitStatsSheet";
import { WrappedDialog } from "@/components/habitos/WrappedDialog";

type View = "grid" | "semana" | "cards";

export default function HabitosHome() {
  const navigate = useNavigate();
  const { habits, completions, loading, toggle, create } = useHabits();
  const [view, setView] = useState<View>("grid");
  const [newOpen, setNewOpen] = useState(false);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [view]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f9f9fb_0%,#f2f4f8_100%)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-[#7cc2c8] opacity-[0.22] blur-[100px] animate-[orb-float_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-[#facb60] opacity-[0.20] blur-[100px] animate-[orb-float-2_18s_ease-in-out_infinite]" />
      </div>

      <div ref={scrollRef} className="relative z-10 mx-auto max-w-[480px] px-5 pt-12 pb-40">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-8px_rgba(16,25,39,0.18)] active:scale-95">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#101927]/45">Workspace</p>
              <h1 className="font-serif text-[18px] leading-tight font-bold text-[#101927]">Gestión de<br/>Pensamientos</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWrappedOpen(true)} className="flex flex-col items-center justify-center rounded-2xl bg-white px-3 py-2 shadow-[0_6px_18px_-8px_rgba(16,25,39,0.15)] active:scale-95">
              <span className="text-base leading-none">📊</span>
              <span className="mt-0.5 text-[11px] font-bold text-[#101927]">Wrapped</span>
            </button>
            <button onClick={() => setNewOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#101927] text-white shadow-[0_6px_18px_-8px_rgba(16,25,39,0.35)] active:scale-95">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mt-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#facb60]">Acumular afecto positivo</p>
          <h2 className="mt-2 font-serif text-[32px] leading-tight font-bold text-[#101927]">Tus Hábitos Diarios</h2>
          <p className="mx-auto mt-2 max-w-[320px] text-sm text-[#101927]/60">
            Asociá rutinas sencillas a tus valores fundamentales para sostener tu bienestar.
          </p>
        </div>

        {/* View selector */}
        <div className="mt-6 grid grid-cols-3 rounded-full bg-white/70 p-1.5 shadow-[0_4px_14px_-6px_rgba(16,25,39,0.08)] backdrop-blur-[18px]">
          {(["grid", "semana", "cards"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full py-2.5 text-sm font-bold capitalize transition ${
                view === v ? "bg-[#101927] text-white shadow-[0_6px_16px_-6px_rgba(16,25,39,0.35)]" : "text-[#101927]/55"
              }`}
            >
              {v === "grid" ? "Grid" : v === "semana" ? "Semana" : "Cards"}
            </button>
          ))}
        </div>

        {/* Habits */}
        <div className="mt-6 space-y-4">
          {loading && <p className="text-center text-sm text-[#101927]/50">Cargando…</p>}

          {!loading && habits.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-[#101927]/15 bg-white/60 p-8 text-center">
              <span className="text-4xl">⚡</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-[#101927]">Empezá tu primer hábito</h3>
              <p className="mt-2 text-sm text-[#101927]/60">Tocá el botón <strong>+</strong> de arriba para crear una rutina.</p>
              <button onClick={() => setNewOpen(true)} className="mt-4 rounded-full bg-[#101927] px-6 py-3 text-sm font-bold text-white">
                Crear hábito
              </button>
            </div>
          )}

          {habits.map(h => (
            <HabitCard
              key={h.id}
              habit={h}
              completions={completions}
              view={view}
              onToggle={(d) => toggle(h.id, d)}
              onOpenStats={() => setStatsHabit(h)}
            />
          ))}
        </div>
      </div>

      <NewHabitSheet open={newOpen} onClose={() => setNewOpen(false)} onCreate={create} />
      <HabitStatsSheet habit={statsHabit} completions={completions} onClose={() => setStatsHabit(null)} />
      <WrappedDialog open={wrappedOpen} onClose={() => setWrappedOpen(false)} habits={habits} completions={completions} />
    </div>
  );
}
