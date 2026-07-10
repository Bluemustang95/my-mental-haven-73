import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TestRunner } from "@/components/tests/TestRunner";

type Item = { code: string; name: string; desc: string; color: string };

const INVENTORIES: Item[] = [
  { code: "BDI",       name: "BDI-II",     desc: "Depresión de Beck",       color: "#7cc2c8" },
  { code: "BAI",       name: "BAI",        desc: "Ansiedad de Beck",        color: "#4f46e5" },
  { code: "PSWQ",      name: "PSWQ",       desc: "Preocupación",            color: "#f59e0b" },
  { code: "PHQ-9",     name: "PHQ-9",      desc: "Depresión (screening)",   color: "#0ea5e9" },
  { code: "GAD-7",     name: "GAD-7",      desc: "Ansiedad generalizada",   color: "#8b5cf6" },
  { code: "PSS-10",    name: "PSS-10",     desc: "Estrés percibido",        color: "#ec4899" },
  { code: "Rosenberg", name: "Rosenberg",  desc: "Autoestima",              color: "#10b981" },
];

function label(days: number | null) {
  if (days === null) return "Nunca";
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

export default function InventariosHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lastByCode, setLastByCode] = useState<Record<string, number | null>>({});
  const [activeCode, setActiveCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("test_results")
      .select("test_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(80)
      .then(({ data }) => {
        const map: Record<string, number | null> = {};
        const now = Date.now();
        (data ?? []).forEach((r: any) => {
          const t = String(r.test_type ?? "").toUpperCase();
          for (const it of INVENTORIES) {
            const codeU = it.code.toUpperCase();
            if (map[it.code] !== undefined) continue;
            if (t === codeU || t.startsWith(codeU)) {
              map[it.code] = Math.max(0, Math.floor((now - new Date(r.created_at).getTime()) / 86400000));
            }
          }
        });
        setLastByCode(map);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-[#f9f9fb] pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => navigate(-1)} aria-label="Volver" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif text-[17px] font-medium text-[#0f172a]">Tests e inventarios</h1>
          <p className="text-[11px] text-[#64748b]">Escalas clínicas breves y validadas.</p>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {INVENTORIES.map((it) => {
            const days = lastByCode[it.code] ?? null;
            return (
              <button
                key={it.code}
                onClick={() => setActiveCode(it.code)}
                className="pressable glass-premium relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl p-4 text-left transition"
              >
                <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-40 blur-2xl" style={{ background: it.color }} />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${it.color}25`, color: it.color }}>
                  <ClipboardList size={20} />
                </div>
                <div className="relative">
                  <h3 className="font-display text-[15px] font-bold leading-tight text-[#0f172a]">{it.name}</h3>
                  <p className="mt-0.5 text-[11px] text-[#64748b]">{it.desc}</p>
                  <p className="mt-1.5 text-[10.5px] font-medium" style={{ color: days === null ? "#94a3b8" : it.color }}>
                    Último: {label(days)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeCode && <TestRunner testCode={activeCode} onClose={() => setActiveCode(null)} />}
    </div>
  );
}
