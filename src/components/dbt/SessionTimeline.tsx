import { motion } from "framer-motion";
import type { Stage } from "@/hooks/useChangeResponseFlow";

type Node = { key: Stage; label: string; ficha: string };

const ORDER_BASE: Node[] = [
  { key: "wizard8", label: "Hechos", ficha: "F8" },
  { key: "decision9", label: "Mente Sabia", ficha: "F9" },
];

interface Props {
  stage: Stage;
  path: "problem" | "opposite" | null;
  visited: Set<Stage>;
  onJump: (s: Stage) => void;
}

/**
 * Timeline horizontal compacta que muestra el avance por las fichas DBT.
 * Permite saltar hacia atrás a etapas ya visitadas (no hacia adelante).
 */
export function SessionTimeline({ stage, path, visited, onJump }: Props) {
  const branch: Node | null =
    stage === "opposite10" || path === "opposite"
      ? { key: "opposite10", label: "Acción Opuesta", ficha: "F10·13" }
      : stage === "problem12" || path === "problem"
        ? { key: "problem12", label: "Resolver", ficha: "F12" }
        : null;

  const done: Node = { key: "done", label: "Cierre", ficha: "✓" };
  const nodes: Node[] = [...ORDER_BASE, ...(branch ? [branch] : []), done];
  const activeIdx = nodes.findIndex((n) => n.key === stage);

  return (
    <div className="px-4 pt-3">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-3 right-3 top-3 h-[2px] bg-[#101927]/8" />
        <motion.div
          className="absolute left-3 top-3 h-[2px] bg-gradient-to-r from-[#7cc2c8] to-[#facb60]"
          initial={false}
          animate={{
            width: `calc(${(Math.max(0, activeIdx) / (nodes.length - 1)) * 100}% - ${(activeIdx / (nodes.length - 1)) * 24}px)`,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
        {nodes.map((n, i) => {
          const isActive = i === activeIdx;
          const isVisited = visited.has(n.key) || i < activeIdx;
          const canJump = isVisited && !isActive && i < activeIdx;
          return (
            <button
              key={n.key}
              disabled={!canJump}
              onClick={() => canJump && onJump(n.key)}
              className="relative z-10 flex flex-col items-center gap-1.5 active:scale-95 disabled:active:scale-100"
              aria-label={`${n.label} ${isActive ? "(actual)" : ""}`}
            >
              <motion.span
                initial={false}
                animate={{
                  scale: isActive ? 1.15 : 1,
                  backgroundColor: isActive
                    ? "#101927"
                    : isVisited
                      ? "#7cc2c8"
                      : "#ffffff",
                  borderColor: isVisited || isActive ? "#7cc2c8" : "#d8d9db",
                }}
                className="h-6 w-6 rounded-full border-2 flex items-center justify-center font-display text-[9px] font-bold"
                style={{ color: isActive ? "#facb60" : isVisited ? "#fff" : "#101927/40" }}
              >
                {n.ficha}
              </motion.span>
              <span
                className={`font-display text-[9.5px] tracking-wide ${
                  isActive ? "text-[#101927] font-bold" : "text-[#101927]/45"
                }`}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
