import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminButton } from "@/components/admin/ui/AdminPrimitives";
import { WELLBEING_WEIGHTS, SLEEP_INNER } from "@/lib/wellbeing/types";

// Peso efectivo de cada dato dentro del Índice de Bienestar v3.
// "Despertar" (S2) no es un pilar propio: aporta el 30% del pilar Sueño.
const WEIGHTS: Record<"mood" | "sleep" | "dawn" | "balance", number> = {
  mood: WELLBEING_WEIGHTS.mood,
  sleep: WELLBEING_WEIGHTS.sleep,
  balance: WELLBEING_WEIGHTS.balance,
  dawn: Math.round((WELLBEING_WEIGHTS.sleep * SLEEP_INNER.S2) / 100),
};
import { AlertTriangle, CheckCircle2, RefreshCw, Users } from "lucide-react";

type Audit = {
  window_days: number;
  total_users: number;
  users_with_any_checkin: number;
  users_enough_data: number;
  users_insufficient: number;
  total_checkins: number;
  morning_checkins: number;
  night_checkins: number;
  coverage: { mood: number; sleep: number; dawn: number; balance: number };
  user_coverage: { mood: number; sleep: number; dawn: number; balance: number };
  dawn_values: { value: string; count: number }[];
  emotion_values: { value: string; count: number }[];
  test_seed_rows: number;
};

const LABELS: Record<keyof Audit["coverage"], string> = {
  mood: "Ánimo",
  sleep: "Sueño",
  balance: "Balance emocional",
  dawn: "Despertar",
};
const COLORS: Record<string, string> = {
  mood: "#7cc2c8", sleep: "#6366f1", balance: "#f0928a", dawn: "#facb60",
};

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

