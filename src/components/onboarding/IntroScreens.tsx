import { ArrowRight, Brain, Navigation, ShieldCheck } from "lucide-react";
import { ResmaIsotipo } from "./ResmaIsotipo";

const TEAL = "#7cc2c8";
const INK = "#101927";

export function SplashIntro({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center pt-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <ResmaIsotipo size={104} />
        <p
          className="mt-7 text-[11px] font-bold uppercase tracking-[0.32em]"
          style={{ color: TEAL }}
        >
          Red de Salud Mental Argentina
        </p>
        <h1
          className="mt-3 font-mindful text-[56px] leading-none tracking-[-0.01em]"
          style={{ color: INK }}
        >
          RESMA
        </h1>
        <p
          className="mt-6 max-w-[300px] text-[15px] font-light leading-relaxed"
          style={{ color: "rgba(16,25,39,0.65)" }}
        >
          Tu mente, a tu propio ritmo. Un rincón seguro impulsado por
          herramientas clínicas basadas en evidencia.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="mt-10 flex w-full items-center justify-center gap-2 rounded-full py-4 font-display text-[15px] font-bold transition active:scale-[0.98]"
        style={{
          background: TEAL,
          color: INK,
          boxShadow: "0 14px 30px -12px rgba(124,194,200,0.55)",
        }}
      >
        Comenzar mi viaje <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <p className="mt-3 text-center text-[11px] font-light text-[#101927]/45">
        Al continuar aceptas nuestros términos de privacidad y uso clínico.
      </p>
    </div>
  );
}

const PILLARS = [
  {
    icon: Brain,
    title: "Ciencia, no magia",
    body: "Ejercicios interactivos basados en Terapia Cognitivo-Conductual, DBT, Mindfulness y Terapia de Aceptación.",
    tint: "#7cc2c8",
  },
  {
    icon: Navigation,
    title: "Paso a paso personalizado",
    body: "Nuestro algoritmo clínico calibrará tu itinerario diario según las necesidades de hoy.",
    tint: "#facb60",
  },
  {
    icon: ShieldCheck,
    title: "Privado y Seguro",
    body: "Tus datos están encriptados y protegidos con estándares clínicos.",
    tint: "#7cc2c8",
  },
];

export function ValueSlides({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col pt-2">
      <h1
        className="font-mindful text-[40px] leading-[1.05] tracking-[-0.01em]"
        style={{ color: INK }}
      >
        Diseñado para
        <br />
        ser tu refugio
      </h1>

      <div className="mt-8 space-y-4">
        {PILLARS.map(({ icon: Icon, title, body, tint }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-[28px] border border-[#101927]/5 bg-white/85 p-5 shadow-glass backdrop-blur-xl"
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `${tint}22` }}
            >
              <Icon className="h-5 w-5" style={{ color: tint === "#facb60" ? "#b88a14" : tint }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[16px] font-bold leading-tight text-[#101927]">
                {title}
              </h3>
              <p className="mt-1.5 text-[13px] font-light leading-relaxed text-[#101927]/60">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-full py-4 font-display text-[15px] font-bold transition active:scale-[0.98]"
          style={{
            background: TEAL,
            color: INK,
            boxShadow: "0 14px 30px -12px rgba(124,194,200,0.55)",
          }}
        >
          Personalizar mi experiencia <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
