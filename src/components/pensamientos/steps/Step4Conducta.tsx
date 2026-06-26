import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = { draft: ThoughtDraft; patch: (p: Partial<ThoughtDraft>) => void };

export default function Step4Conducta({ draft, patch }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-[28px] font-bold leading-tight text-[#101927]">
          Comportamiento
        </h2>
        <p className="mt-1 text-[13px] text-[#101927]/65">
          ¿Cómo reaccionaste o qué hiciste?
        </p>
      </div>

      <div className="rounded-[28px] border border-white/60 bg-white/55 p-4 shadow-glass backdrop-blur-xl">
        <textarea
          value={draft.behavior}
          onChange={(e) => patch({ behavior: e.target.value })}
          placeholder="Ej: Le mandé tres mensajes más seguidos con tono molesto y me quedé mirando la pantalla esperando el visto..."
          rows={7}
          className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none"
        />
      </div>
    </div>
  );
}
