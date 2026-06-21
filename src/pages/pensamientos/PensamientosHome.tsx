import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

type Tile = {
  emoji: string;
  title: string;
  subtitle: string;
  active: boolean;
  accent?: string;
  onClick?: () => void;
};

export default function PensamientosHome() {
  const navigate = useNavigate();

  const tiles: Tile[] = [
    { emoji: "🍃", title: "Mindfulness", subtitle: "Respiración consciente.", active: false },
    { emoji: "❤️", title: "Regulación Emocional", subtitle: "Habilidades STOP y TIP.", active: false },
    {
      emoji: "🧠",
      title: "Pensamientos",
      subtitle: "Wizard de CBT.",
      active: true,
      accent: "#7cc2c8",
      onClick: () => navigate("/diario-inteligente/gestion-pensamientos/pensamientos-automaticos"),
    },
    {
      emoji: "⚡",
      title: "Hábitos",
      subtitle: "Habit Tracker.",
      active: true,
      accent: "#facb60",
      onClick: () => navigate("/diario-inteligente/gestion-pensamientos/habitos"),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f9f9fb_0%,#f2f4f8_100%)] pb-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-[#7cc2c8] opacity-[0.22] blur-[100px] animate-[orb-float_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-[#facb60] opacity-[0.20] blur-[100px] animate-[orb-float-2_18s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[480px] px-5 pt-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-8px_rgba(16,25,39,0.18)] active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#101927]/45">Workspace</p>
            <h1 className="font-serif text-[20px] leading-tight font-bold text-[#101927]">Gestión de Pensamientos</h1>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-[34px] leading-tight font-bold text-[#101927]">Recursos</h2>
          <p className="mt-1 text-sm text-[#101927]/60">Elegí el camino de hoy.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {tiles.map((t) => (
            <motion.button
              key={t.title}
              whileTap={t.active ? { scale: 0.97 } : undefined}
              onClick={t.onClick}
              disabled={!t.active}
              className={`aspect-square rounded-[28px] border border-white/60 bg-white/55 p-4 text-left shadow-[0_10px_30px_-12px_rgba(16,25,39,0.08)] backdrop-blur-[28px] [backdrop-filter:saturate(180%)_blur(28px)] transition ${
                t.active ? "" : "opacity-60"
              } ${t.accent ? `ring-1 ring-[${t.accent}]/30` : ""}`}
              style={t.accent ? { boxShadow: `0 10px 30px -12px ${t.accent}40` } : undefined}
            >
              <div className="flex h-full flex-col justify-between">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <h3 className="font-serif text-[19px] font-bold leading-tight text-[#101927]">{t.title}</h3>
                  <p
                    className="mt-1 text-[12px] font-semibold"
                    style={{ color: t.active && t.accent ? t.accent : "#101927aa" }}
                  >
                    {t.subtitle}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-[#7cc2c8]/30 bg-white/70 p-5 shadow-[0_10px_30px_-12px_rgba(16,25,39,0.08)] backdrop-blur-[28px]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7cc2c8]">Módulo activo</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7cc2c8]/15 text-[#7cc2c8]">◎</span>
          </div>
          <h3 className="mt-3 font-serif text-[24px] font-bold text-[#101927]">Pack de Actividades</h3>
          <p className="mt-2 text-sm text-[#101927]/65 leading-relaxed">
            Herramientas cognitivas avanzadas para reestructurar distorsiones, detener rumiaciones y planificar conducta.
          </p>
        </div>
      </div>
    </div>
  );
}
