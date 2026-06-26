import { DISTORTIONS } from "@/lib/pensamientos/distortions";
import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = { draft: ThoughtDraft; patch: (p: Partial<ThoughtDraft>) => void };

export default function Step7Distorsiones({ draft, patch }: Props) {
  const toggle = (key: string, label: string) => {
    const has = draft.distortions.some((d) => d.key === key);
    patch({
      distortions: has
        ? draft.distortions.filter((d) => d.key !== key)
        : [...draft.distortions, { key, label }],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-[28px] font-bold leading-tight text-[#101927]">
          Distorsiones cognitivas
        </h2>
        <p className="mt-1 text-[13px] text-[#101927]/65">
          Identificá los sesgos mentales en tu pensamiento.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {DISTORTIONS.map((d) => {
          const on = draft.distortions.some((x) => x.key === d.key);
          return (
            <button
              key={d.key}
              onClick={() => toggle(d.key, d.label)}
              className={`rounded-3xl border p-4 text-left transition active:scale-[0.97] ${
                on
                  ? "border-[#7cc2c8] bg-[#7cc2c8]/12 shadow-sm"
                  : "border-white/70 bg-white/80 shadow-glass"
              }`}
            >
              <div className="text-[26px]">{d.emoji}</div>
              <p className="mt-2 font-display text-[13px] font-bold leading-tight text-[#101927]">
                {d.label}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-[#101927]/60">
                {d.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
