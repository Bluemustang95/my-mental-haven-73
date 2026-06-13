import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineNode = {
  id: string;
  title: string;
  subtitle: ReactNode;
  icon: ReactNode;
  iconBg: string;
  done: boolean;
  onClick?: () => void;
  footer?: ReactNode;
};

export function Timeline({ nodes, allDone }: { nodes: TimelineNode[]; allDone: boolean }) {
  return (
    <div className="relative pl-9">
      <div
        className={cn(
          "absolute left-3 top-4 bottom-4 w-[2px] rounded-full transition-colors",
          allDone ? "bg-success" : "bg-muted/60"
        )}
      />
      <div className="space-y-4">
        {nodes.map((n) => (
          <div key={n.id} className="relative">
            <div className="absolute -left-9 top-5">
              <motion.div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                  n.done
                    ? "border-success bg-success"
                    : "border-muted bg-card"
                )}
              >
                {n.done && <Check size={14} className="text-white" strokeWidth={3.5} />}
              </motion.div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={n.onClick}
              className="block w-full rounded-[28px] border border-foreground/5 bg-card/80 p-4 text-left shadow-glass backdrop-blur-3xl transition active:bg-card"
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: n.iconBg }}
                >
                  {n.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-bold text-foreground">{n.title}</p>
                  <div className="mt-0.5 text-[13px] font-medium text-muted-foreground">{n.subtitle}</div>
                </div>
              </div>
              {n.footer && <div className="mt-3">{n.footer}</div>}
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  );
}
