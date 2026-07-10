import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { loadDailySeries, weekRange, monthRange, rangeLabel, type Range } from "@/lib/activityAggregator";

type Mode = "week" | "month";

type Props = {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onRangeChange?: (r: Range) => void;
};

export function WellbeingChart({ mode, onModeChange, onRangeChange }: Props) {
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  const [series, setSeries] = useState<{ label: string; value: number | null }[]>([]);
  const [rangeText, setRangeText] = useState("");

  useEffect(() => { setOffset(0); }, [mode]);

  useEffect(() => {
    if (!user) return;
    const r = mode === "week" ? weekRange(offset) : monthRange(offset);
    setRangeText(rangeLabel(r, mode));
    onRangeChange?.(r);

    (async () => {
      const daily = await loadDailySeries(user.id, r);
      if (mode === "week") {
        const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        setSeries(daily.map((d) => {
          const dow = new Date(d.date + "T12:00:00").getDay();
          const idx = (dow + 6) % 7;
          return { label: labels[idx], value: d.mood };
        }));
      } else {
        // 4-5 weekly buckets
        const buckets: { label: string; sum: number; n: number }[] = [];
        daily.forEach((d, i) => {
          const w = Math.floor(i / 7);
          if (!buckets[w]) buckets[w] = { label: `S${w + 1}`, sum: 0, n: 0 };
          if (d.mood !== null) { buckets[w].sum += d.mood; buckets[w].n++; }
        });
        setSeries(buckets.map((b) => ({ label: b.label, value: b.n ? Math.round(b.sum / b.n) : null })));
      }
    })();
  }, [user, mode, offset]);

  const data = series.map((s) => ({ name: s.label, value: s.value ?? 0, has: s.value !== null }));
  const avg = (() => {
    const nums = series.map((s) => s.value).filter((v): v is number => v !== null);
    return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
  })();

  return (
    <div>
      <div className="mb-3 flex justify-center">
        <div className="flex rounded-full bg-[#f1f5f9] p-0.5">
          {(["week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onModeChange(r)}
              className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition ${
                mode === r ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
              }`}
            >
              {r === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#f8fafc] p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setOffset((o) => o + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#64748b] shadow-sm active:scale-95" aria-label="Anterior">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="font-serif text-[14px] font-medium text-[#0f172a]">{rangeText}</p>
            <p className="text-[10.5px] text-[#94a3b8]">Promedio {avg}/100</p>
          </div>
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#64748b] shadow-sm active:scale-95 disabled:opacity-30"
            aria-label="Siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mt-3 h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#cbd5e1" }} axisLine={false} tickLine={false} width={22} />
              <Tooltip cursor={{ fill: "rgba(124,194,200,0.08)" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 11 }} formatter={(v: any, _n, p: any) => [p.payload.has ? `${v}/100` : "sin datos", "Ánimo"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={!d.has ? "#e2e8f0" : d.value >= 70 ? "#7cc2c8" : d.value >= 45 ? "#facb60" : "#f59090"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
