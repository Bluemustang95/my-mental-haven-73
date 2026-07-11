import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, DollarSign, Zap, AlertTriangle, TrendingUp, Users } from "lucide-react";

type Analytics = {
  window_days: number;
  total_events: number;
  sessions: number;
  unique_users: number;
  total_cost_usd: number;
  total_tokens: number;
  error_count: number;
  consent_granted: number;
  consent_declined: number;
  latency_p50_ms: number | null;
  latency_p95_ms: number | null;
  top_routes: Array<{ route: string; screen: string | null; sessions: number }>;
  daily: Array<{ date: string; sessions: number; cost: number }>;
  action_click_rate: number | null;
};

export default function ResmitaAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.rpc("admin_resmita_analytics" as any, { _days: days }).then(({ data }) => {
      setData(data as Analytics);
      setLoading(false);
    });
  }, [days]);

  return (
    <div className="h-full overflow-y-auto bg-[#f4f7f9] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-[#101927]">
              <MessageCircle className="h-6 w-6 text-resma-teal" /> Uso de Resmita
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Analítica del asistente flotante: sesiones, pantallas, costos y errores.
            </p>
          </div>
          <div className="flex rounded-xl bg-white p-1 shadow-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  days === d ? "bg-[#101927] text-white" : "text-[#101927]/60"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {loading || !data ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon={Users} label="Usuarios únicos" value={data.unique_users} />
              <Stat icon={MessageCircle} label="Sesiones" value={data.sessions} />
              <Stat icon={DollarSign} label="Costo (USD)" value={`$${Number(data.total_cost_usd || 0).toFixed(4)}`} />
              <Stat icon={Zap} label="Tokens totales" value={(data.total_tokens || 0).toLocaleString()} />
              <Stat icon={TrendingUp} label="Latencia p50" value={data.latency_p50_ms ? `${Math.round(data.latency_p50_ms)} ms` : "—"} />
              <Stat icon={TrendingUp} label="Latencia p95" value={data.latency_p95_ms ? `${Math.round(data.latency_p95_ms)} ms` : "—"} />
              <Stat icon={AlertTriangle} label="Errores" value={data.error_count} tint={data.error_count > 0 ? "#ef4444" : undefined} />
              <Stat icon={Zap} label="Tasa de acciones" value={data.action_click_rate != null ? `${data.action_click_rate}%` : "—"} />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Consentimiento de contexto</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{data.consent_granted}</p>
                      <p className="text-xs text-muted-foreground">Aceptaron</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-500">{data.consent_declined}</p>
                      <p className="text-xs text-muted-foreground">Rechazaron</p>
                    </div>
                    {data.consent_granted + data.consent_declined > 0 && (
                      <div className="ml-auto">
                        <p className="text-2xl font-bold text-[#7cc2c8]">
                          {Math.round(100 * data.consent_granted / (data.consent_granted + data.consent_declined))}%
                        </p>
                        <p className="text-xs text-muted-foreground">Aceptación</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Actividad diaria</CardTitle></CardHeader>
                <CardContent>
                  {data.daily.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin datos en la ventana.</p>
                  ) : (
                    <div className="flex items-end gap-1 h-24">
                      {data.daily.map((d) => {
                        const max = Math.max(...data.daily.map((x) => x.sessions), 1);
                        const h = Math.max(4, (d.sessions / max) * 90);
                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-t bg-[#7cc2c8]" style={{ height: `${h}px` }} title={`${d.sessions} sesiones · $${d.cost}`} />
                            <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader><CardTitle className="text-sm">Pantallas más consultadas</CardTitle></CardHeader>
              <CardContent>
                {data.top_routes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin datos.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-2">Ruta</th>
                        <th>Pantalla</th>
                        <th className="text-right">Sesiones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_routes.map((r) => (
                        <tr key={r.route} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">{r.route}</td>
                          <td className="text-xs">{r.screen ?? "—"}</td>
                          <td className="text-right font-semibold">{r.sessions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint }: { icon: any; label: string; value: any; tint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4" style={{ color: tint ?? "#7cc2c8" }} />
        </div>
        <p className="mt-1 font-display text-xl font-bold" style={tint ? { color: tint } : undefined}>{value}</p>
      </CardContent>
    </Card>
  );
}
