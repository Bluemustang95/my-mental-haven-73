import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function GlassCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[#101927]/5 bg-white/80 backdrop-blur-2xl shadow-[0_10px_40px_rgba(16,25,39,0.08)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
