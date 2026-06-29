import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Plus, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ThoughtRow = {
  id: string;
  created_at: string;
  situation: string | null;
  emotion: string | null;
  distortion_label: string | null;
};

export default function PensamientosHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recent, setRecent] = useState<ThoughtRow[]>([]);
  const [count7d, setCount7d] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase
        .from("thought_records")
        .select("id, created_at, situation, emotion, distortion_label")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      const rows = (data ?? []) as ThoughtRow[];
      setRecent(rows.slice(0, 5));
      setCount7d(rows.length);
    })();
  }, [user]);

  return (
    <div
      className="relative min-h-screen overflow-hidden pb-32 text-white"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, #14213d 0%, #0a1020 55%, #060912 100%)",
      }}
    >
      {/* Premium ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-[360px] w-[360px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(124,194,200,0.55) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -right-24 h-[300px] w-[300px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(250,203,96,0.5) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative mx-auto max-w-md px-5 pt-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/herramientas")}
            aria-label="Volver"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl transition active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
            Reestructuración cognitiva
          </p>
          <span className="h-10 w-10" />
        </div>

        <div className="mt-5">
          <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
            Tu mente, observada
          </p>
          <h1 className="mt-1 font-serif text-[26px] font-medium leading-tight">
            Pensamientos
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
            Identificá, evaluá y modificá los pensamientos automáticos que te pesan.
          </p>
        </div>

        {/* Stat strip — glass */}
        <div className="relative mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.05] p-3 backdrop-blur-2xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 35%)",
            }}
          />
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7cc2c8] to-[#facb60] shadow-[0_8px_18px_-8px_rgba(124,194,200,0.6)]">
              <Sparkles size={15} className="text-[#101927]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
                Últimos 7 días
              </p>
              <p className="font-serif text-[16px] font-medium leading-tight text-white">
                {count7d} {count7d === 1 ? "registro" : "registros"}
              </p>
            </div>
          </div>
        </div>

        {/* Main module card — premium glass */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/diario-inteligente/gestion-pensamientos/pensamientos-automaticos")}
          className="group relative mt-3 flex w-full items-center gap-3 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.06] p-3.5 text-left backdrop-blur-2xl transition hover:border-white/20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 40%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-2xl"
            style={{ background: "radial-gradient(circle, #facb60 0%, transparent 70%)" }}
          />
          <div
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_10px_22px_-8px_rgba(124,194,200,0.55)]"
            style={{ background: "linear-gradient(135deg, #7cc2c8, #facb60)" }}
          >
            <Brain size={20} className="text-[#101927]" strokeWidth={2.2} />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="font-serif text-[15px] font-medium leading-tight">Modificá tus pensamientos</div>
            <div className="mt-0.5 text-[11px] leading-snug text-white/55">
              5–10 min · Wizard CBT con IA
            </div>
          </div>
          <ChevronRight size={16} className="relative text-white/40 transition group-hover:translate-x-0.5" />
        </motion.button>

        {recent.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
              Tus registros recientes
            </p>
            <div className="space-y-2">
              {recent.map((r) => (
                <div
                  key={r.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-2xl"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 35%)",
                    }}
                  />
                  <p className="relative text-[10px] font-medium uppercase tracking-wide text-white/35">
                    {format(new Date(r.created_at), "EEE d MMM · HH:mm", { locale: es })}
                  </p>
                  <p className="relative mt-1 font-serif text-[13px] leading-snug text-white/90 line-clamp-2">
                    {r.situation ?? "(sin descripción)"}
                  </p>
                  <div className="relative mt-1.5 flex flex-wrap gap-1">
                    {r.emotion && (
                      <span className="rounded-full bg-[#7cc2c8]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7cc2c8]">
                        {r.emotion}
                      </span>
                    )}
                    {r.distortion_label && (
                      <span className="rounded-full bg-[#facb60]/20 px-2 py-0.5 text-[10px] font-semibold text-[#facb60]">
                        {r.distortion_label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => navigate("/diario-inteligente/gestion-pensamientos/pensamientos-automaticos")}
        aria-label="Nuevo registro"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-[#101927] shadow-[0_18px_40px_-12px_rgba(124,194,200,0.6)]"
        style={{ background: "linear-gradient(135deg, #7cc2c8, #facb60)" }}
      >
        <Plus size={24} strokeWidth={2.4} />
      </motion.button>
    </div>
  );
}
