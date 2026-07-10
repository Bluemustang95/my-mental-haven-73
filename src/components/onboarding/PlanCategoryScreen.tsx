import { motion } from "framer-motion";
import { ArrowRight, Moon, Wind, Heart, Sparkles, Compass, Orbit } from "lucide-react";
import {
  CATEGORY_CONTENT,
  TOOL_META,
  type PlanCategory,
  type ToolModule,
} from "@/lib/onboardingAlgorithm";
import { GlassPrimaryButton, StickyFooter } from "@/components/onboarding/OnboardingShell";

const INK = "#101927";

const ICONS = {
  moon: Moon,
  wind: Wind,
  heart: Heart,
  spark: Sparkles,
  compass: Compass,
  orbit: Orbit,
} as const;

export function PlanCategoryScreen({
  category,
  top3,
  onContinue,
}: {
  category: PlanCategory;
  top3: ToolModule[];
  onContinue: () => void;
}) {
  const content = CATEGORY_CONTENT[category];
  const Icon = ICONS[content.icon];

  return (
    <div className="flex flex-1 flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full shadow-[0_12px_30px_-12px_rgba(16,25,39,0.35)]"
        style={{
          background: `linear-gradient(135deg, ${content.accent}33, ${content.accent}cc)`,
          color: "#fff",
        }}
      >
        <Icon size={36} strokeWidth={1.7} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.22em]"
        style={{ color: content.accent }}
      >
        {content.subtitle}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-1 text-center font-display text-[26px] font-semibold leading-tight"
        style={{ color: INK }}
      >
        {content.title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-center text-[13px] leading-relaxed"
        style={{ color: "rgba(16,25,39,0.65)" }}
      >
        {content.description}
      </motion.p>

      {top3.length > 0 && (
        <div className="mt-6">
          <p
            className="text-center text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "rgba(16,25,39,0.45)" }}
          >
            Tus tres herramientas iniciales
          </p>
          <div className="mt-3 space-y-2">
            {top3.map((mod, i) => (
              <motion.div
                key={mod}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="flex items-center gap-3 rounded-2xl border bg-white/75 px-4 py-3 shadow-glass backdrop-blur-xl"
                style={{ borderColor: "rgba(16,25,39,0.08)" }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: `${content.accent}22`,
                    color: content.accent,
                  }}
                >
                  {i + 1}
                </span>
                <p className="flex-1 text-[13.5px] font-semibold" style={{ color: INK }}>
                  {TOOL_META[mod].label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <StickyFooter>
        <GlassPrimaryButton onClick={onContinue}>
          Crear mi cuenta <ArrowRight className="h-4 w-4" />
        </GlassPrimaryButton>
      </StickyFooter>
    </div>
  );
}
