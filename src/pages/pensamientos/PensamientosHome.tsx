import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const MODULES = [
  {
    slug: "pensamientos-automaticos",
    title: "Pensamientos Automáticos",
    desc: "Detectá tus creencias disfóricas, ponelas a prueba frente a los hechos objetivos y decidí si requerís un cambio mental o conductual.",
    chip: "Modelo CBT",
    icon: (
      <div className="h-10 w-10 rounded-xl bg-[#7cc2c8]/20 flex items-center justify-center">
        <span className="text-xl">🎈</span>
      </div>
    ),
  },
  {
    slug: "arbol-preocupacion",
    title: "Árbol de la Preocupación",
    desc: "Discerní de manera efectiva entre rumiaciones controlables y problemas de la realidad externa sobre los que no tenés acción hoy.",
    chip: "Worry Tree",
    icon: (
      <div className="h-10 w-10 rounded-xl bg-[#facb60]/25 flex items-center justify-center">
        <span className="font-serif text-xl font-bold text-[#92561a]">T</span>
      </div>
    ),
  },
];

export default function PensamientosHome() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f9f9fb_0%,#f2f4f8_100%)] pb-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-[#7cc2c8] opacity-[0.22] blur-[100px] animate-[orb-float_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-[#facb60] opacity-[0.20] blur-[100px] animate-[orb-float-2_18s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[480px] px-5 pt-12">
        <div className="sticky top-0 -mx-5 px-5 pb-3 pt-2 backdrop-blur-[18px] bg-white/40 border-b border-white/40 -mt-2">
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-8px_rgba(16,25,39,0.18)] active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#101927]/45">
                Workspace
              </p>
              <h1 className="font-serif text-[20px] leading-tight font-bold text-[#101927]">
                Gestión de Pensamientos
              </h1>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">
            Cognición y Procesos
          </p>
          <h2 className="mt-2 font-serif text-[34px] leading-tight font-bold text-[#101927]">
            ¿Qué abordamos hoy?
          </h2>
          <p className="mt-2 text-sm text-[#101927]/65">
            Seleccioná un espacio de trabajo estructurado.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {MODULES.map((m) => (
            <motion.button
              key={m.slug}
              whileTap={{ scale: 0.985 }}
              onClick={() =>
                m.slug === "pensamientos-automaticos"
                  ? navigate(`/diario-inteligente/gestion-pensamientos/${m.slug}`)
                  : null
              }
              className="block w-full rounded-[28px] border border-white/60 bg-white/45 backdrop-blur-[28px] [backdrop-filter:saturate(180%)_blur(28px)] p-5 text-left shadow-[0_10px_30px_-10px_rgba(16,25,39,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                {m.icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/50 pt-1">
                  {m.chip}
                </span>
              </div>
              <h3 className="mt-6 font-serif text-2xl font-bold text-[#101927]">
                {m.title}
              </h3>
              <p className="mt-2 text-sm text-[#101927]/65 leading-relaxed">
                {m.desc}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
