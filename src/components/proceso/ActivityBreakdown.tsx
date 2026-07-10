import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loadActivity, type ActivityBreakdown as B, type Range } from "@/lib/activityAggregator";

export function ActivityBreakdown({ range, mode }: { range: Range | null; mode: "week" | "month" }) {
  const { user } = useAuth();
  const [b, setB] = useState<B | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !range) return;
    loadActivity(user.id, range).then(setB);
  }, [user, range]);

  const rows: { label: string; value: string }[] = b ? [
    { label: "Check-ins", value: `${b.checkins}` },
    { label: "Diario", value: `${b.journal}` },
    { label: "Pensamientos (CBT)", value: `${b.thoughts}` },
    { label: "Regulación DBT", value: `${b.dbt}` },
    { label: "Mindfulness / respiración", value: `${b.mindfulnessMin} min` },
    { label: "Hábitos completados", value: `${b.habitCompletions}` },
    { label: "Días del Pack", value: `${b.packDays}` },
    { label: "Reflexiones semanales", value: `${b.reflections}` },
    ...(b.medsTotal > 0 ? [{ label: "Medicación tomada", value: `${b.medsTaken}/${b.medsTotal}` }] : []),
  ] : [];

  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full rounded-2xl bg-[#f8fafc] p-4 text-left transition active:scale-[0.995]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7cc2c8]/20 text-[#3d8a90]">
          <Activity size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-[#0f172a]">
            {b?.total ?? "—"} actividad{b?.total === 1 ? "" : "es"} este {mode === "week" ? "período" : "mes"}
          </p>
          <p className="text-[11px] text-[#64748b]">Tocá para ver el desglose</p>
        </div>
        {open ? <ChevronUp size={16} className="text-[#94a3b8]" /> : <ChevronDown size={16} className="text-[#94a3b8]" />}
      </div>
      {open && b && (
        <div className="mt-3 divide-y divide-[#e2e8f0]/70 border-t border-[#e2e8f0]/70 pt-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-2 text-[12.5px]">
              <span className="text-[#334155]">{r.label}</span>
              <span className="font-semibold tabular-nums text-[#0f172a]">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
