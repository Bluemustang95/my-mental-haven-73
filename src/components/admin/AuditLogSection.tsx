import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, Shield, User, CreditCard } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type AuditEntry = {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  reason: string | null;
  payload: any;
  created_at: string;
};

const ACTION_META: Record<string, { label: string; icon: any; color: string }> = {
  set_plan: { label: "Cambio de plan", icon: CreditCard, color: "text-amber-600 bg-amber-50" },
  grant_admin: { label: "Otorgó admin", icon: Shield, color: "text-emerald-600 bg-emerald-50" },
  revoke_admin: { label: "Revocó admin", icon: Shield, color: "text-rose-600 bg-rose-50" },
};

export function AuditLogSection() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setEntries((data ?? []) as AuditEntry[]);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <ScrollText size={18} />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-800">Log de auditoría</h2>
          <p className="text-xs text-slate-500">
            Últimas 50 acciones administrativas (cambios de plan, roles, etc.).
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Cargando…</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500 ring-1 ring-slate-200">
          Sin actividad administrativa todavía.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => {
            const meta = ACTION_META[e.action] ?? { label: e.action, icon: User, color: "text-slate-600 bg-slate-100" };
            const Icon = meta.icon;
            return (
              <li key={e.id} className="flex items-start gap-3 py-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: es })}
                    {e.target_user_id && (
                      <span className="ml-2 font-mono text-[10px] text-slate-400">
                        → {e.target_user_id.slice(0, 8)}…
                      </span>
                    )}
                  </p>
                  {e.reason && (
                    <p className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] italic text-slate-600">
                      "{e.reason}"
                    </p>
                  )}
                  {e.payload && Object.keys(e.payload).length > 0 && (
                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                      {Object.entries(e.payload)
                        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
