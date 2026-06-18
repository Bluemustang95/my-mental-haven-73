import { ALL_DISTORTIONS } from "@/lib/pensamientos/distortionDetector";

type Props = {
  selected: string | null;
  onSelect: (key: string | null, label: string | null) => void;
};

export default function DistortionPicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_DISTORTIONS.map((d) => {
        const active = selected === d.key;
        return (
          <button
            key={d.key}
            onClick={() => onSelect(active ? null : d.key, active ? null : d.label)}
            className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${
              active
                ? "border-[#101927] bg-[#101927] text-white"
                : "border-[#101927]/15 bg-white/80 text-[#101927]/75 hover:bg-white"
            }`}
          >
            {d.label}
          </button>
        );
      })}
      <button
        onClick={() => onSelect(null, null)}
        className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${
          selected === null
            ? "border-[#101927]/30 bg-[#101927]/5 text-[#101927]/70"
            : "border-dashed border-[#101927]/20 bg-transparent text-[#101927]/50"
        }`}
      >
        Ninguna aplica
      </button>
    </div>
  );
}
