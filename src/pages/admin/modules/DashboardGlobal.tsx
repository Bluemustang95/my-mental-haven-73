import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, ProgressBar, StatCard } from "@/components/admin/ui/AdminPrimitives";
import { Users, CheckCircle2, Timer } from "lucide-react";

export default function DashboardGlobal() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    supabase.rpc("admin_stats_overview").then(({ data }) => setStats(data));
  }, []);

  const active = stats?.active_7d ?? 0;
  const total = stats?.total_users ?? 0;
  const checkinRate = total ? Math.round((active / total) * 100) : 0;
  const modules: { module: string; count: number }[] = stats?.top_modules ?? [];
  const maxC = Math.max(1, ...modules.map((m) => m.count));
  const colors = ["#7cc2c8", "#facb60", "#6366f1", "#101927", "#22c55e", "#f97316", "#ec4899"];

  return (
    <>
      <AdminPageHeader title="Dashboard Global" subtitle="Métricas de uso de la plataforma RESMA+" />
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Usuarios Activos (7d)" value={active} hint={`de ${total} totales`} accent="teal" />
          <StatCard label="Tasa de Check-in" value={`${checkinRate}%`} hint="últimos 7 días" accent="gold" />
          <StatCard label="Tiempo en App" value="14:32" hint="promedio diario (min)" accent="purple" />
        </div>

        <AdminCard className="mt-6 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-resma-navy">Uso de Módulos Clínicos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Últimos 30 días</p>
            </div>
          </div>
          <div className="space-y-4">
            {(modules.length ? modules : [
              { module: "Diario", count: 0 },
              { module: "Check-ins", count: 0 },
              { module: "Pensamientos", count: 0 },
            ]).map((m, i) => (
              <ProgressBar key={m.module} label={`${m.module} · ${m.count}`} value={m.count} max={maxC} color={colors[i % colors.length]} />
            ))}
          </div>
        </AdminCard>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <AdminCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-resma-teal/10 text-resma-teal flex items-center justify-center"><Users size={18} /></div>
              <div>
                <div className="text-xs text-slate-500">Onboarding completado</div>
                <div className="text-xl font-bold text-resma-navy">{stats?.onboarding_completed ?? 0}</div>
              </div>
            </div>
          </AdminCard>
          <AdminCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-resma-gold/15 text-amber-700 flex items-center justify-center"><CheckCircle2 size={18} /></div>
              <div>
                <div className="text-xs text-slate-500">Premium activos</div>
                <div className="text-xl font-bold text-resma-navy">{stats?.premium_users ?? 0}</div>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
