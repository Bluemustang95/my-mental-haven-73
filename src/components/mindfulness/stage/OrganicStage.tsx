import { ReactNode, useEffect, useState } from "react";
import { PaperBackground } from "./PaperBackground";
import { InkAtmosphere } from "./InkAtmosphere";
import { Particles } from "./Particles";

interface Props {
  children: ReactNode;
  /** 0..1 breath driver (optional) — pulses the atmosphere with the user */
  breath?: number;
  /** breath transition duration in seconds */
  breathDuration?: number;
  baseColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  particleColor?: string;
  particleCount?: number;
  showParticles?: boolean;
}

/**
 * 4-layer organic stage:
 *   1. Paper background
 *   2. Watercolor ink atmosphere
 *   3. Slot (children — the exercise itself)
 *   4. Light motes / particles
 * Respects prefers-reduced-motion by dimming dynamic layers.
 */
export function OrganicStage({
  children,
  breath,
  breathDuration = 4,
  baseColor = "#0F172A",
  accentColor = "#10B981",
  secondaryColor = "#FCD34D",
  particleColor = "#FDFCFB",
  particleCount = 16,
  showParticles = true,
}: Props) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <PaperBackground base={baseColor} accent={accentColor} />
      {!reduced && (
        <InkAtmosphere
          breath={breath}
          accent={accentColor}
          secondary={secondaryColor}
          duration={breathDuration}
        />
      )}
      <div className="absolute inset-0">{children}</div>
      {!reduced && showParticles && (
        <Particles count={particleCount} color={particleColor} />
      )}
    </div>
  );
}
