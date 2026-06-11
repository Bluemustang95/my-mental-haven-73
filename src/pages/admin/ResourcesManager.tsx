import { useState } from "react";
import { Wind, Sparkles, Eye, Leaf } from "lucide-react";
import { BreathingSoundsManager } from "./mindfulness/BreathingSoundsManager";
import { BodyScanManager } from "./mindfulness/BodyScanManager";
import { Grounding54321Manager } from "./mindfulness/Grounding54321Manager";
import { MiraElPresenteManager } from "./mindfulness/MiraElPresenteManager";

type Section = "mindfulness";
type MindSub = "respiracion" | "body-scan" | "hojas-pasar" | "54321";

export default function ResourcesManager() {
  const [section] = useState<Section>("mindfulness");
  const [sub, setSub] = useState<MindSub>("respiracion");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Recursos</h1>
          <p className="text-sm text-slate-500">
            Gestioná el contenido de las prácticas guiadas. Por ahora: Mindfulness.
          </p>
        </div>
      </div>

      {/* Section tabs (room to grow) */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
            section === "mindfulness"
              ? "bg-[#6B4EFF] text-white shadow-[0_10px_24px_-12px_rgba(107,78,255,0.6)]"
              : "bg-white/70 text-slate-600 ring-1 ring-white/60 hover:bg-white"
          }`}
        >
          <Sparkles size={14} /> Mindfulness
        </button>
        <span className="flex items-center rounded-2xl bg-white/40 px-3 text-[11px] font-medium text-slate-400">
          Próximamente: Regulación, Sueño…
        </span>
      </div>

      {/* Sub tabs */}
      <div className="rounded-3xl border border-white/60 bg-white/55 p-2 backdrop-blur-xl">
        <div className="flex flex-wrap gap-1">
          {[
            { id: "respiracion" as const, label: "Respiración", icon: Wind },
            { id: "body-scan" as const, label: "Body Scan", icon: Sparkles },
            { id: "54321" as const, label: "5-4-3-2-1", icon: Eye },
            { id: "mira-el-presente" as const, label: "Mira el presente", icon: Leaf },
          ].map((t) => {
            const active = sub === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSub(t.id)}
                className={`flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-[#6B4EFF] shadow-sm ring-1 ring-[#6B4EFF]/20"
                    : "text-slate-500 hover:bg-white/60"
                }`}
              >
                <t.icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {sub === "respiracion" && <BreathingSoundsManager />}
        {sub === "body-scan" && <BodyScanManager />}
        {sub === "54321" && <Grounding54321Manager />}
        {sub === "mira-el-presente" && (
          <MiraElPresenteManager onGoTo54321={() => setSub("54321")} />
        )}
      </div>
    </div>
  );
}
