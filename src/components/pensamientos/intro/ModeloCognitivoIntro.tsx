import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Brain, HelpCircle } from "lucide-react";
import { LECTORES, CAMINOS_VENTANA, DISTORSIONES, markIntroSeen } from "@/lib/pensamientos/intro";

type Props = {
  open: boolean;
  onClose: () => void;
};

const TOTAL = 4;

export default function ModeloCognitivoIntro({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [lectorIdx, setLectorIdx] = useState(0);
  const [camIdx, setCamIdx] = useState(0);
  const [distIdx, setDistIdx] = useState(0);

  if (!open) return null;

  const finish = () => {
    markIntroSeen();
    onClose();
  };

  const next = () => (step < TOTAL - 1 ? setStep(step + 1) : finish());
  const prev = () => step > 0 && setStep(step - 1);

  const lector = LECTORES[lectorIdx];
  const cam = CAMINOS_VENTANA[camIdx];
  const dist = DISTORSIONES[distIdx];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[linear-gradient(180deg,#f9f9fb_0%,#f2f4f8_100%)]"
      >
        {/* Ambient */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-20 h-[280px] w-[280px] rounded-full bg-[#7cc2c8] opacity-[0.16] blur-[100px]" />
          <div className="absolute bottom-0 -right-20 h-[300px] w-[300px] rounded-full bg-[#facb60] opacity-[0.16] blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto flex h-[100dvh] max-w-[420px] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-7 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-glass">
                <Brain size={14} className="text-[#7cc2c8]" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/55">
                Modelo cognitivo · {step + 1}/{TOTAL}
              </p>
            </div>
            <button
              onClick={finish}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-glass active:scale-95"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5 px-5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-all ${
                  i <= step ? "bg-[#101927]" : "bg-[#101927]/10"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display text-[22px] font-bold leading-tight text-[#101927]">
                        No es la situación, es cómo la interpretás.
                      </h2>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#101927]/70">
                        Cinco personas leen el mismo libro. Cada una siente algo distinto. ¿Por qué?
                        Porque cada una <strong>piensa</strong> algo distinto.
                      </p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {LECTORES.map((l, i) => (
                        <button
                          key={l.id}
                          onClick={() => setLectorIdx(i)}
                          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border transition ${
                            i === lectorIdx
                              ? "border-[#101927] bg-white shadow-glass scale-105"
                              : "border-white/70 bg-white/60"
                          }`}
                        >
                          <span className="text-2xl">{l.emoji}</span>
                          <span className="text-[8.5px] font-bold uppercase tracking-wide text-[#101927]/55">
                            {l.id}
                          </span>
                        </button>
                      ))}
                    </div>

                    <motion.div
                      key={lector.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-glass"
                    >
                      <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/45">
                        Pensamiento
                      </p>
                      <p className="mt-1 font-display text-[14px] italic leading-snug text-[#101927]">
                        "{lector.pensamiento}"
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/45">
                          Emoción
                        </span>
                        <span
                          className="rounded-full px-3 py-1 font-display text-[12px] font-semibold text-[#101927]"
                          style={{ backgroundColor: `${lector.color}40` }}
                        >
                          {lector.emocion}
                        </span>
                      </div>
                    </motion.div>

                    <p className="px-1 text-center text-[11.5px] italic text-[#101927]/60">
                      Mismo evento → distintos pensamientos → distintas emociones.
                    </p>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display text-[22px] font-bold leading-tight text-[#101927]">
                        El esquema A‑B‑C
                      </h2>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#101927]/70">
                        Entre el <strong>Evento</strong> y la <strong>Reacción</strong> hay un puente:
                        tu <strong>interpretación</strong>. Probá los dos caminos.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/70 bg-white/85 p-3 text-center shadow-glass">
                      <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/45">
                        A. Evento
                      </p>
                      <p className="mt-0.5 font-display text-[13px] font-semibold text-[#101927]">
                        La ventana cruje por la noche 🪟
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {CAMINOS_VENTANA.map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => setCamIdx(i)}
                          className={`rounded-2xl border p-3 transition ${
                            i === camIdx
                              ? "border-[#101927] shadow-glass"
                              : "border-white/70 opacity-60"
                          }`}
                          style={{ backgroundColor: i === camIdx ? `${c.color}30` : "white" }}
                        >
                          <div className="text-2xl">{c.emoji}</div>
                          <p className="mt-1 font-display text-[12px] font-semibold text-[#101927] leading-tight">
                            "{c.pensamiento}"
                          </p>
                        </button>
                      ))}
                    </div>

                    <motion.div
                      key={cam.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Row label="C. Emoción" value={cam.emocion} />
                      <Row label="Cuerpo" value={cam.cuerpo} />
                      <Row label="D. Conducta" value={cam.conducta} />
                    </motion.div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display text-[22px] font-bold leading-tight text-[#101927]">
                        Pensamientos automáticos
                      </h2>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#101927]/75">
                        Son ideas rápidas que aparecen sin que las invites. No las razonás,
                        <strong> brotan solas</strong>. Por eso muchas veces ni te das cuenta — solo
                        sentís la emoción.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-[#facb60]/40 bg-gradient-to-br from-white/85 to-[#facb60]/15 p-4 shadow-glass">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#92561a]">
                        La pregunta clave
                      </p>
                      <p className="mt-2 font-display text-[17px] font-bold leading-tight text-[#101927]">
                        “¿Qué acaba de pasar por mi mente?”
                      </p>
                      <p className="mt-2 text-[11.5px] leading-relaxed text-[#101927]/70">
                        Hacétela cada vez que notes un cambio en cómo te sentís. Es la puerta de
                        entrada para identificarlos.
                      </p>
                    </div>

                    <ul className="space-y-2 pt-1">
                      {[
                        "Aceptamos los pensamientos automáticos como ciertos sin chequearlos.",
                        "Si son disfuncionales, generan emociones y conductas que no querés.",
                        "Identificarlos te permite evaluarlos y modificarlos.",
                      ].map((t, i) => (
                        <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-[#101927]/80">
                          <span className="text-[#7cc2c8]">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display text-[22px] font-bold leading-tight text-[#101927]">
                        Pensamientos disfuncionales
                      </h2>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#101927]/70">
                        No son “buenos” o “malos” — son los que te <strong>generan malestar</strong>.
                        Algunos patrones típicos:
                      </p>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                      {DISTORSIONES.map((d, i) => (
                        <button
                          key={d.k}
                          onClick={() => setDistIdx(i)}
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                            i === distIdx
                              ? "border-[#101927] bg-[#101927] text-white"
                              : "border-white/80 bg-white/70 text-[#101927]/70"
                          }`}
                        >
                          {d.t}
                        </button>
                      ))}
                    </div>

                    <motion.div
                      key={dist.k}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-glass"
                    >
                      <p className="font-display text-[15px] font-bold text-[#101927]">{dist.t}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-[#101927]/75">
                        {dist.d}
                      </p>
                      <div className="mt-2.5 rounded-xl bg-[#facb60]/15 px-3 py-2">
                        <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
                          Ejemplo
                        </p>
                        <p className="mt-0.5 text-[11.5px] italic text-[#101927]/80">{dist.e}</p>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-white/60 bg-white/70 px-5 py-3 backdrop-blur-xl">
            <button
              onClick={prev}
              disabled={step === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-glass active:scale-95 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={finish}
              className="flex-1 rounded-full border border-[#101927]/10 bg-white py-2.5 font-display text-[12px] font-semibold text-[#101927] shadow-glass active:scale-[0.98]"
            >
              Saltar
            </button>
            <button
              onClick={next}
              className="flex-[1.4] rounded-full bg-[#101927] py-2.5 font-display text-[12px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(16,25,39,0.45)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {step === TOTAL - 1 ? "Empezar mi registro" : "Continuar"}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 rounded-2xl border border-white/70 bg-white/85 px-3 py-2 shadow-glass">
      <span className="w-20 shrink-0 text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/45">
        {label}
      </span>
      <span className="font-display text-[12px] font-semibold text-[#101927]">{value}</span>
    </div>
  );
}

export function IntroHelpButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-glass active:scale-95"
      aria-label="Ver explicación"
    >
      <HelpCircle size={14} className="text-[#7cc2c8]" />
    </button>
  );
}
