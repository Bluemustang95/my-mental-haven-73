import { useMemo, useState } from "react";
import { ArrowLeft, Moon, Activity, Check, Info, ChevronDown, ChevronUp } from "lucide-react";
import { AmbientGlows } from "@/components/pack/AmbientGlows";
import { GlassCard } from "@/components/pack/GlassCard";
import { StepDots } from "@/components/pack/StepDots";
import { BAContent, BALadderStep, BAProgram } from "@/lib/baTypes";
import { BACalendarModal } from "./BACalendarModal";

export function BADayOne({
  content,
  program,
  onUpdate,
  onFinish,
  onBack,
}: {
  content: BAContent;
  program: BAProgram;
  onUpdate: (patch: Partial<BAProgram>) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const step = program.day_one_step ?? 0;

  const setStep = (s: number) => onUpdate({ day_one_step: s });

  const total = 5;

  return (
    <div className="relative min-h-screen bg-[#fdfbfb] text-[#101927] safe-area-top">
      <AmbientGlows />

      <header className="sticky top-0 z-20 border-b border-[#101927]/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-3">
          <button
            onClick={() => (step === 0 ? onBack() : setStep(step - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/10 bg-white shadow-sm"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="font-display text-sm font-semibold">Día 1: Planificación</p>
          <div className="w-9" />
        </div>
        <div className="px-5 pb-3">
          <StepDots total={total} current={step} />
        </div>
      </header>

      <main className="relative mx-auto max-w-md px-5 pb-32 pt-6">
        {step === 0 && <CyclePsicoStep content={content} />}
        {step === 1 && (
          <ValuesStep
            content={content}
            selected={program.selected_values}
            onChange={(v) => onUpdate({ selected_values: v })}
          />
        )}
        {step === 2 && (
          <MotivationStep
            motivation={program.motivation}
            goals={program.goals}
            onChange={(motivation, goals) => onUpdate({ motivation, goals })}
          />
        )}
        {step === 3 && program.id && (
          <BaselineCalendarStep programId={program.id} />
        )}
        {step === 4 && (
          <LadderStep
            content={content}
            program={program}
            onChange={(ladder, selected_goal_idx) =>
              onUpdate({ ladder, selected_goal_idx })
            }
          />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#101927]/5 bg-white/85 p-4 backdrop-blur-xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md">
          <button
            onClick={() => {
              if (step < total - 1) setStep(step + 1);
              else onFinish();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#101927] py-4 font-display text-sm font-bold text-white transition active:scale-[0.98]"
          >
            {step < total - 1 ? "Siguiente Paso" : "Comenzar mi Tratamiento"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Step 0: Psicoeducación interactiva ----------
function CyclePsicoStep({ content }: { content: BAContent }) {
  const [open, setOpen] = useState<"less" | "more" | null>(null);
  const c = content.cycle_text;

  return (
    <div>
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-[#facb60]/30">
          <span className="text-3xl">🧠</span>
        </div>
      </div>
      <h2 className="mt-5 text-center font-mindful text-2xl">{c.title}</h2>
      <p className="mt-2 text-center text-sm text-[#101927]/65">{c.subtitle}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => setOpen(open === "less" ? null : "less")}
          className={`rounded-2xl border bg-white p-5 transition ${
            open === "less" ? "border-[#7cc2c8] ring-2 ring-[#7cc2c8]/30" : "border-[#101927]/10"
          }`}
        >
          <Moon size={22} className={open === "less" ? "text-[#7cc2c8]" : "text-[#101927]/40"} />
          <p className="mt-3 font-display text-sm font-bold">Hacer de menos</p>
        </button>
        <button
          onClick={() => setOpen(open === "more" ? null : "more")}
          className={`rounded-2xl border bg-white p-5 transition ${
            open === "more" ? "border-[#facb60] ring-2 ring-[#facb60]/30" : "border-[#101927]/10"
          }`}
        >
          <Activity size={22} className={open === "more" ? "text-[#facb60]" : "text-[#101927]/40"} />
          <p className="mt-3 font-display text-sm font-bold">Hacer de más</p>
        </button>
      </div>

      {open && (
        <GlassCard className="mt-4 p-5">
          <p className="font-display text-sm font-bold text-[#7cc2c8]">
            {open === "less" ? c.less.title : c.more.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#101927]/75">
            {open === "less" ? c.less.body : c.more.body}
          </p>
        </GlassCard>
      )}
    </div>
  );
}

// ---------- Step 1: Selección de valores ----------
function ValuesStep({
  content,
  selected,
  onChange,
}: {
  content: BAContent;
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (key: string) => {
    if (selected.includes(key)) onChange(selected.filter((s) => s !== key));
    else if (selected.length < 2) onChange([...selected, key]);
  };

  return (
    <div>
      <GlassCard className="p-5">
        <p className="text-sm leading-relaxed text-[#101927]/75">
          <strong>Aclaración importante:</strong> La idea de actuar no es para "alcanzar metas y
          ya", sino para <strong>acercarte a tus valores</strong>. Las metas se terminan, los
          valores son la brújula que le da sentido a tu vida todos los días.
        </p>
      </GlassCard>

      <p className="mt-5 font-display text-sm font-bold">
        ¿Cuáles de estas áreas sientes más descuidadas y quieres volver a nutrir?
      </p>
      <p className="mt-1 text-xs text-[#101927]/55">Elegí hasta 2.</p>

      <div className="mt-3 space-y-2">
        {content.values_catalog.map((v) => {
          const active = selected.includes(v.key);
          return (
            <button
              key={v.key}
              onClick={() => toggle(v.key)}
              className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left transition ${
                active ? "border-[#facb60] ring-2 ring-[#facb60]/30" : "border-[#101927]/10"
              }`}
            >
              <span className="text-2xl">{v.emoji}</span>
              <div className="flex-1">
                <p className="font-display text-sm font-bold">{v.title}</p>
                <p className="text-xs text-[#101927]/55">{v.subtitle}</p>
              </div>
              {active && <Check size={18} className="text-[#facb60]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Step 2: Motivación + metas ----------
function MotivationStep({
  motivation,
  goals,
  onChange,
}: {
  motivation: string;
  goals: string[];
  onChange: (m: string, g: string[]) => void;
}) {
  const setGoal = (i: number, v: string) => {
    const next = [...goals];
    next[i] = v;
    onChange(motivation, next);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="font-display text-sm font-bold">¿Por qué es importante recuperar esto?</p>
        <p className="mt-1 text-xs text-[#101927]/55">
          Escribilo con tus palabras. Esto te va a sostener los días difíciles.
        </p>
        <textarea
          value={motivation}
          onChange={(e) => onChange(e.target.value, goals)}
          rows={5}
          placeholder="Quiero volver a sentirme presente con los que amo, dejar de mirarme desde afuera…"
          className="mt-3 w-full resize-none rounded-2xl border border-[#101927]/10 bg-white p-4 text-sm shadow-inner outline-none placeholder:text-[#101927]/35 focus:border-[#facb60]"
        />
      </div>

      <div>
        <p className="font-display text-sm font-bold">3 metas concretas</p>
        <p className="mt-1 text-xs text-[#101927]/55">
          Pequeñas, observables, alineadas con los valores que elegiste.
        </p>
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              value={goals[i] ?? ""}
              onChange={(e) => setGoal(i, e.target.value)}
              placeholder={`Meta ${i + 1}`}
              className="w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-sm shadow-inner outline-none placeholder:text-[#101927]/35 focus:border-[#facb60]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Step 3: Calendario línea base ----------
function BaselineCalendarStep({ programId }: { programId: string }) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-[#101927]/75">
        Durante esta semana vamos a observar tu actividad real. Para cada celda anotás qué hiciste,
        cómo te sentiste y la importancia de lo que haces. <strong>Luego el calendario quedará
        flotante.</strong>
      </p>

      <GlassCard className="mt-4 border-[#facb60]/30 p-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="mt-0.5 text-[#facb60]" />
          <div className="flex-1">
            <p className="font-display text-sm font-bold text-[#facb60]">Guía rápida de llenado:</p>
            <ol className="mt-2 space-y-1 text-xs text-[#101927]/75 list-decimal pl-4">
              <li>Buscá un día y bloque horario (ej: Lun 10:00).</li>
              <li>
                Tocá la celda vacía con el <strong>+</strong> para registrar.
              </li>
              <li>
                Anotá qué hiciste, la emoción, y puntuá tu <strong>D (Dominio)</strong> y{" "}
                <strong>A (Agrado)</strong> del 1 al 10.
              </li>
            </ol>
          </div>
        </div>
      </GlassCard>

      <div className="mt-4">
        <BACalendarModal programId={programId} embedded />
      </div>
    </div>
  );
}

// ---------- Step 4: Escalera ----------
function LadderStep({
  content,
  program,
  onChange,
}: {
  content: BAContent;
  program: BAProgram;
  onChange: (ladder: BALadderStep[], goalIdx: number) => void;
}) {
  const ladder: BALadderStep[] = useMemo(() => {
    if (program.ladder && program.ladder.length === 7) return program.ladder;
    const def = content.default_ladder ?? [];
    return Array.from({ length: 7 }, (_, i) => def[i] ?? { text: "", suds: 5 });
  }, [program.ladder, content.default_ladder]);

  const goalIdx = program.selected_goal_idx ?? 0;
  const validGoals = program.goals.filter((g) => g.trim().length > 0);

  const setLadder = (i: number, patch: Partial<BALadderStep>) => {
    const next = ladder.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange(next, goalIdx);
  };

  return (
    <div>
      <h2 className="font-mindful text-3xl">Tu Escalera</h2>
      <p className="mt-2 text-sm text-[#101927]/65">
        Seleccioná <strong>solo una</strong> de las metas para empezar y desglosémosla en{" "}
        <strong>7 pasos jerárquicos</strong>. Evalúa el nivel SUDS (Ansiedad 1 al 10).
      </p>

      <div className="relative mt-4">
        <select
          value={goalIdx}
          onChange={(e) => onChange(ladder, Number(e.target.value))}
          className="w-full appearance-none rounded-2xl border border-[#101927]/10 bg-white px-4 py-4 pr-10 font-display text-sm font-semibold shadow-inner outline-none focus:border-[#facb60]"
        >
          {validGoals.length === 0 ? (
            <option value={0}>Mi Meta 1</option>
          ) : (
            validGoals.map((g, i) => (
              <option key={i} value={i}>
                {g}
              </option>
            ))
          )}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#101927]/40" />
      </div>

      <GlassCard className="mt-4 border-[#facb60]/30 p-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="mt-0.5 text-[#facb60]" />
          <p className="text-xs leading-relaxed text-[#101927]/75">
            <strong>Recuerda:</strong> La motivación aparece DESPUÉS de hacer las cosas, no antes.
            Por eso empezamos desde la base (muy fácil) y subiremos día a día.
          </p>
        </div>
      </GlassCard>

      <div className="mt-6 space-y-3">
        {ladder.map((s, i) => (
          <div key={i} className="flex gap-3" style={{ marginLeft: `${i * 10}px` }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7cc2c8] font-display text-sm font-bold text-white">
              {i + 1}
            </div>
            <GlassCard className="flex-1 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
                  {i === 0 ? "Paso inicial (fácil)" : i === 6 ? "La meta" : `Paso ${i + 1}`}
                </span>
                <div className="flex items-center gap-1 rounded-full bg-[#facb60]/15 px-2 py-1">
                  <span className="text-[10px] font-bold text-[#8a6a13]">SUDS</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={s.suds}
                    onChange={(e) => setLadder(i, { suds: Number(e.target.value) || 0 })}
                    className="w-9 bg-transparent text-center text-sm font-bold text-[#8a6a13] outline-none"
                  />
                </div>
              </div>
              <input
                value={s.text}
                onChange={(e) => setLadder(i, { text: e.target.value })}
                placeholder="Ej: Buscar info en internet…"
                className="mt-2 w-full rounded-lg border border-[#101927]/10 bg-white px-3 py-2 text-sm shadow-inner outline-none placeholder:text-[#101927]/30 focus:border-[#facb60]"
              />
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  );
}
