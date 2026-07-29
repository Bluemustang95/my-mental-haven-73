import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn, localDateStr } from "@/lib/utils";
import { BackHeader, GlassPanel, ProgressRing } from "./SleepGlass";

/** Las 6 reglas de oro de psicohigiene del sueño. */
export const HYGIENE_RULES = [
  { id: "ambiente", text: "Mantener el cuarto fresco, ventilado y oscuro." },
  { id: "pantallas", text: "Desconexión total de pantallas digitales 1 hora antes." },
  { id: "estimulantes", text: "Evitar cafeína y estimulantes después de las 16:00 hs." },
  { id: "cena", text: "Cenar ligero al menos dos horas antes de acostarse." },
  { id: "circadiano", text: "Establecer un horario constante para despertarse." },
  { id: "cama", text: "Reservar el uso de la cama exclusivamente para dormir." },
];

export function SleepHygiene({ onBack }: { onBack: () => void }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const pct = (checked.size / HYGIENE_RULES.length) * 100;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("sleep_hygiene_audits")
        .select("answers")
        .eq("user_id", user.id)
        .eq("audit_date", localDateStr())
        .maybeSingle();
      const answers = (data as any)?.answers;
      if (Array.isArray(answers)) setChecked(new Set(answers as string[]));
    })();
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Iniciá sesión");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("sleep_hygiene_audits").upsert(
      {
        user_id: user.id,
        audit_date: localDateStr(),
        score: Math.round(pct),
        answers: Array.from(checked),
      } as any,
      { onConflict: "user_id,audit_date" },
    );
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success("Psicohigiene registrada");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
    >
      <BackHeader title="Psicohigiene del Sueño" onBack={onBack} />

      <GlassPanel className="flex items-center gap-5 p-5">
        <ProgressRing value={pct} label="Cumplido" />
        <div className="min-w-0">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7cc2c8]">
            Verificación de hoy
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
            {checked.size} de {HYGIENE_RULES.length} pautas ambientales y de hábitos cumplidas.
          </p>
        </div>
      </GlassPanel>

      <div className="mt-4 space-y-2.5">
        {HYGIENE_RULES.map((r) => {
          const on = checked.has(r.id);
          return (
            <motion.button
              key={r.id}
              whileTap={{ scale: 0.985 }}
              onClick={() => toggle(r.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-[22px] border p-4 text-left transition",
                on
                  ? "border-[#7cc2c8]/40 bg-[#7cc2c8]/[0.08]"
                  : "border-white/[0.09] bg-white/[0.03]",
              )}
            >
              <span className={cn("flex-1 text-[13.5px] leading-relaxed", on ? "text-slate-100" : "text-slate-300")}>
                {r.text}
              </span>
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border transition",
                  on ? "border-[#7cc2c8] bg-[#7cc2c8] text-slate-900" : "border-white/20",
                )}
              >
                {on && <Check size={15} strokeWidth={3} />}
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={saving}
        onClick={save}
        className="mt-5 grid h-14 w-full place-items-center rounded-full bg-[#7cc2c8] font-semibold text-slate-900 shadow-[0_0_24px_rgba(124,194,200,0.3)] disabled:opacity-60"
      >
        {saving ? <Loader2 className="animate-spin" size={18} /> : "Guardar verificación"}
      </motion.button>
    </motion.div>
  );
}
