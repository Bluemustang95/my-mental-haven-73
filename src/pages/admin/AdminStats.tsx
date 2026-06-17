import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, UserCheck, Crown, Activity, TrendingUp, Globe } from "lucide-react";

type Overview = {
  total_users: number;
  onboarding_completed: number;
  onboarding_in_progress: number;
  active_7d: number;
  active_30d: number;
  premium_users: number;
  free_users: number;
  by_country: { country: string; count: number }[];
  signups_30d: { date: string; count: number }[];
  top_modules: { module: string; count: number }[];
  retention: { d1: number | null; d7: number | null };
};

const COLORS = ["#6B4EFF", "#E8A365", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899"];

export default function AdminStats() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_stats_overview" as never);
      if (error) setError(error.message);
      else setData(data as unknown as Overview);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Cargando estadísticas…</p>;
  if (error) return <p className="text-sm text-rose-500">Error: {error}</p>;
  if (!data) return null;

  const completionRate =
    data.total_users > 0 ? Math.round((data.onboarding_completed / data.total_users) * 100) : 0;
  const pct = (n: number | null) => (n == null ? "—" : `${Math.round(n * 100)}%`);

  const kpis = [
    { label: "Usuarios totales", value: data.total_users, icon: Users, color: "text-[#6B4EFF]" },
    { label: "Activos 7 días", value: data.active_7d, icon: Activity, color: "text-emerald-500" },
    { label: "Activos 30 días", value: data.active_30d, icon: TrendingUp, color: "text-blue-500" },
    { label: "Premium", value: data.premium_users, icon: Crown, color: "text-amber-500" },
    { label: "Onboarding ✓", value: `${completionRate}%`, icon: UserCheck, color: "text-[#E8A365]" },
    { label: "Países", value: data.by_country.length, icon: Globe, color: "text-pink-500" },
  ];

  const planData = [
    { name: "Free", value: data.free_users },
    { name: "Premium", value: data.premium_users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Estadísticas</h1>
        <p className="text-xs text-slate-500">Visión global de usuarios y uso de la plataforma</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="border-white/60 bg-white/70 backdrop-blur-xl shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{k.label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-slate-800">{k.value}</p>
              </div>
              <k.icon className={`h-6 w-6 ${k.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/60 bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm">Funnel de onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { stage: "Registrados", count: data.total_users },
                  { stage: "Onboarding ✓", count: data.onboarding_completed },
                  { stage: "Activos 7d", count: data.active_7d },
                ]}
              >
                <XAxis dataKey="stage" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#6B4EFF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-around text-[11px] text-slate-500">
              <span>Retención D1: <b className="text-slate-800">{pct(data.retention.d1)}</b></span>
              <span>Retención D7: <b className="text-slate-800">{pct(data.retention.d7)}</b></span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm">Distribución de planes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" outerRadius={75} label>
                  <Cell fill="#94A3B8" />
                  <Cell fill="#E8A365" />
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/70 backdrop-blur-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Nuevos registros (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.signups_30d}>
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6B4EFF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm">Top módulos (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.top_modules} layout="vertical">
                <XAxis type="number" fontSize={10} />
                <YAxis type="category" dataKey="module" fontSize={11} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#E8A365" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm">Distribución por país</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.by_country.slice(0, 10)} layout="vertical">
                <XAxis type="number" fontSize={10} />
                <YAxis type="category" dataKey="country" fontSize={11} width={110} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {data.by_country.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
