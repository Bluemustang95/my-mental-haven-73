import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, ProgressBar, StatCard } from "@/components/admin/ui/AdminPrimitives";
import { Users, CheckCircle2, Crown, TrendingUp, Globe2 } from "lucide-react";

type Stats = {
  total_users?: number;
  onboarding_completed?: number;
  onboarding_in_progress?: number;
  active_7d?: number;
  active_30d?: number;
  premium_users?: number;
  free_users?: number;
  by_country?: { country: string; count: number }[];
  signups_30d?: { date: string; count: number }[];
  top_modules?: { module: string; count: number }[];
  retention?: { d1: number | null; d7: number | null };
};

const palette = ["#7cc2c8", "#facb60", "#6366f1", "#22c55e", "#f97316", "#ec4899", "#101927"];

export default function DashboardGlobal() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    supabase.rpc("admin_stats_overview").then(({ data }) => setStats((data as Stats) ?? null));
  }, []);

  const total = stats?.total_users ?? 0;
  const active = stats?.active_7d ?? 0;
  const checkinRate = total ? Math.round((active / total) * 100) : 0;
  const modules = stats?.top_modules ?? [];
  const maxC = Math.max(1, ...modules.map((m) => m.count));
  const signups = stats?.signups_30d ?? [];
  const countries = (stats?.by_country ?? []).slice(0, 8);
  const totalCountryUsers = countries.reduce((a, b) => a + b.count, 0) || 1;
  const d1 = stats?.retention?.d1 != null ? Math.round(stats.retention.d1 * 100) : null;
  const d7 = stats?.retention?.d7 != null ? Math.round(stats.retention.d7 * 100) : null;

  const sparkPath = useMemo(() => {
    if (!signups.length) return "";
    const w = 600, h = 80;
    const max = Math.max(1, ...signups.map((s) => s.count));
    const step = w / Math.max(1, signups.length - 1);
    return signups
      .map((s, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (s.count / max) * (h - 8) - 4}`)
      .join(" ");
  }, [signups]);

  return (
    <>
      <AdminPageHeader title="Dashboard Global" subtitle="Métricas de uso de la plataforma RESMA+" />
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Usuarios totales" value={total} hint="cuentas creadas" accent="teal" />
          <StatCard label="Activos 7d" value={active} hint={`${checkinRate}% del total`} accent="gold" />
          <StatCard label="Activos 30d" value={stats?.active_30d ?? 0} hint="check-ins último mes" accent="purple" />
          <StatCard label="Premium" value={stats?.premium_users ?? 0} hint={`${stats?.free_users ?? 0} en free`} accent="teal" />
        </div>

        {/* Signups chart */}
        <AdminCard className="mt-6 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-resma-navy flex items-center gap-2">
                <TrendingUp size={16} className="text-resma-teal" /> Altas en los últimos 30 días
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {signups.reduce((a, b) => a + b.count, 0)} nuevas cuentas
              </p>
            </div>
          </div>
          {signups.length === 0 ? (
            <p className="text-xs text-slate-400 py-6">Sin datos suficientes todavía.</p>
          ) : (
            <svg viewBox="0 0 600 80" className="w-full h-20">
              <defs>
                <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7cc2c8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7cc2c8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${sparkPath} L 600 80 L 0 80 Z`} fill="url(#spark)" />
              <path d={sparkPath} stroke="#0e8a92" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </AdminCard>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Modules */}
          <AdminCard className="p-6">
            <h2 className="text-base font-semibold text-resma-navy mb-3">Uso de módulos · 30 días</h2>
            <div className="space-y-3">
              {(modules.length ? modules : [{ module: "Sin datos", count: 0 }]).map((m, i) => (
                <ProgressBar key={m.module} label={`${m.module} · ${m.count}`} value={m.count} max={maxC} color={palette[i % palette.length]} />
              ))}
            </div>
          </AdminCard>

          {/* Countries */}
          <AdminCard className="p-6">
            <h2 className="text-base font-semibold text-resma-navy mb-3 flex items-center gap-2">
              <Globe2 size={16} className="text-resma-teal" /> Distribución geográfica
            </h2>
            {countries.length === 0 ? (
              <p className="text-xs text-slate-400">Sin datos.</p>
            ) : (
              <ul className="space-y-2">
                {countries.map((c, i) => {
                  const pct = Math.round((c.count / totalCountryUsers) * 100);
                  return (
                    <li key={c.country} className="text-sm">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-medium text-resma-navy">{c.country}</span>
                        <span className="text-xs text-slate-500">{c.count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: palette[i % palette.length] }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </div>

        {/* Retention + onboarding */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <AdminCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-resma-teal/10 text-resma-teal flex items-center justify-center"><Users size={18} /></div>
              <div>
                <div className="text-xs text-slate-500">Onboarding completado</div>
                <div className="text-xl font-bold text-resma-navy">{stats?.onboarding_completed ?? 0}</div>
                <div className="text-[10px] text-slate-400">{stats?.onboarding_in_progress ?? 0} en curso</div>
              </div>
            </div>
          </AdminCard>
          <AdminCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><CheckCircle2 size={18} /></div>
              <div>
                <div className="text-xs text-slate-500">Retención D1</div>
                <div className="text-xl font-bold text-resma-navy">{d1 != null ? `${d1}%` : "—"}</div>
                <div className="text-[10px] text-slate-400">vuelven al día siguiente</div>
              </div>
            </div>
          </AdminCard>
          <AdminCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-resma-gold/15 text-amber-700 flex items-center justify-center"><Crown size={18} /></div>
              <div>
                <div className="text-xs text-slate-500">Retención D7</div>
                <div className="text-xl font-bold text-resma-navy">{d7 != null ? `${d7}%` : "—"}</div>
                <div className="text-[10px] text-slate-400">siguen activos la semana siguiente</div>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
