import type { AnyPillarKey, PillarResult, WellbeingSnapshotV3 } from "@/lib/wellbeing/types";

const META: Record<AnyPillarKey, { label: string; color: string; group: "sentir" | "hacer" }> = {
  mood: { label: "Ánimo", color: "#7cc2c8", group: "sentir" },
  sleep: { label: "Sueño", color: "#8b9df0", group: "sentir" },
  balance: { label: "Balance emocional", color: "#facb60", group: "sentir" },
  resources: { label: "Uso de recursos", color: "#87d3a4", group: "hacer" },
  treatment: { label: "Tratamiento", color: "#f0a58b", group: "hacer" },
};

function PillarTile({ pillar }: { pillar: PillarResult }) {
  const meta = META[pillar.key];
  const value = pillar.score;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="rounded-[18px] border border-white/70 bg-white/85 p-3.5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[11.5px] font-semibold leading-tight text-[#0f172a]">{meta.label}</p>
        <span className="rounded-full bg-black/[0.04] px-1.5 py-0.5 text-[8.5px] font-semibold text-[#64748b] tabular-nums">
          {pillar.appliedWeight}%
        </span>
      </div>
      <p className="mt-1.5 font-display text-[24px] font-semibold leading-none text-[#0f172a] tabular-nums">
        {value === null ? "—" : Math.round(value)}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: value === null ? "transparent" : meta.color }}
        />
      </div>
      <div className="mt-2 space-y-0.5">
        {pillar.parts.map((p) => (
          <div key={p.key} className="flex items-center justify-between text-[9.5px] text-[#94a3b8]">
            <span className="truncate pr-2">{p.label}</span>
            <span className="tabular-nums">{p.value === null ? "sin datos" : Math.round(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grilla de pilares separada en SENTIR (bienestar) y HACER (cuidado). */
export function PillarGridV3({ snapshot }: { snapshot: WellbeingSnapshotV3 | null }) {
  if (!snapshot) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[118px] animate-pulse rounded-[18px] bg-white/60" />
        ))}
      </div>
    );
  }

  const sentir: AnyPillarKey[] = ["mood", "sleep", "balance"];
  const hacer: AnyPillarKey[] = ["resources", "treatment"];

  return (
    <div className="mt-4 space-y-3">
      <div>
        <p className="font-[Montserrat] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
          Cómo te sentís
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {sentir.map((k) => (
            <PillarTile key={k} pillar={snapshot.pillars[k]} />
          ))}
        </div>
      </div>
      <div>
        <p className="font-[Montserrat] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
          Qué hacés por vos
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {hacer.map((k) => (
            <PillarTile key={k} pillar={snapshot.pillars[k]} />
          ))}
        </div>
      </div>
    </div>
  );
}
