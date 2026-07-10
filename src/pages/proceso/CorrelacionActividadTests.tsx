import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { loadDailySeries } from "@/lib/activityAggregator";
import { pearson, interpretR } from "@/lib/correlations";

export default function CorrelacionActividadTests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [testType, setTestType] = useState<string | null>(null);
  const [rows, setRows] = useState<{ date: string; score: number; activity: number }[]>([]);
  const [r, setR] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 90 * 86400000);
      since.setHours(0, 0, 0, 0);
      const { data: tests } = await supabase
        .from("test_results")
        .select("test_type, score, created_at")
        .eq("user_id", user.id)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      const counts: Record<string, number> = {};
      (tests ?? []).forEach((t: any) => {
        const code = String(t.test_type).toUpperCase();
        if (code === "BIGFIVE" || code === "BFI") return;
        counts[t.test_type] = (counts[t.test_type] ?? 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      setTestType(top);
      if (!top) return;

      const series = await loadDailySeries(user.id, { from: since, to: new Date() });
      const activityByDate: Record<string, number> = {};
      series.forEach((s) => (activityByDate[s.date] = s.activity));

      const out: { date: string; score: number; activity: number }[] = [];
      const xs: number[] = []; const ys: number[] = [];
      for (const t of (tests ?? []).filter((x: any) => x.test_type === top)) {
        const d = new Date(t.created_at);
        const from = new Date(d.getTime() - 6 * 86400000);
        let sum = 0;
        for (let i = 0; i < 7; i++) {
          const ds = new Date(from.getTime() + i * 86400000).toISOString().slice(0, 10);
          sum += activityByDate[ds] ?? 0;
        }
        out.push({ date: d.toISOString().slice(0, 10), score: Number(t.score), activity: sum });
        xs.push(sum); ys.push(-Number(t.score));
      }
      setRows(out);
      setR(pearson(xs, ys));
    })();
  }, [user]);

  const interp = interpretR(r);

  return (
    <div className="min-h-screen bg-[#f9f9fb] pb-20">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5" aria-label="Volver">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-[16px] font-medium">Actividad e inventarios</h1>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 pt-4">
        {!testType ? (
          <div className="rounded-2xl bg-white p-6 text-center text-[13px] text-[#64748b] shadow-sm">
            Necesitás al menos 3 tests recientes para ver esta conexión.
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-widest text-[#94a3b8]">{testType} · últimos 90 días</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-serif text-[36px] font-bold" style={{ color: interp.color }}>
                  {r !== null ? `${r >= 0 ? "+" : ""}${r.toFixed(2)}` : "—"}
                </span>
                <span className="text-[12px] text-[#64748b]">{interp.label}</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
                {r === null
                  ? "Faltan mediciones para ver la conexión."
                  : r > 0
                  ? "Semanas con más uso de la app tienden a coincidir con puntajes más saludables en el test."
                  : "Cuando registrás más actividad, el puntaje del test empeora. Puede ser un momento difícil."}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-[11px] uppercase tracking-widest text-[#94a3b8]">Evolución {testType}</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#cbd5e1" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} name="Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-[11px] uppercase tracking-widest text-[#94a3b8]">Actividad semanal previa</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#cbd5e1" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                    <Bar dataKey="activity" fill="#facb60" radius={[6, 6, 0, 0]} name="Actividad" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
