import { useEffect, useMemo, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

interface Props {
  data: object;
  loop?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Thin wrapper around lottie-react that:
 * - Respects prefers-reduced-motion (renders static first frame)
 * - Allows setting playback speed declaratively
 */
export function LottiePlayer({ data, loop = true, speed = 1, className, style }: Props) {
  const ref = useRef<LottieRefCurrentProps>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.setSpeed(speed);
    if (reduced) {
      ref.current.goToAndStop(0, true);
    } else {
      ref.current.play();
    }
  }, [speed, reduced]);

  const memoData = useMemo(() => data, [data]);

  return (
    <Lottie
      lottieRef={ref}
      animationData={memoData}
      loop={loop && !reduced}
      autoplay={!reduced}
      className={className}
      style={style}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
