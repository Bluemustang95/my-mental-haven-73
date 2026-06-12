import { useEffect, useState } from "react";
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { AmbientGlows } from "@/components/pack/AmbientGlows";
import { GlassCard } from "@/components/pack/GlassCard";
import { BAContent, BADayLog, BADayPhase, BAProgram } from "@/lib/baTypes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BABarrierFlow } from "./BABarrierFlow";
import { localDateStr } from "@/lib/utils";

export function BADayTask({
  content,
  program,
  day,
  onBack,
  onDayCompleted,
}: {
  content: BAContent;
  program: BAProgram;
  day: number;
  onBack: () => void;
  onDayCompleted: () => void;
}) {
  const { user } = useAuth();
  const stepIdx = day - 2;
  const step = program.ladder?.[stepIdx] ?? { text: "Tu acción del día", suds: 5 };
  const dailyMsg = content.daily_messages?.[String(day)] ?? "";

  const [log, setLog] = useState<BADayLog | null>(null);
  const [phase, setPhase] = useState<BADayPhase>("planning");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [anticipated, setAnticipated] = useState(step.suds);
  const [actual, setActual] = useState(5);
  const [dominio, setDominio] = useState(5);
  const [agrado, setAgrado] = useState(5);
  const [showBarriers, setShowBarriers] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("ba_day_logs" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("program_id", program.id)
        .eq("day", day)
        .maybeSingle();
      if (data) {
        const l = data as any as BADayLog;
        setLog(l);
        setPhase((l.phase as BADayPhase) || "planning");
        if (l.scheduled_time) setScheduledTime(l.scheduled_time.slice(0, 5));
        if (l.anticipated_difficulty != null) setAnticipated(l.anticipated_difficulty);
      }
    })();
  }, [user, program.id, day]);

  const upsert = async (patch: Partial<BADayLog>) => {
    if (!user) return null;
    const payload = {
      user_id: user.id,
      program_id: program.id,
      day,
      ...patch,
    };
    const { data } = await supabase
      .from("ba_day_logs" as any)
      .upsert(payload, { onConflict: "user_id,program_id,day" })
      .select()
      .maybeSingle();
    if (data) setLog(data as any);
    return data;
  };

  const commit = async () => {
    await upsert({
      phase: "pending",
      scheduled_time: scheduledTime,
      anticipated_difficulty: anticipated,
    });
    setPhase("pending");
  };

  const markDone = async () => {
    await upsert({ phase: "feedback" });
    setPhase("feedback");
  };

  const handleBarrier = async (label: string) => {
    await upsert({ barrier_chosen: label });
    setShowBarriers(false);
  };

  const finishDay = async () => {
    await upsert({
      phase: "done",
      actual_difficulty: actual,
      dominio,
      agrado,
      completed_at: new Date().toISOString(),
    });
    // Integración con el Diario: aparece como momento del día
    if (user) {
      const hour = Number((scheduledTime || "12:00").slice(0, 2));
      const period = hour < 12 ? "morning" : hour < 19 ? "afternoon" : "night";
      const moodScore = Math.max(1, Math.min(5, Math.round(((dominio + agrado) / 2) / 2)));
      const note = `🔆 BA · Día ${day}: ${step.text} — D ${dominio}/10 · A ${agrado}/10`;
      await supabase.from("day_timeline_entries").upsert(
        {
          user_id: user.id,
          period,
          mood_score: moodScore,
          note,
          entry_date: localDateStr(),
        },
        { onConflict: "user_id,entry_date,period" },
      );
    }
    onDayCompleted();
  };

  return (
    <div className="relative min-h-screen bg-[#fdfbfb] text-[#101927] safe-area-top">
      <AmbientGlows />

      <header className="sticky top-0 z-10 border-b border-[#101927]/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/10 bg-white shadow-sm"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="font-display text-sm font-semibold">Día {day} de 7</p>
          <div className="w-9" />
        </div>
      </header>

      <main className="relative mx-auto max-w-md px-5 pt-6 pb-12">
        {dailyMsg && (
          <p className="mb-4 text-center text-sm italic text-[#101927]/55">{dailyMsg}</p>
        )}

        {phase === "planning" && (
          <>
            <h2 className="font-mindful text-2xl">Hora de actuar</h2>
            <GlassCard className="mt-4 p-5">
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
                Tu acción de hoy
              </p>
              <p className="mt-1 text-lg font-medium">{step.text}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#facb60]/15 px-3 py-1 text-[11px] font-bold text-[#8a6a13]">
                SUDS anticipado original: {step.suds}/10
              </div>
            </GlassCard>

            <div className="mt-5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#101927]/55">
                ¿A qué hora la hacés hoy?
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-sm shadow-inner outline-none focus:border-[#facb60]"
              />
            </div>

            <div className="mt-5">
              <Slider
                label="Dificultad anticipada AHORA"
                color="#facb60"
                value={anticipated}
                onChange={setAnticipated}
              />
            </div>

            <button
              onClick={commit}
              className="mt-8 w-full rounded-full bg-[#101927] py-4 font-display text-sm font-bold text-white active:scale-[0.98]"
            >
              Me comprometo
            </button>
          </>
        )}

        {phase === "pending" && (
          <>
            <div className="flex justify-center pt-6">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#facb60]/40" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-[#facb60]/40">
                  <Clock size={44} className="text-[#facb60]" />
                </div>
              </div>
            </div>
            <h2 className="mt-6 text-center font-mindful text-2xl">Misión pendiente</h2>
            <GlassCard className="mt-5 p-5 text-center">
              <p className="text-sm text-[#101927]/65">Agendaste para hoy a las</p>
              <p className="mt-1 font-display text-2xl font-bold">{scheduledTime}</p>
              <p className="mt-3 text-sm text-[#101927]/75">{step.text}</p>
            </GlassCard>

            <div className="mt-6 space-y-3">
              <button
                onClick={markDone}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#facb60] py-4 font-display text-sm font-bold text-[#101927] shadow-[0_10px_30px_rgba(250,203,96,0.35)] active:scale-[0.98]"
              >
                <CheckCircle2 size={18} /> ¡Ya lo hice!
              </button>
              <button
                onClick={() => setShowBarriers(true)}
                className="w-full rounded-full border border-[#101927]/10 bg-white py-3 text-sm font-semibold text-[#101927]/60"
              >
                No pude hacerlo
              </button>
            </div>
          </>
        )}

        {phase === "feedback" && (
          <>
            <h2 className="font-mindful text-2xl">¡Gran trabajo!</h2>
            <p className="mt-2 text-sm text-[#101927]/65">
              Habías anticipado una dificultad de <strong>{log?.anticipated_difficulty ?? anticipated}/10</strong>.
              Ahora veamos qué pasó en la realidad.
            </p>

            <div className="mt-5 space-y-4">
              <Slider label="¿Qué tan difícil fue en realidad?" color="#101927" value={actual} onChange={setActual} />
              <Slider label="Dominio (Logro)" color="#facb60" value={dominio} onChange={setDominio} />
              <Slider label="Agrado (Placer)" color="#7cc2c8" value={agrado} onChange={setAgrado} />
            </div>

            <button
              onClick={finishDay}
              className="mt-8 w-full rounded-full bg-[#101927] py-4 font-display text-sm font-bold text-white active:scale-[0.98]"
            >
              Registrar y descansar
            </button>
          </>
        )}
      </main>

      {showBarriers && (
        <BABarrierFlow
          content={content}
          onChoose={handleBarrier}
          onClose={() => setShowBarriers(false)}
        />
      )}
    </div>
  );
}

function Slider({ label, color, value, onChange }: { label: string; color: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="font-display text-lg font-bold" style={{ color }}>{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}
