import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn, localDateStr } from "@/lib/utils";
import { BackHeader, GlassPanel } from "./SleepGlass";

const PROMPTS = [
  { label: "¿Por qué soñé esto?", text: "Creo que soñé esto porque…\n\n" },
  { label: "¿Qué pasó hoy?", text: "Hoy durante el día pasó que…\n\n" },
  { label: "Emociones de hoy", text: "Las emociones que llevo a la cama son…\n\n" },
];
const EMOTIONS = ["Tranquilidad", "Ansiedad", "Tristeza", "Alivio", "Enojo", "Miedo"];
const BEHAVIORS = ["Pantallas", "Cafeína", "Lectura", "Ejercicio", "Alcohol"];

export function DreamDiary({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [emos, setEmos] = useState<Set<string>>(new Set());
  const [behs, setBehs] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (snippet: string) => {
    setText((t) => (t ? t + "\n" + snippet : snippet));
    requestAnimationFrame(() => ref.current?.focus());
  };

  const toggle = (s: Set<string>, set: (n: Set<string>) => void, v: string) => {
    const n = new Set(s);
    n.has(v) ? n.delete(v) : n.add(v);
    set(n);
  };

  const save = async () => {
    if (!text.trim()) {
      toast.error("Escribí algo antes de guardar");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Iniciá sesión");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("dream_log").insert({
      user_id: user.id,
      description: text,
      dream_date: localDateStr(),
      emotions: Array.from(emos),
      themes: Array.from(behs),
    });
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success("Guardado en tu tracker nocturno");
    setTimeout(onBack, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
    >
      <BackHeader title="Diario de Sueño" onBack={onBack} />

      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7cc2c8]">
        Descarga mental y registro de sueños
      </p>

      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {PROMPTS.map((p, i) => (
          <motion.button
            key={p.label}
            whileTap={{ scale: 0.95 }}
            onClick={() => insert(p.text)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
              i === 0
                ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-200"
                : "border-white/10 bg-white/[0.04] text-slate-200",
            )}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      <GlassPanel className="mt-4 p-1">
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí lo que soñaste o volcá los pensamientos que no te dejan dormir…"
          className="h-52 w-full resize-none rounded-[24px] bg-transparent p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </GlassPanel>

      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "mt-4 flex w-full items-center justify-between rounded-[26px] border border-white/[0.12] bg-slate-950/65 p-4 text-left backdrop-blur-[30px]",
        )}
      >
        <span className="font-semibold text-slate-100">Contexto de la noche</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <GlassPanel className="mt-2 space-y-4 p-4">
              <ChipGroup
                title="Emociones antes de dormir"
                options={EMOTIONS}
                selected={emos}
                onToggle={(v) => toggle(emos, setEmos, v)}
              />
              <ChipGroup
                title="Conductas previas"
                options={BEHAVIORS}
                selected={behs}
                onToggle={(v) => toggle(behs, setBehs, v)}
              />
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={saving}
        onClick={save}
        className="mt-5 grid h-14 w-full place-items-center rounded-full bg-[#7cc2c8] font-semibold text-slate-900 shadow-[0_0_24px_rgba(124,194,200,0.3)] disabled:opacity-60"
      >
        {saving ? <Loader2 className="animate-spin" size={18} /> : "Guardar registro"}
      </motion.button>
    </motion.div>
  );
}

function ChipGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.has(o);
          return (
            <motion.button
              key={o}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggle(o)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                on
                  ? "border-[#7cc2c8] bg-[#7cc2c8]/15 text-[#7cc2c8]"
                  : "border-white/10 bg-white/[0.03] text-slate-300",
              )}
            >
              {o}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
