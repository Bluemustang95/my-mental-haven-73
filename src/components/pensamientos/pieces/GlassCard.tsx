import { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "warning" | "success" | "gold";
}) {
  const toneClass =
    tone === "warning"
      ? "bg-[#FCA5A5]/15 border-[#FCA5A5]/40"
      : tone === "success"
      ? "bg-[#A7F3D0]/20 border-[#A7F3D0]/50"
      : tone === "gold"
      ? "bg-gradient-to-br from-[#facb60]/25 to-white/40 border-[#facb60]/40"
      : "bg-white/45 border-white/60";

  return (
    <div
      className={`rounded-[28px] border backdrop-blur-[28px] [backdrop-filter:saturate(180%)_blur(28px)] shadow-[0_10px_30px_-10px_rgba(16,25,39,0.06)] ${toneClass} ${className}`}
    >
      {children}
    </div>
  );
}
