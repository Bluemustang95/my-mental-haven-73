import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain } from "lucide-react";
import { motion } from "framer-motion";

/**
 * PensamientosHub — tema claro alineado con MindfulnessHub.
 * No muestra historial ni contador.
 */
export default function PensamientosHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/herramientas")}
            aria-label="Volver"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Reestructuración cognitiva
          </p>
          <span className="h-10 w-10" />
        </div>

        <div className="mt-5">
          <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Tu mente, observada
          </p>
          <h1 className="mt-1 font-serif text-[26px] font-medium leading-tight text-[#101927]">
            Pensamientos
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            Identificá, evaluá y modificá los pensamientos automáticos.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-md px-5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/diario-inteligente/gestion-pensamientos/pensamientos-automaticos")}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm"
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #7cc2c8, #facb60)" }}
          >
            <Brain size={20} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-semibold text-[#101927]">
              Modificá tus pensamientos
            </div>
            <div className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
              5–10 min · Wizard CBT con IA
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
