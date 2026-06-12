import { useState } from "react";
import { ArrowLeft, Check, Lock, CalendarDays, FastForward, RotateCcw } from "lucide-react";
import { AmbientGlows } from "@/components/pack/AmbientGlows";
import { GlassCard } from "@/components/pack/GlassCard";
import { BAContent, BAProgram } from "@/lib/baTypes";
import { BACalendarModal } from "./BACalendarModal";
import { BAProgressChart } from "./BAProgressChart";
import { BADayLogSheet } from "./BADayLogSheet";
import { localDateStr } from "@/lib/utils";
import { useAdminRole } from "@/hooks/useAdminRole";


export function BAJourney({
  content,
  program,
  onBack,
  onOpenDay,
  onUpdate,
  onReset,
}: {
  content: BAContent;
  program: BAProgram;
  onBack: () => void;
  onOpenDay: (day: number) => void;
  onUpdate: (patch: Partial<BAProgram>) => void;
  onReset: () => Promise<void>;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewDay, setViewDay] = useState<number | null>(null);
  const { isAdmin } = useAdminRole();

  const today = localDateStr();
  const canShowCalendar = program.current_day > 1 || program.day_one_step > 3;

  const simulateNextDay = () => {
    if (program.current_day < 7) {
      onUpdate({ current_day: program.current_day + 1, last_completed_date: today });
    }
  };

  const handleReset = async () => {
    if (!window.confirm("¿Reiniciar el programa? Se borrarán los registros de Activación Comportamental.")) return;
    await onReset();
  };


  return (
    <div className="relative min-h-screen bg-[#fdfbfb] text-[#101927] safe-area-top">
      <AmbientGlows />

      <header className="sticky top-0 z-10 border-b border-[#101927]/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-4">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/10 bg-white shadow-sm"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="font-display text-sm font-semibold">Tu camino · 7 días</p>
          {isAdmin ? (
            <button
              onClick={handleReset}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/50 bg-white text-rose-600 shadow-sm"
              aria-label="Reiniciar programa (admin)"
              title="Reiniciar programa (admin)"
            >
              <RotateCcw size={16} />
            </button>
          ) : (
            <div className="w-9" />
          )}

        </div>
      </header>

      <main className="relative mx-auto max-w-md px-5 pt-8 pb-32">
        <h2 className="font-mindful text-3xl">{content.program_meta?.title}</h2>
        <p className="mt-1 text-sm text-[#101927]/65">
          Cada día activás un escalón de tu escalera. Avanzá a tu ritmo.
        </p>

        {program.state === "completed" && (
          <>
            <GlassCard className="mt-5 border-[#7cc2c8]/40 p-5 text-center">
              <p className="font-mindful text-xl">¡Programa completado!</p>
              <p className="mt-2 text-sm text-[#101927]/65">
                Recorriste los 7 escalones. Volvé al pack para seguir creciendo.
              </p>
            </GlassCard>
            <BAProgressChart programId={program.id} />
          </>
        )}

        <div className="relative mt-8">
          <div className="absolute bottom-6 left-7 top-6 w-px bg-[#101927]/10" />
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => {
              const dayNum = i + 1;
              const isDone = dayNum < program.current_day;
              const isCurrent = dayNum === program.current_day;
              const isLocked = dayNum > program.current_day;
              const step = program.ladder?.[dayNum - 2];

              return (
                <div key={dayNum} className="relative flex items-center gap-4">
                  <button
                    disabled={isLocked}
                    onClick={() => {
                      if (dayNum === 1 && program.state === "day1") onOpenDay(1);
                      else if (isCurrent && dayNum >= 2) onOpenDay(dayNum);
                      else if (isDone) setViewDay(dayNum);
                    }}
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold shadow-md transition ${
                      isCurrent
                        ? "scale-110 bg-[#facb60] text-[#101927] ring-4 ring-[#facb60]/30"
                        : isDone
                        ? "bg-[#7cc2c8] text-white hover:scale-105"
                        : "bg-white text-[#101927]/40 ring-1 ring-[#101927]/10"
                    }`}
                  >
                    {isDone ? <Check size={20} /> : isLocked ? <Lock size={16} /> : dayNum}
                  </button>

                  <button
                    type="button"
                    disabled={isLocked || (!isDone && !isCurrent)}
                    onClick={() => {
                      if (isDone) setViewDay(dayNum);
                      else if (isCurrent && dayNum === 1 && program.state === "day1") onOpenDay(1);
                      else if (isCurrent && dayNum >= 2) onOpenDay(dayNum);
                    }}
                    className={`flex-1 text-left ${isLocked ? "opacity-40" : ""}`}
                  >
                    <GlassCard className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display text-xs font-bold uppercase tracking-wider text-[#101927]/55">
                          Día {dayNum}
                        </p>
                        {isDone && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#7cc2c8]">
                            Ver registro
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-display text-sm font-bold text-[#101927]">
                        {dayNum === 1
                          ? "Planificación"
                          : step?.text || `Paso ${dayNum - 1} de la escalera`}
                      </p>
                    </GlassCard>
                  </button>

                </div>
              );
            })}
          </div>
        </div>

        {import.meta.env.DEV && program.current_day < 7 && (
          <button
            onClick={simulateNextDay}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[#101927]/20 py-2 text-[11px] font-bold uppercase tracking-widest text-[#101927]/45"
          >
            <FastForward size={12} /> DEV · simular 24h
          </button>
        )}
      </main>

      {canShowCalendar && (
        <button
          onClick={() => setCalendarOpen(true)}
          className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#101927] text-white shadow-[0_15px_35px_rgba(16,25,39,0.35)] active:scale-95"
          aria-label="Calendario"
        >
          <CalendarDays size={22} />
        </button>
      )}

      <BACalendarModal
        programId={program.id}
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  );
}
