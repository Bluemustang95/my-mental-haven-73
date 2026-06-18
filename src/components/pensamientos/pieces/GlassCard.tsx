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
      ? "bg-gradient-to-br from-[#facb60]/25 to-white/60 border-[#facb60]/40"
      : "bg-white/75 border-white/60";

  return (
    <div
      className={`rounded-3xl border backdrop-blur-xl shadow-glass ${toneClass} ${className}`}
    >
      {children}
    </div>
  );
}
