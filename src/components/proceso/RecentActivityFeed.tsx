import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Brain, Heart, Wind, Sun, NotebookPen, Moon, Pill, ClipboardList, Sparkles,
} from "lucide-react";
import { fetchRecentActivity, type RecentActivity, type ActivityKind } from "@/lib/recentActivity";
import { useAuth } from "@/hooks/useAuth";

const ICON: Record<ActivityKind, { Icon: any; tint: string; bg: string }> = {
  thought:    { Icon: Brain,        tint: "#0e8a92", bg: "bg-[#7cc2c8]/15" },
  dbt:        { Icon: Heart,        tint: "#be185d", bg: "bg-pink-100" },
  mindfulness:{ Icon: Wind,         tint: "#4f46e5", bg: "bg-indigo-100" },
  checkin:    { Icon: Sun,          tint: "#b45309", bg: "bg-[#facb60]/25" },
  journal:    { Icon: NotebookPen,  tint: "#7c3aed", bg: "bg-violet-100" },
  sleep:      { Icon: Moon,         tint: "#1e3a8a", bg: "bg-blue-100" },
  medication: { Icon: Pill,         tint: "#0e8a92", bg: "bg-[#7cc2c8]/15" },
  test:       { Icon: ClipboardList,tint: "#0f172a", bg: "bg-slate-200" },
  dream:      { Icon: Sparkles,     tint: "#7c3aed", bg: "bg-violet-100" },
};

export function RecentActivityFeed({ limit = 8 }: { limit?: number }) {
  const { user } = useAuth();
  const [items, setItems] = useState<RecentActivity[] | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchRecentActivity(user.id, limit).then(setItems).catch(() => setItems([]));
  }, [user, limit]);

  if (!user) return null;

  return (
    <div className="rounded-[20px] border border-white/70 bg-white/85 p-3.5 shadow-[0_8px_24px_-18px_rgba(16,25,39,0.22)] backdrop-blur-xl">
      <div className="flex items-center justify-between mb-2.5">
        <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-[#94a3b8]">
          Actividad reciente
        </p>
        {items && <span className="text-[10px] text-[#94a3b8]">{items.length}</span>}
      </div>

      {items === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-[11.5px] text-[#94a3b8]">
          Tus sesiones de las próximas semanas aparecerán acá.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => {
            const { Icon, tint, bg } = ICON[a.kind];
            return (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                  <Icon size={14} style={{ color: tint }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-display text-[12px] font-semibold text-[#0f172a]">
                    {a.title}
                  </p>
                  {a.subtitle && (
                    <p className="truncate text-[10.5px] text-[#64748b]">{a.subtitle}</p>
                  )}
                </div>
                <p className="text-[10px] text-[#94a3b8] shrink-0">
                  {formatDistanceToNow(new Date(a.at), { locale: es, addSuffix: false })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
