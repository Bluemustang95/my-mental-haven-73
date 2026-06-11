import type { PhaseId } from "@/lib/breathingPatterns";
import { LottiePlayer } from "@/components/mindfulness/stage/LottiePlayer";
import breath478Animation from "@/assets/lottie/breath-478.json";

interface Props {
  phaseId: PhaseId;
  duration: number;
  isActive: boolean;
}

// 4-7-8: Lottie con cuadrado guía (inhalá / sostené / exhalá).
// Lottie nativo: 480 frames @ 29.97fps ≈ 16s. Ciclo objetivo = 19s. Speed ≈ 0.84.
export function VisualizerSleep({ isActive }: Props) {
  return (
    <div className="relative flex h-[260px] w-[260px] items-center justify-center">
      <LottiePlayer
        data={breath478Animation}
        loop
        speed={isActive ? 0.84 : 0}
        className="h-[260px] w-[260px]"
      />
    </div>
  );
}
