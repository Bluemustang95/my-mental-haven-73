import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = { draft: ThoughtDraft; patch: (p: Partial<ThoughtDraft>) => void };

export default function Step1Situacion({ draft, patch }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-[28px] font-bold leading-tight text-[#101927]">
          Evento o situación
        </h2>
        <p className="mt-1 text-[13px] text-[#101927]/65">
          Contá de forma fáctica y objetiva qué sucedió.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/60 bg-white/55 p-4 shadow-glass backdrop-blur-xl">
        <textarea
          value={draft.triggerEvent}
          onChange={(e) => patch({ triggerEvent: e.target.value })}
          placeholder="Ej: Le mandé un mensaje a mi pareja hace tres horas y todavía no me contestó..."
          rows={6}
          className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none"
        />
      </div>

      <div className="rounded-2xl border border-[#7cc2c8]/30 bg-[#7cc2c8]/10 p-3.5">
        <p className="text-[12.5px] leading-relaxed text-[#101927]/80">
          <span className="mr-2">💡</span>
          Centrate en los datos puros. Evitá calificar el hecho como "malo" o "bueno". Solo describí qué pasó.
        </p>
      </div>
    </div>
  );
}
