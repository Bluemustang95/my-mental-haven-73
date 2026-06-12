import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/pack/GlassCard";
import { BAContent, BADayLog, BAProgram, BAVlqDomain } from "@/lib/baTypes";

export function BADayLogSheet({
  day,
  program,
  content,
  onClose,
}: {
  day: number;
  program: BAProgram;
  content: BAContent;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [log, setLog] = useState<BADayLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || day === 1) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("ba_day_logs" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("program_id", program.id)
        .eq("day", day)
        .maybeSingle();
      setLog((data as any) ?? null);
      setLoading(false);
    })();
  }, [user, program.id, day]);

  const renderDayOne = () => {
    const topKeys = program.vlq_top_domains ?? [];
    const topDomains: BAVlqDomain[] = topKeys
      .map((k) => (content.vlq_domains ?? []).find((d) => d.key === k))
      .filter(Boolean) as BAVlqDomain[];

    return (
      <div className="space-y-4">
        <Section title="Dominios elegidos">
          <div className="flex flex-wrap gap-2">
            {topDomains.length === 0 && (
              <span className="text-xs text-[#101927]/55">Sin dominios registrados.</span>
            )}
            {topDomains.map((d) => (
              <span
                key={d.key}
                className="rounded-full border border-[#facb60]/40 bg-[#facb60]/10 px-3 py-1 text-xs font-bold text-[#101927]"
              >
                {d.emoji} {d.title}
              </span>
            ))}
          </div>
        </Section>

        {program.motivation && (
          <Section title="Motivación">
            <p className="whitespace-pre-line text-sm text-[#101927]/75">{program.motivation}</p>
          </Section>
        )}

        {program.goals?.length > 0 && (
          <Section title="Metas">
            <ul className="space-y-1.5">
              {program.goals.map((g, i) => (
                <li
                  key={i}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    i === program.selected_goal_idx
                      ? "border-[#facb60]/50 bg-[#facb60]/10 font-semibold text-[#101927]"
                      : "border-[#101927]/10 bg-white text-[#101927]/70"
                  }`}
                >
                  {i === program.selected_goal_idx ? "★ " : ""}{g}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {program.ladder?.length > 0 && (
          <Section title="Tu escalera (7 pasos)">
            <ol className="space-y-1.5">
              {program.ladder.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#101927]/10 bg-white px-3 py-2 text-sm"
                >
                  <span className="text-[#101927]/80">
                    <b className="text-[#7cc2c8]">{i + 1}.</b> {s.text}
                  </span>
                  <span className="text-[10px] font-bold text-[#101927]/45">SUDS {s.suds}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>
    );
  };

  const renderDayN = () => {
    if (!log) {
      return (
        <p className="text-sm text-[#101927]/60">
          No encontramos registros guardados para este día.
        </p>
      );
    }
    const step = program.ladder?.[day - 2];
    const barrier = log.barrier_chosen
      ? (content.barriers_catalog ?? []).find((b) => b.label === log.barrier_chosen)
      : null;

    return (
      <div className="space-y-4">
        {step && (
          <Section title={`Paso ${day - 1} de la escalera`}>
            <p className="text-sm text-[#101927]/80">{step.text}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#101927]/45">
              SUDS planificado: {step.suds}
            </p>
          </Section>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Hora agendada" value={log.scheduled_time ?? "—"} />
          <Stat
            label="Cerrado"
            value={log.completed_at ? new Date(log.completed_at).toLocaleDateString("es-AR") : "—"}
          />
          <Stat label="Dificultad anticipada" value={log.anticipated_difficulty ?? "—"} />
          <Stat label="Dificultad real" value={log.actual_difficulty ?? "—"} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <BigStat label="Dominio" value={log.dominio ?? 0} color="#facb60" />
          <BigStat label="Agrado" value={log.agrado ?? 0} color="#7cc2c8" />
        </div>

        {barrier && (
          <Section title="Barrera reportada">
            <p className="text-sm font-semibold text-[#101927]">{barrier.label}</p>
            <p className="mt-1 text-xs text-[#101927]/65">{barrier.response}</p>
          </Section>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/30 p-3 sm:items-center"
      onClick={onClose}
    >
      <GlassCard
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#101927]/5 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">
              Día {day} · Registro
            </p>
            <p className="font-display text-sm font-bold text-[#101927]">
              {day === 1 ? "Planificación" : "Activación"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/10 bg-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-[#101927]/55">Cargando…</p>
          ) : day === 1 ? (
            renderDayOne()
          ) : (
            renderDayN()
          )}
        </div>

        <div className="border-t border-[#101927]/5 p-3">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-[#101927] py-3 text-xs font-bold text-white"
          >
            Cerrar
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#101927]/45">
        {title}
      </p>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#101927]/10 bg-white px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#101927]/45">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#101927]">{value}</p>
    </div>
  );
}

function BigStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-2xl border px-3 py-3 text-center"
      style={{ borderColor: `${color}55`, background: `${color}10` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </p>
      <p className="font-display text-2xl font-bold" style={{ color }}>
        {value}/10
      </p>
    </div>
  );
}
