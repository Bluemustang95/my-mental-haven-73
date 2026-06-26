import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { type Habit, type Completion, localDateStr } from "@/hooks/useHabits";

interface Props {
  habits: Habit[];
  completions: Completion[];
  onBack: () => void;
}

function dateBack(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

function RadialProgress({ pct, color }: { pct: number; color: string }) {
  const r = 64, c = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 50);
    return () => clearTimeout(t);
  }, [pct]);
  const offset = c - (c * animated) / 100;
  return (
    <div className="relative flex h-[180px] w-[180px] items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} stroke="#eef1f5" strokeWidth="14" fill="none" />
        <circle
          cx="90" cy="90" r={r}
          stroke={color} strokeWidth="14" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.3,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <p className="font-serif text-[36px] font-bold text-[#101927]">{Math.round(pct)}%</p>
        <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.18em] text-[#101927]/45">30 días</p>
      </div>
    </div>
  );
}

function TrendArea({ values, color }: { values: number[]; color: string }) {
  const w = 300, h = 120, pad = 12;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);
    const y = h - pad - ((v / max) * (h - pad * 2));
    return { x, y, v };
  });
  // cubic Bezier
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const mx = (p0.x + p1.x) / 2;
    d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const area = d + ` L ${pts[pts.length - 1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;
  const [hover, setHover] = useState<number | null>(null);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="trendG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendG)" />
      <path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
          <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={color} strokeWidth={2} />
          {hover === i && (
            <g>
              <rect x={p.x - 18} y={p.y - 26} width="36" height="18" rx="6" fill="#101927" />
              <text x={p.x} y={p.y - 13} fontSize="10" fontWeight="700" fill="white" textAnchor="middle">{p.v}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

function WeekdayBars({ values, color }: { values: number[]; color: string }) {
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-[140px] items-end gap-2">
      {values.map((v, i) => {
        const pct = (v / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative w-full flex-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="absolute bottom-0 w-full rounded-t-lg"
                style={{ backgroundColor: color }}
              />
            </div>
            <span className="font-[Montserrat] text-[9px] font-bold text-[#101927]/55">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function HourlyBars({ values, color }: { values: { label: string; pct: number }[]; color: string }) {
  return (
    <div className="space-y-3">
      {values.map((v, i) => (
        <div key={i}>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#101927]">{v.label}</span>
            <span className="text-[11px] font-bold text-[#101927]/60">{Math.round(v.pct)}%</span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[#eef1f5]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${v.pct}%` }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsDashboard({ habits, completions, onBack }: Props) {
  const [habitId, setHabitId] = useState<string>(habits[0]?.id ?? "");
  const habit = habits.find(h => h.id === habitId) ?? habits[0];

  const data = useMemo(() => {
    if (!habit) return null;
    const habitComps = completions.filter(c => c.habit_id === habit.id);
    const dones = new Set(habitComps.map(c => c.completed_date));

    const last30 = Array.from({ length: 30 }).filter((_, i) => dones.has(dateBack(29 - i))).length;
    const adherence = (last30 / 30) * 100;

    // weekly trend: last 8 weeks
    const trend: number[] = [];
    for (let w = 7; w >= 0; w--) {
      let count = 0;
      for (let d = 0; d < 7; d++) {
        if (dones.has(dateBack(w * 7 + d))) count++;
      }
      trend.push(count);
    }

    // weekday distribution (last 60 days)
    const weekday = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60; i++) {
      const ds = dateBack(i);
      if (dones.has(ds)) {
        const dt = new Date(ds + "T00:00:00");
        const idx = (dt.getDay() + 6) % 7; // mon=0
        weekday[idx]++;
      }
    }

    // time slot distribution from created_at of each completion
    const slots = { morning: 0, afternoon: 0, night: 0 };
    let total = 0;
    for (const c of habitComps) {
      const h = new Date(c.created_at).getHours();
      total++;
      if (h < 12) slots.morning++;
      else if (h < 19) slots.afternoon++;
      else slots.night++;
    }
    const sd = Math.max(1, total);
    const slotData = [
      { label: "Mañana", pct: (slots.morning / sd) * 100 },
      { label: "Tarde", pct: (slots.afternoon / sd) * 100 },
      { label: "Noche", pct: (slots.night / sd) * 100 },
    ];

    return { adherence, trend, weekday, slotData };
  }, [habit, completions]);

  if (!habit) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-[14px] text-[#101927]/60">Creá tu primer hábito para ver estadísticas.</p>
        <button onClick={onBack} className="mt-4 rounded-full bg-[#101927] px-5 py-2 text-sm font-bold text-white">Volver</button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-white/40 bg-white/50 px-5 pt-5 pb-4 backdrop-blur-[28px]">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_-6px_rgba(16,25,39,0.18)] active:scale-95">
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="font-[Montserrat] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#101927]/45">Reporte</p>
            <h1 className="font-serif text-[18px] font-bold leading-tight text-[#101927]">Estadísticas</h1>
          </div>
        </div>
        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {habits.map(h => (
            <button
              key={h.id}
              onClick={() => setHabitId(h.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold transition ${
                h.id === habit.id ? "bg-[#101927] text-white" : "bg-white text-[#101927]/65"
              }`}
            >{h.icon_type === "line" ? "•" : h.icon} {h.name}</button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-28 no-scrollbar smooth-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Radial */}
            <div className="flex flex-col items-center rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_30px_-14px_rgba(16,25,39,0.10)] backdrop-blur-[20px]">
              <p className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Adherencia global</p>
              <div className="mt-3"><RadialProgress pct={data!.adherence} color={habit.color} /></div>
            </div>

            {/* Trend */}
            <div className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_30px_-14px_rgba(16,25,39,0.10)] backdrop-blur-[20px]">
              <p className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Tendencia de constancia · 8 semanas</p>
              <div className="mt-3"><TrendArea values={data!.trend} color={habit.color} /></div>
            </div>

            {/* Weekday */}
            <div className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_30px_-14px_rgba(16,25,39,0.10)] backdrop-blur-[20px]">
              <p className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Días de mayor constancia</p>
              <div className="mt-3"><WeekdayBars values={data!.weekday} color={habit.color} /></div>
            </div>

            {/* Hourly */}
            <div className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_30px_-14px_rgba(16,25,39,0.10)] backdrop-blur-[20px]">
              <p className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Adherencia horaria</p>
              <div className="mt-4"><HourlyBars values={data!.slotData} color={habit.color} /></div>
            </div>

            {/* Psychoeducation */}
            <div className="rounded-[24px] border border-[#facb60]/40 bg-[#facb60]/10 p-5">
              <p className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#92561a]">Psicoeducación DBT</p>
              <p className="mt-2 font-serif text-[14px] leading-relaxed text-[#101927]/85">
                La constancia de pequeñas rutinas regula el sistema parasimpático y permite acumular afecto positivo, una de las habilidades fundamentales de Linehan para sostener el bienestar emocional a largo plazo.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
