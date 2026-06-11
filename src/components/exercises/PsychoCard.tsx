import { BookOpen } from "lucide-react";

const COPY: Record<string, { title: string; body: string }> = {
  "mindfulness.breathing.box": {
    title: "¿Por qué funciona?",
    body: "La respiración cuadrada equilibra el sistema nervioso autónomo. Al alargar la exhalación tu corazón se enlentece y el cerebro recibe la señal de que estás a salvo.",
  },
  "mindfulness.breathing.478": {
    title: "Exhalación larga = calma",
    body: "Cuando exhalás el doble de tiempo que inhalás, activás el sistema parasimpático. Por eso 4-7-8 ayuda a dormir y a frenar picos de ansiedad.",
  },
  "mindfulness.breathing.coherence": {
    title: "Coherencia cardíaca",
    body: "Respirar a 6 por minuto (5s in / 5s out) sincroniza tu ritmo cardíaco con la respiración. Es uno de los protocolos más estudiados para reducir estrés.",
  },
  "mindfulness.breathing.sigh": {
    title: "Suspiro fisiológico",
    body: "Dos inhalaciones cortas y una exhalación larga vacían el CO₂ atrapado en los alvéolos. Es la forma más rápida que tiene el cuerpo de bajar la activación.",
  },
  "mindfulness.bodyscan": {
    title: "Escáner corporal",
    body: "Llevar la atención zona por zona entrena al cerebro a observar sensaciones sin reaccionar. Es la base del mindfulness clínico.",
  },
};

export function PsychoCard({ resourceKey }: { resourceKey: string }) {
  const c = COPY[resourceKey] ?? COPY["mindfulness.breathing.box"];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-[#FB923C]">
        <BookOpen size={14} /> Psicoeducación
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{c.title}</h3>
      <p className="mt-2 font-serif text-sm leading-relaxed text-white/75">{c.body}</p>
    </div>
  );
}
