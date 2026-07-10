import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { loadDailySeries, weekRange } from "@/lib/activityAggregator";
import { pearson, interpretR } from "@/lib/correlations";

export default function CorrelacionActividadBienestar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<{ activity: number; mood: number; date: string }[]>([]);
  const [line, setLine] = useState<{ date: string; mood: number | null; activity: number }[]>([]);
  const [r, setR] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Últimas 8 semanas
      const from = new Date(Date.now() - 8 * 7 * 86400000);
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      const series = await loadDailySeries(user.id, { from, to });
      setLine(series);
      const pairs = series.filter((s) => s.mood !== null);
      setData(pairs.map((p) => ({ activity: p.activity, mood: p.mood!, date: p.date })));
      setR(pearson(pairs.map((p) => p.activity), pairs.map((p) => p.mood!)));
    })();
  }, [user]);

  const interp = interpretR(r);

  return (
    <div className="min-h-screen bg-[#f9f9fb] pb-20">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5" aria-label="Volver">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-[16px] font-medium">Actividad y bienestar</h1>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 pt-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-widest text-[#94a3b8]">Últimas 8 semanas</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-[36px] font-bold" style={{ color: interp.color }}>
              {r !== null ? `${r >= 0 ? "+" : ""}${r.toFixed(2)}` : "—"}
            </span>
            <span className="text-[12px] text-[#64748b]">{interp.label}</span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
            {r === null || Math.abs(r) < 0.15
              ? "Todavía no vemos una conexión clara entre tu actividad diaria y cómo te sentís. Seguí registrando: con más datos aparecen los patrones."
              : r > 0
              ? "Los días que registrás más actividad tienden a coincidir con mejor ánimo."
              : "Los días con más actividad tienden a coincidir con peor ánimo. Puede ser sobrecarga o rebote emocional."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-[#94a3b8]">Dispersión</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 8, bottom: 20, left: -8 }}>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis type="number" dataKey="activity" name="Actividad" tick={{ fontSize: 10, fill: "#94a3b8" }} label={{ value: "Actividad diaria", position: "bottom", fontSize: 10, fill: "#94a3b8" }} />
                <YAxis type="number" dataKey="mood" name="Ánimo" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Scatter data={data} fill="#7cc2c8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-[#94a3b8]">Evolución diaria</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={line} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#cbd5e1" }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Line type="monotone" dataKey="mood" stroke="#7cc2c8" strokeWidth={2} dot={false} name="Ánimo" />
                <Line type="monotone" dataKey="activity" stroke="#facb60" strokeWidth={2} dot={false} name="Actividad" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
