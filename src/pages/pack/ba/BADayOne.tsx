import { useMemo, useState } from "react";
import { ArrowLeft, Moon, Activity, Check, Info, ChevronDown, Sparkles, RotateCcw } from "lucide-react";
import { AmbientGlows } from "@/components/pack/AmbientGlows";
import { GlassCard } from "@/components/pack/GlassCard";
import { StepDots } from "@/components/pack/StepDots";
import {
  BAContent,
  BALadderStep,
  BAProgram,
  BAVlqDomain,
  computeVlqTopDomains,
} from "@/lib/baTypes";
import { BACalendarModal } from "./BACalendarModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";


const TOTAL_STEPS = 6;

export function BADayOne({
  content,
  program,
  onUpdate,
  onFinish,
  onBack,
  onReset,
}: {
  content: BAContent;
  program: BAProgram;
  onUpdate: (patch: Partial<BAProgram>) => void;
  onFinish: () => void;
  onBack: () => void;
  onReset?: () => Promise<void> | void;
}) {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();

  const step = Math.min(program.day_one_step ?? 0, TOTAL_STEPS - 1);
  const setStep = (s: number) => onUpdate({ day_one_step: s });

  const vlqDomains = content.vlq_domains ?? [];
  const importance = program.vlq_importance ?? {};
  const consistency = program.vlq_consistency ?? {};
  const top = useMemo(
    () => computeVlqTopDomains(vlqDomains, importance, consistency, 3),
    [vlqDomains, importance, consistency],
  );
  const allRated = vlqDomains.length > 0 && vlqDomains.every((d) => importance[d.key] != null);

  const nextDisabled =
    (step === 1 && !allRated) || (step === 2 && (program.vlq_top_domains?.length ?? 0) === 0);

  const handleNext = async () => {
    // When leaving VLQ quiz, persist responses to vlq_responses
    if (step === 1 && user) {
      await supabase.from("vlq_responses" as any).delete()
        .eq("user_id", user.id).eq("program_id", program.id);
      const rows = vlqDomains
        .filter((d) => importance[d.key] != null)
        .map((d) => ({
          user_id: user.id,
          program_id: program.id,
          domain_key: d.key,
          importance: importance[d.key] ?? 0,
          consistency: consistency[d.key] ?? 5,
        }));
      if (rows.length) await supabase.from("vlq_responses" as any).insert(rows);
      const autoTop = top.map((t) => t.domain.key);
      onUpdate({
        vlq_top_domains: autoTop,
        vlq_completed_at: new Date().toISOString(),
        day_one_step: 2,
      });
      return;
    }
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else onFinish();
  };

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
          {isAdmin && onReset ? (
            <button
              onClick={async () => {
                if (!window.confirm("¿Reiniciar el programa de Activación Comportamental?")) return;
                await onReset();
              }}
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
        <div className="px-5 pb-3">
          <StepDots total={TOTAL_STEPS} current={step} />
        </div>
      </header>

      <main className="relative mx-auto max-w-md px-5 pb-32 pt-6">
        {step === 0 && <CyclePsicoStep content={content} />}
        {step === 1 && (
          <VlqQuizStep
            domains={vlqDomains}
            importance={importance}
            consistency={consistency}
            onChange={(imp, con) =>
              onUpdate({ vlq_importance: imp, vlq_consistency: con })
            }
          />
        )}
        {step === 2 && (
          <VlqResultsStep
            domains={vlqDomains}
            importance={importance}
            consistency={consistency}
            selected={program.vlq_top_domains ?? []}
            onChange={(keys) => onUpdate({ vlq_top_domains: keys })}
          />
        )}
        {step === 3 && (
          <MotivationStep
            content={content}
            program={program}
            onChange={(motivation, goals) => onUpdate({ motivation, goals })}
          />
        )}
        {step === 4 && program.id && <BaselineCalendarStep programId={program.id} />}
        {step === 5 && (
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
            disabled={nextDisabled}
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#101927] py-4 font-display text-sm font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === 1
              ? "Ver mis resultados"
              : step < TOTAL_STEPS - 1
              ? "Siguiente Paso"
              : "Comenzar mi Tratamiento"}
          </button>
          {nextDisabled && step === 1 && (
            <p className="mt-2 text-center text-[11px] text-[#101927]/45">
              Completá los 10 dominios para ver tu mapa.
            </p>
          )}
          {nextDisabled && step === 2 && (
            <p className="mt-2 text-center text-[11px] text-[#101927]/45">
              Elegí al menos 1 dominio para enfocarte.
            </p>
          )}
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

// ---------- Step 1: VLQ Cuestionario ----------
function VlqQuizStep({
  domains,
  importance,
  consistency,
  onChange,
}: {
  domains: BAVlqDomain[];
  importance: Record<string, number>;
  consistency: Record<string, number>;
  onChange: (imp: Record<string, number>, con: Record<string, number>) => void;
}) {
  const setImp = (k: string, v: number) => onChange({ ...importance, [k]: v }, consistency);
  const setCon = (k: string, v: number) => onChange(importance, { ...consistency, [k]: v });

  const done = domains.filter((d) => importance[d.key] != null).length;

  return (
    <div>
      <p className="font-display text-[10px] font-bold uppercase tracking-widest text-[#facb60]">
        Cuestionario VLQ
      </p>
      <h2 className="mt-1 font-mindful text-3xl">Tu mapa de valores</h2>
      <p className="mt-2 text-sm text-[#101927]/65">
        Para cada área marcá qué tan <strong>importante</strong> es para vos y qué tan{" "}
        <strong>en línea</strong> viviste la última semana. Las dos cosas pueden ir distintas: ahí
        están los huecos para activar.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-full bg-white px-4 py-2 shadow-inner ring-1 ring-[#101927]/5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#101927]/55">
          Progreso
        </span>
        <span className="font-display text-sm font-bold text-[#facb60]">
          {done}/{domains.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {domains.map((d) => {
          const imp = importance[d.key];
          const con = consistency[d.key];
          const rated = imp != null;
          return (
            <GlassCard
              key={d.key}
              className={`p-4 transition ${rated ? "ring-1 ring-[#facb60]/30" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{d.emoji}</span>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold">{d.title}</p>
                  <p className="text-xs text-[#101927]/55">{d.subtitle}</p>
                </div>
                {rated && <Check size={16} className="mt-1 text-[#facb60]" />}
              </div>

              <div className="mt-4 space-y-3">
                <DualSlider
                  label="Importancia"
                  color="#facb60"
                  value={imp ?? 0}
                  onChange={(v) => setImp(d.key, v)}
                />
                <DualSlider
                  label="Consistencia (última semana)"
                  color="#7cc2c8"
                  value={con ?? (imp != null ? 5 : 0)}
                  onChange={(v) => setCon(d.key, v)}
                />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

function DualSlider({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        <span className="font-display text-sm font-bold" style={{ color }}>
          {value || "—"}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}

// ---------- Step 2: Resultados VLQ ----------
function VlqResultsStep({
  domains,
  importance,
  consistency,
  selected,
  onChange,
}: {
  domains: BAVlqDomain[];
  importance: Record<string, number>;
  consistency: Record<string, number>;
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const top = useMemo(
    () => computeVlqTopDomains(domains, importance, consistency, 3),
    [domains, importance, consistency],
  );
  const rest = useMemo(
    () =>
      domains
        .map((d) => ({
          domain: d,
          importance: importance[d.key] ?? 0,
          consistency: consistency[d.key] ?? 0,
          gap: (importance[d.key] ?? 0) - (consistency[d.key] ?? 0),
        }))
        .filter((r) => !top.some((t) => t.domain.key === r.domain.key))
        .sort((a, b) => b.gap - a.gap || b.importance - a.importance),
    [domains, importance, consistency, top],
  );

  const toggle = (key: string) => {
    if (selected.includes(key)) onChange(selected.filter((s) => s !== key));
    else if (selected.length < 3) onChange([...selected, key]);
  };

  return (
    <div>
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#facb60]/15 ring-1 ring-[#facb60]/30">
          <Sparkles className="text-[#facb60]" size={28} />
        </div>
      </div>
      <h2 className="mt-4 text-center font-mindful text-3xl">Tus valores activos</h2>
      <p className="mt-2 text-center text-sm text-[#101927]/65">
        Estas áreas muestran la mayor distancia entre lo que te <strong>importa</strong> y lo que
        estás <strong>viviendo</strong>. Son las candidatas naturales para activar.
      </p>

      {top.length === 0 ? (
        <GlassCard className="mt-5 p-5 text-center text-sm text-[#101927]/65">
          No encontramos áreas con importancia alta y consistencia baja. Volvé al cuestionario y
          subí la importancia en al menos un dominio.
        </GlassCard>
      ) : (
        <div className="mt-5 space-y-3">
          {top.map((r, i) => {
            const active = selected.includes(r.domain.key);
            return (
              <button
                key={r.domain.key}
                onClick={() => toggle(r.domain.key)}
                className={`flex w-full items-stretch gap-3 overflow-hidden rounded-2xl border bg-white text-left shadow-[0_10px_40px_rgba(16,25,39,0.05)] transition ${
                  active ? "border-[#facb60] ring-2 ring-[#facb60]/40" : "border-[#101927]/10"
                }`}
              >
                <div
                  className="flex w-2 shrink-0"
                  style={{ backgroundColor: i === 0 ? "#facb60" : i === 1 ? "#7cc2c8" : "#101927" }}
                />
                <div className="flex-1 py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{r.domain.emoji}</span>
                    <p className="font-display text-sm font-bold">{r.domain.title}</p>
                    {active && <Check size={16} className="ml-auto text-[#facb60]" />}
                  </div>
                  <p className="mt-1 text-xs text-[#101927]/55">{r.domain.subtitle}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] font-bold">
                    <span className="rounded-full bg-[#facb60]/15 px-2 py-0.5 text-[#8a6a13]">
                      Importa {r.importance}
                    </span>
                    <span className="rounded-full bg-[#7cc2c8]/15 px-2 py-0.5 text-[#2c6b70]">
                      Vivís {r.consistency}
                    </span>
                    <span className="ml-auto text-[#101927]/55">Brecha {r.gap}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-[#101927]/55">
        Tocá las que quieras trabajar primero (máx 3). Quedan guardadas como tu enfoque para esta
        semana.
      </p>

      {rest.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-[#101927]/55">
            Ver mi mapa completo ({rest.length} áreas)
          </summary>
          <div className="mt-3 space-y-2">
            {rest.map((r) => (
              <div
                key={r.domain.key}
                className="flex items-center gap-2 rounded-xl border border-[#101927]/5 bg-white/60 p-3"
              >
                <span className="text-lg">{r.domain.emoji}</span>
                <p className="flex-1 text-xs font-bold">{r.domain.title}</p>
                <span className="text-[10px] text-[#101927]/55">
                  I {r.importance} · C {r.consistency} · B {r.gap}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ---------- Step 3: Motivación + metas ----------
function MotivationStep({
  content,
  program,
  onChange,
}: {
  content: BAContent;
  program: BAProgram;
  onChange: (m: string, g: string[]) => void;
}) {
  const { motivation, goals } = program;
  const setGoal = (i: number, v: string) => {
    const next = [...goals];
    next[i] = v;
    onChange(motivation, next);
  };

  const topDomains = (program.vlq_top_domains ?? [])
    .map((k) => (content.vlq_domains ?? []).find((d) => d.key === k))
    .filter(Boolean) as BAVlqDomain[];

  return (
    <div className="space-y-5">
      {topDomains.length > 0 && (
        <GlassCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#facb60]">
            Tu enfoque
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {topDomains.map((d) => (
              <span
                key={d.key}
                className="flex items-center gap-1.5 rounded-full bg-[#facb60]/15 px-3 py-1 text-xs font-bold text-[#8a6a13]"
              >
                <span>{d.emoji}</span> {d.title}
              </span>
            ))}
          </div>
        </GlassCard>
      )}

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
          Pequeñas, observables, alineadas con tus dominios elegidos.
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

// ---------- Step 4: Calendario línea base ----------
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

// ---------- Step 5: Escalera ----------
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
