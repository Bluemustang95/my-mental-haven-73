import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Loader2, Sparkles, Wind } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn, localDateStr } from "@/lib/utils";
import { BackHeader, GlassPanel } from "./SleepGlass";

const SAFE_ENDINGS = [
  "Aparece una puerta de luz cálida y la cruzo con calma: del otro lado estoy en un lugar donde me siento protegido.",
  "Respiro hondo y descubro que puedo detener la escena: todo se vuelve silencioso y estoy a salvo.",
  "Alguien de confianza llega y me acompaña; juntos salimos caminando hacia un espacio tranquilo y luminoso.",
  "Mi cuerpo se llena de firmeza, miro la escena de frente y ésta se disuelve como niebla.",
];

export function NightmareProtocol({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [original, setOriginal] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const suggest = () => {
    setNewEnd(SAFE_ENDINGS[Math.floor(Math.random() * SAFE_ENDINGS.length)]);
    toast.success("Final seguro sugerido");
  };

  const finish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("dream_log").insert({
        user_id: user.id,
        dream_date: localDateStr(),
        description: `Pesadilla:\n${original}\n\nNuevo desenlace (IRT):\n${newEnd}`,
        themes: ["pesadilla", "IRT"],
        emotions: [],
      });
    }
    setSaving(false);
    toast.success("Guardado con éxito");
    setTimeout(onBack, 1100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
    >
      <BackHeader title="Protocolo de Pesadillas" onBack={onBack} />

      <div className="mb-5 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn("h-1.5 flex-1 rounded-full transition", n <= step ? "bg-[#7cc2c8]" : "bg-white/10")}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <StepHead n={1} label="Descarga original" />
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Escribí la pesadilla tal cual la recordás. Tratá de incluir colores, sonidos o cómo te sentías.
            </p>
            <GlassPanel className="mt-4 p-1">
              <textarea
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Estaba en un lugar oscuro y de repente…"
                className="h-48 w-full resize-none rounded-[24px] bg-transparent p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </GlassPanel>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!original.trim()}
              onClick={() => setStep(2)}
              className="mt-5 grid h-14 w-full place-items-center rounded-full bg-white font-semibold text-slate-900 disabled:opacity-50"
            >
              Siguiente Paso
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <StepHead n={2} label="Nuevo desenlace" />
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Reescribí el final. Llevá la escena hacia un lugar donde te sentís seguro y con control.
            </p>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={suggest}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-200 shadow-[0_0_18px_rgba(139,121,242,0.3)]"
            >
              <Sparkles size={16} /> Sugerir un final seguro
            </motion.button>

            <GlassPanel className="mt-4 p-1">
              <textarea
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                placeholder="Encuentro un escudo de luz y una puerta segura…"
                className="h-48 w-full resize-none rounded-[24px] bg-transparent p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </GlassPanel>

            <div className="mt-5 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(1)}
                className="h-14 flex-1 rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-200"
              >
                Atrás
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!newEnd.trim()}
                onClick={() => setStep(3)}
                className="h-14 flex-[1.4] rounded-full bg-[#7cc2c8] font-semibold text-slate-900 shadow-[0_0_24px_rgba(124,194,200,0.35)] disabled:opacity-50"
              >
                Ver Ensayo
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <StepHead n={3} label="Ensayo mental" />
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Leé este guion en silencio varias veces antes de dormir. Visualizalo con detalle.
            </p>

            <GlassPanel className="mt-4 p-5 leading-relaxed">
              <Brain size={20} className="mb-3 text-[#7cc2c8]" />
              <p className="text-sm text-slate-200">
                {original} <span className="font-semibold text-[#7cc2c8]">Pero ahora…</span> {newEnd}
              </p>
            </GlassPanel>

            <div className="mt-5 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(2)}
                className="h-14 flex-1 rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-200"
              >
                Atrás
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={saving}
                onClick={finish}
                className="h-14 flex-[1.4] rounded-full bg-[#7cc2c8] font-semibold text-slate-900 shadow-[0_0_24px_rgba(124,194,200,0.35)] disabled:opacity-50"
              >
                {saving ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Finalizar y Guardar"}
              </motion.button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Wind size={12} /> Repetir cada noche durante 1-2 semanas (IRT)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StepHead({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#7cc2c8] text-sm font-bold text-slate-900 shadow-[0_0_12px_rgba(124,194,200,0.5)]">
        {n}
      </span>
      <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </span>
    </div>
  );
}
