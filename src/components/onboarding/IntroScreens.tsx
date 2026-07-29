import { ArrowRight, Brain, Moon, Navigation, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import resmitaAsset from "@/assets/resmita-bot.png.asset.json";
import { ResmaIsotipoMark } from "@/components/brand/ResmaIsotipoMark";
import { loadLegalLinks, type LegalLinks } from "@/lib/legalLinks";

const TEAL = "#7cc2c8";
const TEAL_DEEP = "#2c7a80";
const SUN = "#fef08a";
const INK = "#101927";

/** Ilustración zen orgánica: aura, sol, colinas y brote. */
function ZenIllustration() {
  return (
    <svg
      viewBox="0 0 320 240"
      className="absolute inset-0 h-full w-full"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="blobGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.20" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.30" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* forma orgánica fluida */}
      <path
        d="M160 22c48 0 84 30 92 74 8 44-14 88-58 108-44 20-96 12-124-22-28-34-26-88 6-122C104 34 128 22 160 22Z"
        fill="url(#blobGrad)"
      />

      {/* sol cálido */}
      <circle cx="204" cy="86" r="42" fill={SUN} opacity="0.35" className="animate-pulse-aura" />
      <circle cx="204" cy="86" r="30" fill="#fde68a" opacity="0.95" />

      {/* colinas suaves */}
      <path
        d="M52 196c30-26 58-24 84-8s54 20 86-6c12-10 24-14 34-13v53H52v-26Z"
        fill="url(#hillGrad)"
      />
      <path
        d="M52 214c34-18 62-12 88 2s58 14 88-8v14H52v-8Z"
        fill={TEAL}
        opacity="0.18"
      />

      {/* brote / planta */}
      <path d="M160 208V132" stroke={TEAL_DEEP} strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M160 156c-16-4-26-16-27-31 16 0 26 10 27 31Z"
        fill={TEAL_DEEP}
        opacity="0.85"
      />
      <path
        d="M160 142c15-6 24-19 24-34-16 1-25 12-24 34Z"
        fill={TEAL}
        opacity="0.95"
      />
    </svg>
  );
}

export function SplashIntro({ onContinue }: { onContinue: () => void }) {
  const [legal, setLegal] = useState<LegalLinks>({ privacy: "", terms: "" });

  useEffect(() => {
    loadLegalLinks().then(setLegal).catch(() => {});
  }, []);

  return (
    <div className="relative flex flex-1 flex-col items-center">
      {/* Fondo pastel orgánico a pantalla completa */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-[#f3fafb] via-white to-[#e6f4f5]"
      />

      {/* Header: solo el isotipo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#7cc2c8]/40 bg-white/90 shadow-sm backdrop-blur-md"
      >
        <ResmaIsotipoMark size={28} color={TEAL_DEEP} />
      </motion.div>


      {/* Área visual híbrida */}
      <div className="relative mt-auto h-[280px] w-full">
        {/* aura ambiental */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse-aura"
          style={{ background: TEAL, opacity: 0.18, filter: "blur(60px)" }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <ZenIllustration />
        </motion.div>

        {/* Tarjeta flotante: Sueño */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-4 animate-card-1"
          aria-hidden
        >
          <div className="flex items-center gap-2.5 rounded-2xl border border-violet-200 bg-white/95 px-3 py-2 shadow-[0_12px_30px_-12px_rgba(16,25,39,0.35)] backdrop-blur-md">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
              <Moon className="h-3.5 w-3.5 text-violet-500" strokeWidth={2.2} />
            </span>
            <span className="leading-tight">
              <span className="block text-[12px] font-bold text-slate-800">Sueño Reparador</span>
              <span className="block text-[10px] font-medium text-slate-500">82 pts • Higiene ok</span>
            </span>
          </div>
        </motion.div>

        {/* Badge flotante: cuidado clínico */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-1 top-[86px] animate-card-2"
          aria-hidden
        >
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/95 px-3 py-1.5 shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.4} />
            <span className="text-[11px] font-bold text-emerald-700">Cuidado Activo</span>
          </div>
        </motion.div>

        {/* Tarjeta flotante: métrica general */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-1 right-2 animate-card-2"
          aria-hidden
        >
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 shadow-[0_18px_40px_-16px_rgba(16,25,39,0.7)] backdrop-blur-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-4 w-4 animate-pulse text-[#7cc2c8]" strokeWidth={2.2} />
            </span>
            <span className="leading-tight">
              <span className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Mi sintonía
                </span>
                <span className="rounded-md bg-emerald-400/20 px-1.5 py-px text-[9px] font-bold text-emerald-300">
                  Al día
                </span>
              </span>
              <span className="block text-[14px] font-bold text-white">Equilibrio 78/100</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* Frase central */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-auto max-w-[320px] text-center font-display text-base font-medium leading-relaxed text-slate-800 sm:text-lg"
      >
        Tu rincón para cuidar tu salud mental, a tu propio ritmo y con apoyo clínico
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        onClick={onContinue}
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7cc2c8] py-4 font-display text-[15px] font-bold uppercase tracking-wide text-[#101927] shadow-[0_14px_30px_-12px_rgba(124,194,200,0.75)] transition hover:bg-[#63b3b9] active:scale-[0.99]"
      >
        Comenzar mi viaje
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
          strokeWidth={2.5}
        />
      </motion.button>

      {/* Footer legal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.6 }}
        className="mt-3 pb-2 text-center"
      >
        <p className="text-[10px] text-slate-600">
          Al continuar aceptás nuestras políticas de privacidad y uso clínico.
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-[10px] font-medium">
          <a
            href={legal.privacy || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition hover:text-[#2c7a80]"
            style={{ color: TEAL_DEEP }}
          >
            Políticas de Privacidad
          </a>
          <span className="text-slate-400">·</span>
          <a
            href={legal.terms || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition hover:text-[#2c7a80]"
            style={{ color: TEAL_DEEP }}
          >
            Términos y Condiciones
          </a>
        </div>
      </motion.div>
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
    <div className="flex flex-1 flex-col justify-center py-8">
      <motion.div
        className="space-y-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } },
        }}
      >
        {PILLARS.map(({ Icon, image, title, body, tint }) => (
          <motion.div
            key={title}
            variants={{
              hidden: { opacity: 0, y: 24, scale: 0.97 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
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
              <h3 className="font-display text-[16px] font-bold leading-tight text-[#101927]">
                {title}
              </h3>
              <p className="mt-1 text-[13px] font-light leading-snug text-[#101927]/60">
                {body}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="pt-8"
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
