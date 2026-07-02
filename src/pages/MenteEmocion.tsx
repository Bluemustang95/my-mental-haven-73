import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import PensamientosRecentHistory from "@/components/pensamientos/RecentHistory";

/**
 * Hub "Mente & Emoción" — agrupa Pensamientos (CBT) y Regulación Emocional (DBT)
 * en el mismo estilo claro que el hub de Mindfulness.
 */
export default function MenteEmocion() {
  const navigate = useNavigate();

  const modules = [
    {
      to: "/diario-inteligente/gestion-pensamientos/pensamientos-automaticos",
      icon: Brain,
      title: "Modificá tus pensamientos",
      desc: "5–10 min · Wizard CBT con IA",
      from: "#7cc2c8",
      to2: "#facb60",
    },
    {
      to: "/herramientas/regulacion-dbt",
      icon: HeartPulse,
      title: "Regulá tus emociones",
      desc: "5–8 min · Ficha DBT guiada",
      from: "#F472B6",
      to2: "#A78BFA",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/herramientas")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            aria-label="Volver"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Mente & Emoción
          </p>
          <span className="h-10 w-10" />
        </div>

        <div className="mt-5">
          <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Dos caminos
          </p>
          <h1 className="mt-1 font-serif text-[26px] font-medium leading-tight text-[#101927]">
            Mente & Emoción
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            Trabajá pensamientos y emociones con herramientas clínicas.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-md space-y-2 px-5">
        {modules.map((m) => (
          <motion.button
            key={m.to}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(m.to)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to2})` }}
            >
              <m.icon size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-base font-semibold text-[#101927]">{m.title}</div>
              <div className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                {m.desc}
              </div>
            </div>
          </motion.button>
        ))}
        <PensamientosRecentHistory />
      </div>
    </div>
  );
}
