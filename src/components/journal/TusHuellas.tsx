import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen } from "@phosphor-icons/react";

export default function TusHuellas() {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2, boxShadow: "0 8px 28px -6px rgba(101,67,33,0.28)" }}
      onClick={() => navigate("/diario/huellas")}
      className="group relative mb-6 flex w-full items-center gap-4 overflow-hidden rounded-3xl p-5 text-left transition-shadow"
      style={{
        background:
          "linear-gradient(135deg, hsl(28 30% 28%) 0%, hsl(25 35% 22%) 50%, hsl(22 28% 18%) 100%)",
      }}
    >
      {/* Leather / linen texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Subtle spine line */}
      <div className="pointer-events-none absolute left-[72px] top-2 bottom-2 w-[1px] bg-[hsl(35,40%,50%)]/20" />

      {/* Embossed filigree glow on hover */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,hsl(40,50%,70%,0.06),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100" />

      {/* Book icon */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(35,30%,40%)]/30 ring-1 ring-[hsl(35,40%,55%)]/20">
        <BookOpen size={26} weight="duotone" className="text-[hsl(38,45%,72%)]" />
      </div>

      {/* Text */}
      <div className="relative flex flex-col">
        <span className="font-display text-[15px] font-semibold tracking-wide text-[hsl(38,40%,82%)]">
          Tus Huellas
        </span>
        <span className="mt-0.5 text-[12px] text-[hsl(30,20%,62%)]">
          Releé tus entradas anteriores.
        </span>
      </div>

      {/* Right arrow hint */}
      <div className="relative ml-auto text-[hsl(35,30%,55%)]/60">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </motion.button>
  );
}
