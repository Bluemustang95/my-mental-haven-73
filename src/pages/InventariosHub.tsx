import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TestRunner } from "@/components/tests/TestRunner";

type Status = "ok" | "due" | "never";

const STATUS_DOT: Record<Status, string> = { ok: "#34d399", due: "#facb60", never: "#fbbf24" };
const STATUS_TEXT: Record<Status, string> = { ok: "✓ Al día", due: "Toca actualizar", never: "Pendiente" };

const GRADIENTS = [
  "linear-gradient(135deg,#7cc2c8 0%,#5fa8af 100%)",
  "linear-gradient(135deg,#4f46e5 0%,#3b32c0 100%)",
  "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
  "linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)",
  "linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)",
  "linear-gradient(135deg,#ec4899 0%,#be185d 100%)",
  "linear-gradient(135deg,#10b981 0%,#047857 100%)",
];

type Item = { code: string; label: string; title: string; gradient: string; art: React.ReactNode };

function statusFromDays(days: number | null): { status: Status; recency: string } {
  if (days === null) return { status: "never", recency: "Nunca" };
  if (days <= 7) return { status: "ok", recency: days === 0 ? "Hoy" : `Hace ${days} día${days > 1 ? "s" : ""}` };
  return { status: "due", recency: `Hace ${days} días` };
}

export default function InventariosHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [lastByCode, setLastByCode] = useState<Record<string, number | null>>({});
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("test_definitions" as any)
      .select("code,name,kind,active,sort")
      .eq("kind", "symptom")
      .eq("active", true)
      .order("sort")
      .then(({ data }) => {
        const arts = [<ArtBars key="b" />, <ArtSine key="s" />, <ArtSpiral key="sp" />];
        const rows = (data as any[]) ?? [];
        setItems(
          rows.map((r, i) => ({
            code: r.code,
            label: r.code,
            title: r.name,
            gradient: GRADIENTS[i % GRADIENTS.length],
            art: arts[i % arts.length],
          })),
        );
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user || items.length === 0) return;
    supabase
      .from("test_results")
      .select("test_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(120)
      .then(({ data }) => {
        const map: Record<string, number | null> = {};
        const now = Date.now();
        (data ?? []).forEach((r: any) => {
          const t = String(r.test_type ?? "").toUpperCase();
          for (const it of items) {
            const codeU = it.code.toUpperCase();
            if (map[it.code] !== undefined) continue;
            if (t === codeU || t.startsWith(codeU)) {
              map[it.code] = Math.max(0, Math.floor((now - new Date(r.created_at).getTime()) / 86400000));
            }
          }
        });
        setLastByCode(map);
      });
  }, [user, items]);

  return (
    <div className="min-h-screen bg-[#f9f9fb] pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => navigate("/herramientas")} aria-label="Volver" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif text-[17px] font-medium text-[#0f172a]">Tests e inventarios</h1>
          <p className="text-[11px] text-[#64748b]">Escalas clínicas breves y validadas.</p>
        </div>
      </header>

      <div className="mx-auto max-w-md px-5 pt-5">
        <p className="mb-2.5 font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-[#7cc2c8]">
          Evaluaciones y psicometría
        </p>

        {loading ? (
          <div className="py-16 text-center text-[13px] text-[#64748b]">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[#e2e8f0] bg-white/60 p-8 text-center text-[12.5px] leading-relaxed text-[#64748b]">
            Aún no hay inventarios cargados. Pedile al admin que agregue tests desde el panel.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((it) => {
              const { status, recency } = statusFromDays(lastByCode[it.code] ?? null);
              return (
                <motion.button
                  key={it.code}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveCode(it.code)}
                  className="relative h-44 shrink-0 overflow-hidden rounded-[20px] p-3 text-left text-white shadow-[0_10px_24px_-14px_rgba(16,25,39,0.4)]"
                  style={{ background: it.gradient }}
                >
                  <div className="absolute inset-0 opacity-90">{it.art}</div>
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-end">
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider backdrop-blur-md">
                        {it.label}
                      </span>
                    </div>
                    <div>
                      <p className="font-serif text-[14px] font-medium leading-tight drop-shadow">{it.title}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-white/85">
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[status] }} />
                        <span>{STATUS_TEXT[status]} · {recency}</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {activeCode && <TestRunner testCode={activeCode} onClose={() => setActiveCode(null)} />}
    </div>
  );
}

function ArtBars() {
  const heights = [60, 48, 36, 28, 36, 52, 70];
  return (
    <svg viewBox="0 0 176 224" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bars-g-inv" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.40)" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <rect key={i} x={14 + i * 22} y={180 - h} width={12} height={h} rx={5} fill="url(#bars-g-inv)" />
      ))}
    </svg>
  );
}

function ArtSine() {
  let d = "M 0 112";
  for (let x = 0; x <= 176; x += 4) {
    const t = x / 176;
    const chaos = (1 - t) * 22 * Math.sin(x * 0.45 + Math.cos(x * 0.13));
    const harmony = t * 14 * Math.sin(x * 0.12);
    d += ` L ${x} ${112 + chaos + harmony}`;
  }
  return (
    <svg viewBox="0 0 176 224" className="h-full w-full" preserveAspectRatio="none">
      <path d={d} stroke="rgba(255,255,255,0.55)" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <path d={d} stroke="rgba(255,255,255,0.18)" strokeWidth={6} fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ArtSpiral() {
  const cx = 92, cy = 120;
  let d = `M ${cx} ${cy}`;
  for (let i = 0; i < 360; i += 6) {
    const a = (i * Math.PI) / 180;
    const r = 2 + i * 0.18;
    d += ` L ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  }
  return (
    <svg viewBox="0 0 176 224" className="h-full w-full" preserveAspectRatio="none">
      <path d={d} stroke="rgba(255,255,255,0.55)" strokeWidth={1.4} fill="none" />
    </svg>
  );
}
