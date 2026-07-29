import { BookOpen, Heart, Moon, Pill } from "lucide-react";
import type { PillarResult, WellbeingSnapshotV3 } from "@/lib/wellbeing/types";
import type { FocusKey } from "@/lib/wellbeing/bands";

type Tile = {
  id: FocusKey;
  title: string;
  value: number | null;
  caption: string;
  color: string;
  icon: React.ReactNode;
  parts: PillarResult["parts"];
};

function combine(a: PillarResult, b: PillarResult): number | null {
  const items = [a, b].filter((p) => p.score !== null);
  if (!items.length) return null;
  const total = items.reduce((s, p) => s + p.baseWeight, 0);
  if (!total) return null;
  return items.reduce((s, p) => s + (p.score as number) * p.baseWeight, 0) / total;
}

function PillarTile({ tile, onOpen }: { tile: Tile; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="rounded-[20px] border bg-white p-4 text-left transition active:scale-[0.98]"
      style={{ borderColor: `${tile.color}66` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[12.5px] font-bold leading-tight text-[#0f172a]">{tile.title}</p>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${tile.color}22`, color: tile.color }}
        >
          {tile.icon}
        </span>
      </div>
      <p className="mt-2 font-display text-[30px] font-semibold leading-none text-[#0f172a] tabular-nums">
        {tile.value === null ? "—" : Math.round(tile.value)}
      </p>
      <p className="mt-2 text-[10.5px] text-[#94a3b8]">{tile.caption}</p>
      <div className="mt-2 space-y-0.5">
        {tile.parts.slice(0, 3).map((p) => (
          <div key={p.key} className="flex items-center justify-between text-[9.5px] text-[#94a3b8]">
            <span className="truncate pr-2">{p.label}</span>
            <span className="tabular-nums">{p.value === null ? "sin datos" : Math.round(p.value)}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

/** Grilla 2x2 del desglose por pilares (vista detalle). */
export function PillarDetailGrid({
  snapshot,
  onOpenMonth,
}: {
  snapshot: WellbeingSnapshotV3 | null;
  onOpenMonth: (focus: FocusKey) => void;
}) {
  if (!snapshot) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[150px] animate-pulse rounded-[20px] bg-white/60" />
        ))}
      </div>
    );
  }

  const { mood, balance, sleep, resources, treatment } = snapshot.pillars;

  const tiles: Tile[] = [
    {
      id: "mood",
      title: "Ánimo y Balance",
      value: combine(mood, balance),
      caption: `Bienestar (${mood.baseWeight + balance.baseWeight}%)`,
      color: "#facb60",
      icon: <Heart size={15} />,
      parts: [...mood.parts, ...balance.parts],
    },
    {
      id: "sleep",
      title: "Sueño y Descanso",
      value: sleep.score,
      caption: `Bienestar (${sleep.baseWeight}%)`,
      color: "#8b9df0",
      icon: <Moon size={15} />,
      parts: sleep.parts,
    },
    {
      id: "resources",
      title: "Uso de Recursos",
      value: resources.score,
      caption: `Cuidado (${resources.baseWeight}%)`,
      color: "#87d3a4",
      icon: <BookOpen size={15} />,
      parts: resources.parts,
    },
    {
      id: "treatment",
      title: "Tratamiento",
      value: treatment.score,
      caption: `Cuidado (${treatment.baseWeight}%)`,
      color: "#7cc2c8",
      icon: <Pill size={15} />,
      parts: treatment.parts,
    },
  ];

  return (
    <div className="mt-2 grid grid-cols-2 gap-3">
      {tiles.map((t) => (
        <PillarTile key={t.id} tile={t} onOpen={() => onOpenMonth(t.id)} />
      ))}
    </div>
  );
}
