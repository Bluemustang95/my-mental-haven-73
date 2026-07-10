import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Users, TrendingUp, Activity, Brain, Search } from "lucide-react";

type Global = {
  total_users: number;
  active_7d: number;
  active_30d: number;
  avg_mood_30d: number | null;
  avg_sleep_30d: number | null;
  wellbeing_distribution: { bajo: number; medio: number; alto: number };
  mood_evolution_30d: { date: string; avg: number }[];
  top_modules_30d: { module: string; sessions: number; users: number }[];
  mindfulness_minutes_30d: number;
  habits_created_vs_completed: { created: number; users_with_completions_7d: number };
  tests_by_type_30d: { test: string; count: number }[];
  engagement_wellbeing_corr: number | null;
};

type Patient = { user_id: string; email: string | null; display_name: string | null };

export default function EstadisticasAdmin() {
  const [tab, setTab] = useState<"bienestar" | "uso" | "usuario">("bienestar");
  const [global, setGlobal] = useState<Global | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    supabase.rpc("admin_wellbeing_stats" as any, { _user_id: null }).then(({ data }) => setGlobal(data as any));
    supabase.rpc("admin_list_patients" as any).then(({ data }) => setPatients((data as any) ?? []));
  }, []);

  useEffect(() => {
    if (!selected) { setUserStats(null); return; }
    supabase.rpc("admin_wellbeing_stats" as any, { _user_id: selected.user_id }).then(({ data }) => setUserStats(data));
  }, [selected]);

  const filtered = patients.filter((p) => {
    const s = q.toLowerCase();
    return !s || (p.email ?? "").toLowerCase().includes(s) || (p.display_name ?? "").toLowerCase().includes(s);
  }).slice(0, 30);

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-resma-teal/10 text-resma-teal">
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">Estadísticas</h1>
            <p className="text-xs text-slate-500">Bienestar general, uso de la app y análisis por usuario.</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {([
            { id: "bienestar", label: "Bienestar general" },
            { id: "uso", label: "Uso de la app" },
            { id: "usuario", label: "Por usuario" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t.id ? "bg-resma-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-8">
        {tab === "bienestar" && <BienestarTab g={global} />}
        {tab === "uso" && <UsoTab g={global} />}
        {tab === "usuario" && (
          <UsuarioTab
            q={q} setQ={setQ}
            filtered={filtered}
            selected={selected}
            setSelected={setSelected}
            stats={userStats}
          />
        )}
      </div>
    </div>
  );
}

const COLORS = ["#ef4444", "#facb60", "#7cc2c8"];

function KPI({ icon, label, value, sub }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {icon}{label}
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-800 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function BienestarTab({ g }: { g: Global | null }) {
  if (!g) return <p className="text-slate-500">Cargando…</p>;
  const dist = [
    { name: "Bajo", value: g.wellbeing_distribution.bajo },
    { name: "Medio", value: g.wellbeing_distribution.medio },
    { name: "Alto", value: g.wellbeing_distribution.alto },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={<Users size={13} />} label="Usuarios" value={g.total_users} />
        <KPI icon={<Activity size={13} />} label="Activos 30d" value={g.active_30d} sub={`${g.active_7d} en últimos 7d`} />
        <KPI icon={<Brain size={13} />} label="Ánimo promedio" value={g.avg_mood_30d ?? "—"} sub="30 días" />
        <KPI icon={<TrendingUp size={13} />} label="Correl. uso ↔ bienestar" value={g.engagement_wellbeing_corr ?? "—"} sub="Pearson" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Distribución de bienestar (últimos 30d)</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" outerRadius={80} label>
                  {dist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evolución del ánimo promedio (30d)</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={g.mood_evolution_30d}>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line dataKey="avg" stroke="#7cc2c8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsoTab({ g }: { g: Global | null }) {
  if (!g) return <p className="text-slate-500">Cargando…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KPI icon={<Activity size={13} />} label="Minutos mindfulness (30d)" value={g.mindfulness_minutes_30d} />
        <KPI icon={<TrendingUp size={13} />} label="Hábitos creados" value={g.habits_created_vs_completed.created} sub={`${g.habits_created_vs_completed.users_with_completions_7d} usuarios completaron algún hábito en 7d`} />
        <KPI icon={<Brain size={13} />} label="Tipos de test usados (30d)" value={g.tests_by_type_30d.length} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top módulos (últimos 30 días)</p>
        <div className="h-[300px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={g.top_modules_30d} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="module" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="sessions" fill="#7cc2c8" name="Sesiones" radius={[0, 6, 6, 0]} />
              <Bar dataKey="users" fill="#facb60" name="Usuarios" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tests aplicados (30d)</p>
        <div className="h-[200px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={g.tests_by_type_30d}>
              <CartesianGrid stroke="#f1f5f9" />
              <XAxis dataKey="test" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function UsuarioTab({ q, setQ, filtered, selected, setSelected, stats }: any) {
  return (
    <div className="grid grid-cols-[320px_1fr] gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar paciente…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="mt-3 max-h-[500px] space-y-1 overflow-y-auto">
          {filtered.map((p: Patient) => (
            <button
              key={p.user_id}
              onClick={() => setSelected(p)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                selected?.user_id === p.user_id ? "bg-resma-teal/10 text-resma-teal" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="font-medium truncate">{p.display_name ?? p.email ?? p.user_id}</div>
              {p.display_name && <div className="text-[10px] text-slate-400 truncate">{p.email}</div>}
            </button>
          ))}
        </div>
      </div>

      <div>
        {!selected && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Elegí un paciente para ver sus estadísticas.</div>}
        {selected && !stats && <div className="text-slate-500">Cargando…</div>}
        {selected && stats && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actividad últimos 30 días</p>
              <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
                {Object.entries(stats.activity_30d).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-50 p-3">
                    <div className="text-[10px] uppercase text-slate-400">{k}</div>
                    <div className="font-bold text-slate-800 tabular-nums">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ánimo y sueño (30d)</p>
              <div className="h-[240px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.mood_30d}>
                    <CartesianGrid stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line dataKey="mood" stroke="#7cc2c8" strokeWidth={2} name="Ánimo" />
                    <Line dataKey="sleep" stroke="#facb60" strokeWidth={2} name="Sueño" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tests recientes</p>
              <div className="mt-3 divide-y">
                {(stats.tests ?? []).slice(0, 10).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="font-medium">{t.test_type}</span>
                      <span className="ml-2 text-slate-500">{t.severity}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold tabular-nums">{t.score}</div>
                      <div className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString("es-AR")}</div>
                    </div>
                  </div>
                ))}
                {(!stats.tests || stats.tests.length === 0) && <p className="text-sm text-slate-500 py-2">Sin tests recientes.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
