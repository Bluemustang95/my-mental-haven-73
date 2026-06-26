import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = { draft: ThoughtDraft; patch: (p: Partial<ThoughtDraft>) => void };

export default function Step2Pensamiento({ draft, patch }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-[28px] font-bold leading-tight text-[#101927]">
          Pensamiento automático
        </h2>
        <p className="mt-1 text-[13px] text-[#101927]/65">
          ¿Qué idea o frase rápida cruzó tu mente?
        </p>
      </div>

      <div className="rounded-[28px] border border-white/60 bg-white/55 p-4 shadow-glass backdrop-blur-xl">
        <textarea
          value={draft.automaticThought}
          onChange={(e) => patch({ automaticThought: e.target.value })}
          placeholder="Ej: Seguro ya no le intereso, me está ignorando a propósito o está con otra persona..."
          rows={6}
          className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none"
        />
      </div>

      <div className="rounded-2xl border border-[#7cc2c8]/30 bg-[#7cc2c8]/10 p-3.5">
        <p className="text-[12.5px] leading-relaxed text-[#101927]/80">
          <span className="mr-2">🧠</span>
          Los pensamientos automáticos suelen ser veloces y aparecer como verdades absolutas. Escribí tal cual se te cruzó la cabeza.
        </p>
      </div>
    </div>
  );
}
