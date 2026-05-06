import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Moon, Smiley, SmileyMeh, SmileySad } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, localDateStr } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

type Quality = "good" | "ok" | "bad";
type SleepLog = { log_date: string; quality: Quality };
type View = "intro" | "checklist" | "diary" | "done";

const checklistItems = [
  "Dejé el celular fuera de la cama",
  "Bajé la temperatura del cuarto",
  "Hice mi registro de rumiación",
  "Sin pantallas 30 min antes",
  "Hice respiración pausada",
  "Cuarto a oscuras y en silencio",
  "Evité cafeína por la tarde",
  "Horario constante de dormir",
];

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

const parseLocalDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const qualityIcon: Record<Quality, typeof Smiley> = { good: Smiley, ok: SmileyMeh, bad: SmileySad };
const qualityColor: Record<Quality, string> = {
  good: "bg-resource-sleep-accent text-primary-foreground",
  ok: "bg-resource-sleep-accent/40 text-resource-sleep-accent",
  bad: "bg-destructive/70 text-primary-foreground",
};

export default function Sleep() {
  const navigate = useNavigate();
  const today = localDateStr();
  const [view, setView] = useState<View>("intro");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<Record<string, Quality>>({});
  const [savingTodayQuality, setSavingTodayQuality] = useState(false);

  // Load logs
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("sleep_log").select("log_date, quality").eq("user_id", user.id);
      if (data) {
        const map: Record<string, Quality> = {};
        (data as SleepLog[]).forEach((l) => { map[l.log_date] = l.quality; });
        setLogs(map);
      }
    })();
  }, []);

  const score = Math.round((checked.size / checklistItems.length) * 100);

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const saveQuality = async (quality: Quality) => {
    setSavingTodayQuality(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Iniciá sesión"); setSavingTodayQuality(false); return; }
    const { error } = await supabase.from("sleep_log").upsert({
      user_id: user.id, log_date: today, quality, score,
    }, { onConflict: "user_id,log_date" });
    setSavingTodayQuality(false);
    if (error) { toast.error("No se pudo guardar"); return; }
    setLogs((p) => ({ ...p, [today]: quality }));
    toast.success("Anotado en tu diario");
    setView("done");
  };

  const monthDays = useMemo(() => {
    const base = parseLocalDate(today);
    const y = base.getFullYear(), m = base.getMonth();
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(y, m + 1, 0).getDate();
    const blanks = Array.from({ length: offset }, () => null);
    const days = Array.from({ length: total }, (_, i) => localDateStr(new Date(y, m, i + 1)));
    return [...blanks, ...days];
  }, [today]);

  // INTRO
  if (view === "intro") {
    return (
      <div className="flex min-h-screen flex-col bg-resource-sleep-bg px-5 pt-12 pb-8 text-resource-sleep-accent safe-area-top">
        <button onClick={() => navigate("/herramientas")} className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-card/70 shadow-sm" aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <motion.div animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }} className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
            <img src={resmitaAvatar} alt="Resmita" className="h-full w-full object-contain drop-shadow-2xl" />
          </motion.div>
          <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-card/85 shadow-sm">
            <Moon size={30} weight="duotone" />
          </div>
          <div className="px-3 py-3 sm:px-6">
            <h1 className="mb-3 font-mindful text-3xl leading-tight sm:text-4xl">Sueño</h1>
            <p className="font-sans text-xs leading-6 text-resource-sleep-accent/75 sm:text-sm sm:leading-7">
              La psicohigiene del sueño son los pequeños hábitos que preparan tu mente y cuerpo para descansar. Dormir bien regula tu ánimo, ordena tus pensamientos y te ayuda a procesar las emociones del día.
            </p>
          </div>
          <button onClick={() => setView("checklist")} className="mt-2 w-full rounded-[3rem] bg-resource-sleep-accent px-8 py-4 font-mindful text-base font-bold text-primary-foreground shadow-lg shadow-resource-sleep-accent/25 active:scale-[0.98] sm:py-5">
            ¿Empezamos?
          </button>
        </div>
      </div>
    );
  }

  // CHECKLIST
  if (view === "checklist") {
    return (
      <div className="flex min-h-screen flex-col bg-resource-sleep-bg px-5 pt-12 pb-8 text-resource-sleep-accent safe-area-top">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={() => navigate("/herramientas")} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/70 shadow-sm" aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          <button onClick={() => setView("diary")} className="rounded-full bg-card/70 px-4 py-2 font-mindful text-xs font-semibold shadow-sm">Diario de sueño</button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-card/85 shadow-sm"><Moon size={28} weight="duotone" /></div>
          <div>
            <h1 className="font-mindful text-3xl leading-tight">Preparación nocturna</h1>
            <p className="font-sans text-xs leading-5 text-resource-sleep-accent/65">Anotá lo que ya hiciste y subí tu probabilidad de buen sueño.</p>
          </div>
        </div>

        {/* Medidor */}
        <div className="mb-6 rounded-[2.5rem] border border-resource-sleep-accent/15 bg-card/85 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-mindful text-sm font-semibold">Probabilidad de buen sueño</p>
            <motion.span key={score} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="font-mindful text-3xl font-bold">{score}%</motion.span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-resource-sleep-accent/10">
            <motion.div animate={{ width: `${score}%` }} transition={{ type: "spring", stiffness: 90, damping: 18 }} className="h-full rounded-full bg-gradient-to-r from-resource-sleep-accent/60 to-resource-sleep-accent" />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {checklistItems.map((item, i) => {
            const isChecked = checked.has(i);
            return (
              <motion.button
                key={item}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(i)}
                className={cn("flex w-full items-center gap-3 rounded-[2rem] border p-4 text-left transition", isChecked ? "border-resource-sleep-accent bg-resource-sleep-accent/10" : "border-resource-sleep-accent/15 bg-card/70")}
              >
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition", isChecked ? "border-resource-sleep-accent bg-resource-sleep-accent text-primary-foreground" : "border-resource-sleep-accent/30")}>
                  {isChecked && <Check size={16} weight="bold" />}
                </span>
                <span className="font-sans text-sm font-semibold leading-5">{item}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Quality buttons */}
        <div className="mt-6 rounded-[2.5rem] border border-resource-sleep-accent/15 bg-card/85 p-5 shadow-sm">
          <p className="mb-3 font-mindful text-sm font-semibold">¿Cómo dormiste anoche?</p>
          <div className="grid grid-cols-3 gap-2">
            {(["good", "ok", "bad"] as Quality[]).map((q) => {
              const Icon = qualityIcon[q];
              const labels = { good: "Bien", ok: "Regular", bad: "Mal" } as const;
              return (
                <button key={q} disabled={savingTodayQuality} onClick={() => saveQuality(q)} className={cn("flex flex-col items-center gap-1 rounded-2xl py-3 font-mindful text-xs font-semibold transition active:scale-95", logs[today] === q ? qualityColor[q] : "bg-resource-sleep-bg/80 text-resource-sleep-accent/75")}>
                  <Icon size={26} weight="duotone" />
                  {labels[q]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // DIARY (mini calendar)
  if (view === "diary") {
    return (
      <div className="flex min-h-screen flex-col bg-resource-sleep-bg px-5 pt-12 pb-8 text-resource-sleep-accent safe-area-top">
        <div className="mb-5 flex items-center gap-3">
          <button onClick={() => setView("checklist")} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/70 shadow-sm" aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-mindful text-2xl leading-tight">Diario de sueño</h1>
        </div>

        <p className="mb-4 font-sans text-xs leading-5 text-resource-sleep-accent/70">Detectá patrones a lo largo del mes.</p>

        <div className="rounded-[2.5rem] border border-resource-sleep-accent/15 bg-card/85 p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-resource-sleep-accent/55">
            {weekDays.map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {monthDays.map((date, i) => {
              if (!date) return <span key={`b-${i}`} />;
              const q = logs[date];
              const Icon = q ? qualityIcon[q] : null;
              const isToday = date === today;
              return (
                <div key={date} className={cn("flex aspect-square flex-col items-center justify-center rounded-xl text-[10px] font-bold", q ? qualityColor[q] : "bg-resource-sleep-bg/60 text-resource-sleep-accent/60", isToday && !q && "ring-2 ring-resource-sleep-accent")}>
                  <span>{parseLocalDate(date).getDate()}</span>
                  {Icon && <Icon size={12} weight="fill" className="mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-[2rem] border border-resource-sleep-accent/15 bg-card/70 p-4">
          <p className="font-mindful text-sm font-semibold">Referencias</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-resource-sleep-accent" /> Bien</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-resource-sleep-accent/40" /> Regular</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-destructive/70" /> Mal</span>
          </div>
        </div>
      </div>
    );
  }

  // DONE
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-resource-sleep-bg px-5 py-8 text-center text-resource-sleep-accent safe-area-top">
      <motion.div initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="mx-auto mb-7 flex h-24 w-24 items-center justify-center">
          <img src={resmitaAvatar} alt="Resmita" className="h-20 w-20 object-contain drop-shadow-md" />
        </motion.div>
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-card/80 shadow-xl">
          <Check size={40} weight="bold" />
        </div>
        <h1 className="font-mindful text-3xl leading-tight">Dulces sueños</h1>
        <p className="mt-4 font-sans text-xs leading-6 text-resource-sleep-accent/75 sm:text-sm">Cada noche que registrás te acerca a un descanso más profundo.</p>
        <div className="mt-8 flex w-full gap-3">
          <button onClick={() => setView("diary")} className="flex-1 rounded-[3rem] border border-resource-sleep-accent/20 bg-card/85 py-4 font-mindful text-sm font-bold shadow-sm active:scale-[0.98]">Ver diario</button>
          <button onClick={() => navigate("/herramientas")} className="flex-1 rounded-[3rem] bg-resource-sleep-accent py-4 font-mindful text-sm font-bold text-primary-foreground shadow-lg active:scale-[0.98]">Cerrar</button>
        </div>
      </motion.div>
    </div>
  );
}
