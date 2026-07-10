import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { usePlanContext } from "@/hooks/usePlanContext";

/**
 * Small contextual card shown in ritual step 0 that reminds the user of their
 * plan category and offers a one-tap jump to a suggested tool.
 */
export function PlanContextHint({ variant = "morning" }: { variant?: "morning" | "night" }) {
  const navigate = useNavigate();
  const { categoryContent, suggestedTool, category } = usePlanContext();
  if (!categoryContent || !category) return null;

  const kicker =
    variant === "morning"
      ? `Tu plan: ${categoryContent.subtitle}`
      : `Cerrar el día · ${categoryContent.subtitle}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-5 rounded-2xl border p-3.5 backdrop-blur"
      style={{
        borderColor: `${categoryContent.accent}55`,
        background: `${categoryContent.accent}12`,
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: categoryContent.accent }}
      >
        {kicker}
      </p>
      <p className="mt-1 text-[13px] italic leading-snug text-resma-navy/85">
        {categoryContent.title}
      </p>
      {suggestedTool && (
        <button
          onClick={() => navigate(suggestedTool.route)}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold shadow-sm transition active:scale-95"
          style={{
            background: `${categoryContent.accent}22`,
            color: categoryContent.accent,
          }}
        >
          Ir a {suggestedTool.label}
          <ArrowUpRight className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}
