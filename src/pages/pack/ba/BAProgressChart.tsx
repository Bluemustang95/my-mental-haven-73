import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/pack/GlassCard";

export function BAProgressChart({ programId }: { programId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<{ day: string; dominio: number; agrado: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: logs } = await supabase
        .from("ba_day_logs" as any)
        .select("day, dominio, agrado")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .order("day", { ascending: true });
      const rows = (logs ?? [])
        .filter((l: any) => l.dominio != null || l.agrado != null)
        .map((l: any) => ({
          day: `Día ${l.day}`,
          dominio: l.dominio ?? 0,
          agrado: l.agrado ?? 0,
        }));
      setData(rows);
      setLoading(false);
    })();
  }, [user, programId]);

  if (loading) return null;
  if (data.length === 0) return null;

  const avgD = (data.reduce((a, b) => a + b.dominio, 0) / data.length).toFixed(1);
  const avgA = (data.reduce((a, b) => a + b.agrado, 0) / data.length).toFixed(1);

  return (
    <GlassCard className="mt-6 p-5">
      <p className="font-display text-[10px] font-bold uppercase tracking-widest text-[#facb60]">
        Tu evolución
      </p>
      <h3 className="mt-1 font-mindful text-xl">Dominio y Agrado</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#facb60]/15 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a6a13]">
            Dominio promedio
          </p>
          <p className="mt-0.5 font-display text-xl font-bold text-[#8a6a13]">{avgD}</p>
        </div>
        <div className="rounded-xl bg-[#7cc2c8]/15 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#2c6b70]">
            Agrado promedio
          </p>
          <p className="mt-0.5 font-display text-xl font-bold text-[#2c6b70]">{avgA}</p>
        </div>
      </div>
      <div className="mt-4 h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="rgba(16,25,39,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#101927" fontSize={10} tickMargin={6} />
            <YAxis domain={[0, 10]} stroke="#101927" fontSize={10} />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid rgba(16,25,39,0.1)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="dominio"
              name="Dominio"
              stroke="#facb60"
              strokeWidth={3}
              dot={{ r: 4, fill: "#facb60" }}
            />
            <Line
              type="monotone"
              dataKey="agrado"
              name="Agrado"
              stroke="#7cc2c8"
              strokeWidth={3}
              dot={{ r: 4, fill: "#7cc2c8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
