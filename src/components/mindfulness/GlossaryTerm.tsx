import { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TERMS: Record<string, { title: string; body: string }> = {
  hecho: {
    title: "Hecho",
    body: "Algo observable, comprobable y medible. Lo que filmaría una cámara sin opinar.",
  },
  juicio: {
    title: "Juicio",
    body: "Una valoración, etiqueta o interpretación. Útil, pero no es un dato puro.",
  },
  interpretacion: {
    title: "Interpretación",
    body: "El significado que le damos a un hecho. Distinta del hecho en sí.",
  },
  anatomia: {
    title: "Anatomía de la emoción",
    body: "Mapear qué emoción aparece, dónde la sentís en el cuerpo y con qué intensidad.",
  },
};

interface Props {
  term: keyof typeof TERMS;
  children: ReactNode;
}

export function GlossaryTerm({ term, children }: Props) {
  const t = TERMS[term];
  if (!t) return <>{children}</>;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="underline decoration-dotted decoration-white/40 underline-offset-2"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 border-white/10 bg-[#0F172A] text-white">
        <div className="font-display text-sm font-bold">{t.title}</div>
        <p className="mt-1 font-serif text-[13px] leading-relaxed text-white/80">{t.body}</p>
      </PopoverContent>
    </Popover>
  );
}
