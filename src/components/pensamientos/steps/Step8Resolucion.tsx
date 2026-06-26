import { getResolutionMode, type ThoughtDraft } from "@/lib/pensamientos/state";

type Props = { draft: ThoughtDraft; patch: (p: Partial<ThoughtDraft>) => void };

export default function Step8Resolucion({ draft, patch }: Props) {
  const mode = getResolutionMode(draft);
  const isAbordaje = mode === "abordaje";

  const title = isAbordaje ? "Abordaje del Problema" : "Reestructuración Cognitiva";
  const description = isAbordaje
    ? "Abordemos proactivamente la situación con un plan de acción concreto."
    : "Construyamos una respuesta adaptativa más realista al pensamiento.";

  const bannerTitle = isAbordaje ? "Abordaje de Problemática" : "Reestructuración Cognitiva";
  const bannerBody = isAbordaje
    ? "Dado que los hechos respaldan tus preocupaciones, nos enfocaremos en cómo abordar la situación de forma asertiva y saludable."
    : "Dado que los hechos no sostienen el pensamiento, vamos a construir una respuesta más adaptativa y realista.";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-[26px] font-bold leading-tight text-[#101927]">
          {isAbordaje ? "Resolución del Pensamiento" : "Respuesta Adaptativa"}
        </h2>
        <p className="mt-1 text-[13px] text-[#101927]/65">{description}</p>
      </div>

      <div className="rounded-3xl border border-[#facb60]/40 bg-gradient-to-br from-white/85 to-[#facb60]/15 p-4 shadow-glass">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#92561a]">
          Resultado de balanza
        </p>
        <p className="mt-1.5 font-display text-[15px] font-bold text-[#101927]">{bannerTitle}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#101927]/75">{bannerBody}</p>
      </div>

      <div className="rounded-[28px] border border-white/60 bg-white/55 p-4 shadow-glass backdrop-blur-xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
          {isAbordaje ? "Plan de abordaje / Acción" : "Respuesta adaptativa"}
        </p>
        {isAbordaje ? (
          <textarea
            value={draft.resolutionPlan}
            onChange={(e) => patch({ resolutionPlan: e.target.value })}
            placeholder="Ej: Hablaré directamente con mi jefa de manera constructiva para aclarar la asignación del proyecto..."
            rows={6}
            className="mt-2 w-full resize-none bg-transparent text-[14px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none"
          />
        ) : (
          <textarea
            value={draft.alternativeThought}
            onChange={(e) => patch({ alternativeThought: e.target.value })}
            placeholder="Ej: Aunque pensé que me ignoraba, probablemente está ocupada. Puedo esperar sin asumir lo peor."
            rows={6}
            className="mt-2 w-full resize-none bg-transparent text-[14px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}
