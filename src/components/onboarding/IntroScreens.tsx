import { ArrowRight, Brain, Navigation, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { ResmaIsotipo } from "./ResmaIsotipo";
import resmitaAsset from "@/assets/resmita-bot.png.asset.json";

const TEAL = "#7cc2c8";
const INK = "#101927";

export function SplashIntro({ onContinue }: { onContinue: () => void }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="relative flex flex-1 flex-col items-center pt-6">
      {/* Aura respiración vagal */}
      <div className="pointer-events-none absolute left-1/2 top-[42%] -z-0 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7cc2c8] animate-breath-vagal" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        {/* Resmita sin tarjeta: PNG con fondo transparente flotando sobre el aura */}
        <div className="animate-float-weightless">
          {imgOk ? (
            <img
              src={resmitaAsset.url}
              alt="Resmita"
              onError={() => setImgOk(false)}
              className="h-[220px] w-[220px] object-contain drop-shadow-[0_18px_28px_rgba(16,25,39,0.15)]"
            />
          ) : (
            <ResmaIsotipo size={140} />
          )}
        </div>

        <p
          className="mt-8 max-w-[300px] font-serifElegant text-[16px] italic leading-relaxed opacity-0 animate-cascade-up"
          style={{ color: "rgba(16,25,39,0.72)", animationDelay: "300ms" }}
        >
          {"\u201CTu mente, a tu propio ritmo. Un rincón seguro impulsado por herramientas clínicas basadas en evidencia.\u201D"}
        </p>
      </div>

      <button
        onClick={onContinue}
        className="relative z-10 mt-8 flex w-full items-center justify-center gap-2 rounded-full py-4 font-display text-[15px] font-bold uppercase tracking-wide transition active:scale-[0.98] opacity-0 animate-cascade-up"
        style={{
          background: "linear-gradient(135deg, #7cc2c8 0%, #a5dcdf 100%)",
          color: INK,
          boxShadow: "0 16px 34px -12px rgba(124,194,200,0.6)",
          animationDelay: "600ms",
        }}
      >
        Comenzar mi viaje <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <p className="relative z-10 mt-3 text-center text-[11px] font-light text-[#101927]/45">
        Al continuar aceptás nuestras políticas de privacidad y uso clínico.
      </p>
    </div>
  );
}

type Pillar = {
  title: string;
  body: string;
  tint: string;
  Icon?: typeof Brain;
  image?: string;
};

const PILLARS: Pillar[] = [
  {
    Icon: Brain,
    title: "Ciencia, no magia",
    body: "Ejercicios interactivos basados en TCC, DBT, Mindfulness y Terapia de Aceptación.",
    tint: "#7cc2c8",
  },
  {
    Icon: Navigation,
    title: "Paso a paso personalizado",
    body: "Un algoritmo clínico calibra tu itinerario diario según lo que hoy necesitás.",
    tint: "#facb60",
  },
  {
    image: resmitaAsset.url,
    title: "Resmita, tu compañera IA",
    body: "Una IA entrenada con tu progreso que te acompaña, escucha y sugiere prácticas.",
    tint: "#8b79f2",
  },
  {
    Icon: ShieldCheck,
    title: "Privado y seguro",
    body: "Tus datos están encriptados y protegidos con estándares clínicos.",
    tint: "#7cc2c8",
  },
];

export function ValueSlides({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center pt-4">
      <motion.div
        className="space-y-3.5"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.22, delayChildren: 0.1 } },
        }}
      >
        {PILLARS.map(({ Icon, image, title, body, tint }) => (
          <motion.div
            key={title}
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="flex items-start gap-3 rounded-[22px] border border-[#101927]/5 bg-white/85 p-3.5 shadow-glass backdrop-blur-xl"
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
              style={{ background: `${tint}22` }}
            >
              {image ? (
                <img src={image} alt="" className="h-full w-full object-contain p-0.5" />
              ) : Icon ? (
                <Icon
                  className="h-[18px] w-[18px]"
                  style={{ color: tint === "#facb60" ? "#b88a14" : tint }}
                  strokeWidth={2}
                />
              ) : (
                <Sparkles className="h-[18px] w-[18px]" style={{ color: tint }} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[14px] font-bold leading-tight text-[#101927]">
                {title}
              </h3>
              <p className="mt-1 text-[12px] font-light leading-snug text-[#101927]/60">
                {body}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-auto pt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
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
      </motion.div>
    </div>
  );
}
