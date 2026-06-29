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
    <div className="relative min-h-screen overflow-hidden bg-[#0b1320] pb-32 text-white">
      {/* Ambient AMOLED blobs */}
      <div
        className="glow-blob animate-blob-a"
        style={{ top: -120, left: -80, width: 320, height: 320, background: "radial-gradient(circle, #7cc2c8 0%, transparent 70%)" }}
      />
      <div
        className="glow-blob animate-blob-b"
        style={{ top: 180, right: -100, width: 280, height: 280, background: "radial-gradient(circle, #facb60 0%, transparent 70%)", opacity: 0.25 }}
      />

      <div className="relative px-5 pt-12">
        <button
          onClick={() => navigate("/herramientas")}
          aria-label="Volver"
          className="pressable mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl"
        >
          <ArrowLeft size={18} />
        </button>

        <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
          Reestructuración cognitiva
        </p>
        <h1 className="mt-1 font-serif text-[34px] leading-[1.05] font-bold">Pensamientos</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-white/55">
          Identificá, evaluá y modificá los pensamientos automáticos que te pesan.
        </p>

        {/* Stat strip */}
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7cc2c8] to-[#facb60]">
            <Sparkles size={16} className="text-[#101927]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">Últimos 7 días</p>
            <p className="font-serif text-[18px] font-semibold leading-tight">
              {count7d} {count7d === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>
      </div>

      {/* Main module card */}
      <div className="relative mt-5 px-5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/diario-inteligente/gestion-pensamientos/pensamientos-automaticos")}
          className="group relative flex w-full items-center gap-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-left backdrop-blur-xl"
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #7cc2c8, #facb60)" }}
          >
            <Brain size={22} className="text-[#101927]" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-serif text-[17px] font-semibold leading-tight">Modificá tus pensamientos</div>
            <div className="mt-0.5 text-[11.5px] leading-snug text-white/55">
              5–10 min · Wizard CBT con IA
            </div>
          </div>
          <ChevronRight size={18} className="text-white/35 transition group-hover:translate-x-0.5" />
        </motion.button>
      </div>

      {recent.length > 0 && (
        <div className="relative mt-7 px-5">
          <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
            Tus registros recientes
          </p>
          <div className="space-y-2">
            {recent.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-white/8 bg-white/[0.035] p-3 backdrop-blur-xl"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/35">
                  {format(new Date(r.created_at), "EEE d MMM · HH:mm", { locale: es })}
                </p>
                <p className="mt-1 font-serif text-[13.5px] leading-snug text-white/90 line-clamp-2">
                  {r.situation ?? "(sin descripción)"}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
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