export default function WellbeingAudit() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (d = days) => {
    setLoading(true);
    setError(null);
    const { data: res, error: err } = await supabase.rpc("admin_wellbeing_audit" as any, { _days: d });
    if (err) setError(err.message);
    else setData(res as unknown as Audit);
    setLoading(false);
  };

  useEffect(() => { load(days); /* eslint-disable-next-line */ }, [days]);

  if (loading && !data) return <AdminCard className="p-6 text-sm text-slate-500">Calculando auditoría…</AdminCard>;
  if (error) return <AdminCard className="p-6 text-sm text-rose-600">No se pudo cargar la auditoría: {error}</AdminCard>;
  if (!data) return null;

  // Si nadie llegó al umbral de 3 días, la cobertura por usuario no es informativa:
  // caemos a la cobertura por fila de check-in.
  const byUser = data.users_enough_data > 0;
  const cov = byUser ? data.user_coverage : data.coverage;
  const keys = (Object.keys(LABELS) as (keyof Audit["coverage"])[])
    .sort((a, b) => cov[a] - cov[b]);

  const alerts: string[] = [];
  for (const k of keys) {
    const v = cov[k];
    if (v < 60) {
      alerts.push(
        byUser
          ? `${LABELS[k]}: sólo el ${v}% de los usuarios con datos suficientes lo registra → su ${WEIGHTS[k]}% se redistribuye en el resto de los factores.`
          : `${LABELS[k]}: presente en sólo el ${v}% de los check-ins → su ${WEIGHTS[k]}% se redistribuye en el resto de los factores.`
      );
    }
  }
  const totalRituals = data.morning_checkins + data.night_checkins;
  if (totalRituals > 0) {
    const nightShare = pct(data.night_checkins, totalRituals);
    if (nightShare < 35) alerts.push(`El ritual nocturno representa sólo el ${nightShare}% de los check-ins: Sueño y Balance quedan sub-representados.`);
    if (nightShare > 65) alerts.push(`El ritual de la mañana representa sólo el ${100 - nightShare}% de los check-ins: Ánimo y Despertar quedan sub-representados.`);
  }
  if (data.users_enough_data === 0 && data.users_with_any_checkin > 0) {
    alerts.push(`Nadie alcanzó los 3 días de registro en los últimos ${data.window_days} días: hoy ningún usuario ve un número de índice.`);
  } else if (data.users_with_any_checkin > 0 && pct(data.users_enough_data, data.users_with_any_checkin) < 50) {
    alerts.push("Más de la mitad de quienes registran algo no llegan al mínimo de 3 días: la mayoría no ve número de índice.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === d ? "bg-resma-navy text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {d} días
            </button>
          ))}
        </div>
        <AdminButton variant="secondary" onClick={() => load()}>
          <RefreshCw size={14} /> Actualizar
        </AdminButton>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Usuarios totales" value={data.total_users} icon={<Users size={14} />} />
        <Stat label={`Registraron algo (${data.window_days}d)`} value={data.users_with_any_checkin} />
        <Stat
          label="Con datos suficientes (≥3 días)"
          value={data.users_enough_data}
          sub={`${pct(data.users_enough_data, data.total_users)}% del total`}
          tone="ok"
        />
        <Stat
          label="Insuficientes (sin índice)"
          value={data.users_insufficient}
          sub={`${pct(data.users_insufficient, data.total_users)}% del total`}
          tone="warn"
        />
      </div>

      <AdminCard className="p-6">
        <h3 className="mb-1 text-base font-semibold text-resma-navy">Cobertura por variable</h3>
        <p className="mb-5 text-xs text-slate-500">
          {byUser
            ? `Sobre usuarios con datos suficientes en los últimos ${data.window_days} días.`
            : `Nadie llegó a ${3} días de registro, así que se muestra la cobertura por fila de check-in.`}{" "}
          Ordenado del más ausente al más presente.
        </p>
        <div className="space-y-4">
          {keys.map((k) => (
            <div key={k}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-resma-navy">
                  {LABELS[k]} <span className="text-xs font-normal text-slate-400">· peso {WEIGHTS[k]}%</span>
                </span>
                <span className="font-bold tabular-nums" style={{ color: COLORS[k] }}>{cov[k]}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${cov[k]}%`, background: COLORS[k] }} />
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {data.coverage[k]}% de las filas de check-in traen este dato
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="mb-3 text-base font-semibold text-resma-navy">Auditoría: qué está faltando</h3>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} /> Todos los factores tienen cobertura razonable. Ningún peso se está redistribuyendo de forma sistemática.
          </div>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {a}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-3 text-xs text-slate-600">
          <Mini label="Check-ins totales" value={data.total_checkins} />
          <Mini label="Rituales de mañana" value={data.morning_checkins} />
          <Mini label="Rituales de noche" value={data.night_checkins} />
        </div>
      </AdminCard>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-resma-navy">Valores de Despertar registrados (30d)</h3>
          {data.dawn_values.length === 0 ? (
            <p className="text-xs text-slate-400">Sin datos.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-600">
              {data.dawn_values.map((d) => (
                <li key={d.value} className="flex justify-between">
                  <span>{d.value}</span><span className="tabular-nums font-semibold">{d.count}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
        <AdminCard className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-resma-navy">Emociones registradas (30d)</h3>
          {data.emotion_values.length === 0 ? (
            <p className="text-xs text-slate-400">Sin datos.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {data.emotion_values.map((e) => (
                <span key={e.value} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  {e.value} <span className="tabular-nums text-slate-400">{e.count}</span>
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-500">
            Las etiquetas que no estén en las listas positiva/negativa del esquema no aportan al Balance.
          </p>
        </AdminCard>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone, icon }: { label: string; value: number; sub?: string; tone?: "ok" | "warn"; icon?: React.ReactNode }) {
  const color = tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-resma-navy";
  return (
    <AdminCard className="p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">{icon}{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </AdminCard>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-bold tabular-nums text-resma-navy">{value}</div>
    </div>
  );
}
