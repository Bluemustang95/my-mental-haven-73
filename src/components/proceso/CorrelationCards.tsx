import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loadDailySeries, type Range } from "@/lib/activityAggregator";
import { supabase } from "@/integrations/supabase/client";
import { pearson, interpretR } from "@/lib/correlations";

export function CorrelationCards({ range }: { range: Range | null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rActBien, setRActBien] = useState<{ r: number | null; n: number } | null>(null);
  const [rActTest, setRActTest] = useState<{ r: number | null; n: number; test: string | null } | null>(null);

  useEffect(() => {
    if (!user || !range) return;
    (async () => {
      const series = await loadDailySeries(user.id, range);
      const pairs = series.filter((s) => s.mood !== null);
      const r = pearson(pairs.map((p) => p.activity), pairs.map((p) => p.mood!));
      setRActBien({ r, n: pairs.length });

      // Actividad semanal vs score del test más registrado (últimos 90d)
      const since = new Date(Date.now() - 90 * 86400000).toISOString();
      const { data: tests } = await supabase
        .from("test_results")
        .select("test_type, score, created_at")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      const counts: Record<string, number> = {};
      (tests ?? []).forEach((t: any) => {
        const code = String(t.test_type).toUpperCase();
        if (code === "BIGFIVE" || code === "BFI") return;
        counts[t.test_type] = (counts[t.test_type] ?? 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      if (!top) { setRActTest({ r: null, n: 0, test: null }); return; }

      const rows = (tests ?? []).filter((t: any) => t.test_type === top);
      // Para cada test, contar actividad de esa semana
      const activityByDate: Record<string, number> = {};
      series.forEach((s) => { activityByDate[s.date] = s.activity; });
      const xs: number[] = []; const ys: number[] = [];
      for (const t of rows) {
        const d = new Date(t.created_at);
        const from = new Date(d.getTime() - 6 * 86400000);
        let sum = 0;
        for (let i = 0; i < 7; i++) {
          const ds = new Date(from.getTime() + i * 86400000).toISOString().slice(0, 10);
          sum += activityByDate[ds] ?? 0;
        }
        xs.push(sum);
        ys.push(-Number(t.score)); // invertido: score alto en depresión/ansiedad = peor
      }
      setRActTest({ r: pearson(xs, ys), n: rows.length, test: top });
    })();
  }, [user, range]);

  return (
    <div className="space-y-2">
      <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
        Qué se conecta con qué
      </p>
      <CorrelationCard
        title="Actividad y bienestar"
        subtitle="¿Cuánto se conecta usar la app con cómo te sentís?"
        icon={<TrendingUp size={20} />}
        data={rActBien}
        onClick={() => navigate("/proceso/conexiones/actividad-bienestar")}
      />
      <CorrelationCard
        title="Actividad e inventarios"
        subtitle={rActTest?.test ? `Vs ${rActTest.test}` : "Necesitás varios tests"}
        icon={<ClipboardList size={20} />}
        data={rActTest ? { r: rActTest.r, n: rActTest.n } : null}
        onClick={() => navigate("/proceso/conexiones/actividad-tests")}
      />
    </div>
  );
}

function CorrelationCard({
  title, subtitle, icon, data, onClick,
}: {
  title: string; subtitle: string; icon: React.ReactNode;
  data: { r: number | null; n: number } | null;
  onClick: () => void;
}) {
  const enough = data && data.n >= 7 && data.r !== null;
  const interp = data && data.r !== null ? interpretR(data.r) : null;

  return (
    <button onClick={onClick} className="w-full rounded-2xl bg-[#f8fafc] p-4 text-left transition active:scale-[0.995]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#facb60]/25 text-[#b45309]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#0f172a]">{title}</p>
          <p className="text-[11px] text-[#64748b] truncate">{subtitle}</p>
        </div>
        <ArrowRight size={16} className="text-[#94a3b8]" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {enough && interp ? (
          <>
            <span className="font-serif text-[22px] font-bold tabular-nums" style={{ color: interp.color }}>
              {data!.r! >= 0 ? "+" : ""}{data!.r!.toFixed(2)}
            </span>
            <span className="text-[11.5px] text-[#64748b]">{interp.label}</span>
          </>
        ) : (
          <span className="text-[11.5px] text-[#94a3b8]">
            {data ? `Necesitás más registros (${data.n}/7)` : "Cargando…"}
          </span>
        )}
      </div>
    </button>
  );
}
