import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumLock } from "@/components/PremiumLock";

export type TimelineNode = {
  id: string;
  title: string;
  subtitle: ReactNode;
  icon: ReactNode;
  iconBg: string;
  done: boolean;
  onClick?: () => void;
  footer?: ReactNode;
  /** If true, the node is wrapped in a PremiumLock overlay for free users. */
  locked?: boolean;
  lockLabel?: string;
};

export function Timeline({ nodes, allDone }: { nodes: TimelineNode[]; allDone: boolean }) {
  return (
    <div className="relative pl-7">
      <div
        className={cn(
          "absolute left-2.5 top-4 bottom-4 w-[2px] rounded-full transition-colors",
          allDone ? "bg-success" : "bg-muted/60"
        )}
      />
      <div className="space-y-2">
        {nodes.map((n) => {
          const card = (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={n.onClick}
              className="block w-full rounded-[22px] border border-foreground/5 bg-card/80 px-3 py-2.5 text-left shadow-glass backdrop-blur-3xl transition active:bg-card"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: n.iconBg }}
                >
                  {n.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[14px] font-bold text-foreground">{n.title}</p>
                  <div className="mt-0.5 text-[12px] leading-snug font-medium text-muted-foreground">{n.subtitle}</div>
                </div>
              </div>
              {n.footer && <div className="mt-2">{n.footer}</div>}
            </motion.button>
          );

          return (
            <div key={n.id} className="relative">
              <div className="absolute -left-7 top-3.5 z-10">
                <motion.div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                    n.done
                      ? "border-success bg-success"
                      : "border-muted bg-card"
                  )}
                >
                  {n.done && <Check size={12} className="text-white" strokeWidth={3.5} />}
                </motion.div>
              </div>

              {n.locked ? (
                <PremiumLock featureName={n.lockLabel ?? n.title} variant="card">
                  {card}
                </PremiumLock>
              ) : (
                card
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
