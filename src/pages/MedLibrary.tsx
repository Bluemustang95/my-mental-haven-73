import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Brain, Shield, Moon, Zap, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { id: "antidepresivos", label: "Antidepresivos", desc: "Regulan el estado de ánimo", icon: Brain, color: "bg-[hsl(var(--mood-2))]/15" },
  { id: "ansioliticos", label: "Ansiolíticos", desc: "Reducen la ansiedad", icon: Shield, color: "bg-[hsl(var(--mood-3))]/15" },
  { id: "estabilizadores", label: "Estabilizadores del ánimo", desc: "Equilibran las emociones", icon: Heart, color: "bg-[hsl(var(--mood-5))]/15" },
  { id: "antipsicoticos", label: "Antipsicóticos", desc: "Regulan el pensamiento", icon: Sparkles, color: "bg-[hsl(var(--accent))]/15" },
  { id: "hipnoticos", label: "Hipnóticos / Para dormir", desc: "Mejoran el descanso", icon: Moon, color: "bg-[hsl(var(--secondary))]/15" },
  { id: "estimulantes", label: "Estimulantes (TDAH)", desc: "Mejoran la concentración", icon: Zap, color: "bg-[hsl(var(--mood-4))]/15" },
];

export default function MedLibrary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as "add" | "info") ?? "info";

  return (
    <div className="px-5 pt-14 pb-28 safe-area-top bg-[hsl(var(--background))]">
      <button onClick={() => navigate("/mi-proceso/medicacion")} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Medicación
      </button>
      <h1 className="mb-1 font-display text-xl font-semibold">
        {mode === "add" ? "Agregar medicación" : "Tipo de medicamentos"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {mode === "add" ? "Elegí la categoría de tu medicamento." : "Información sobre psicofármacos comunes."}
      </p>

      <div className="space-y-3">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/mi-proceso/medicacion/biblioteca/${cat.id}?mode=${mode}`)}
              className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] active:bg-muted transition-colors"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cat.color}`}>
                <Icon size={20} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-medium">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.desc}</p>
              </div>
              <ArrowLeft size={14} className="text-muted-foreground rotate-180" />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-[hsl(var(--accent))]/5 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          ⚠️ <strong>Aviso importante:</strong> Esta información es educativa. No modifiques tu medicación sin consultarlo con tu psiquiatra.
        </p>
      </div>
    </div>
  );
}
