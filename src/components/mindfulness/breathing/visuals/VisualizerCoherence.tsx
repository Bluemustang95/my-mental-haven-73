import { motion } from "framer-motion";
import type { PhaseId } from "@/lib/breathingPatterns";
import { LottiePlayer } from "@/components/mindfulness/stage/LottiePlayer";
import coherenceAnimation from "@/assets/lottie/breath-coherence-55.json";

interface Props {
  phaseId: PhaseId;
  duration: number;
  isActive: boolean;
}

// Coherencia 5-5: Lottie con halo respirante.
// Lottie nativo: 1140 frames @ 60fps = 19s. Ciclo objetivo = 10s. Speed ≈ 1.9.
export function VisualizerCoherence({ phaseId, duration, isActive }: Props) {
  const scale = phaseId === "inhale" ? 1.15 : 1;

  return (
    <div className="relative flex h-[260px] w-[260px] items-center justify-center">
      <motion.div
        className="absolute h-[220px] w-[220px] rounded-full bg-teal-400/20 blur-3xl"
        animate={{ scale: scale * 1.1 }}
        transition={{ duration, ease: "easeInOut" }}
      />
      <LottiePlayer
        data={coherenceAnimation}
        loop
        speed={isActive ? 1.9 : 0}
        className="h-[260px] w-[260px]"
      />
    </div>
  );
}
