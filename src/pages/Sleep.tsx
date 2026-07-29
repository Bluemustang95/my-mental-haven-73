import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, CalendarDays, ChevronRight, ShieldAlert, Sparkles } from "lucide-react";
import { DreamDiary } from "@/components/sleep/DreamDiary";
import { NightmareProtocol } from "@/components/sleep/NightmareProtocol";
import { SleepCalendarSheet } from "@/components/sleep/SleepCalendarSheet";
import { SleepHygiene } from "@/components/sleep/SleepHygiene";
import { GlassPanel, NightAuras } from "@/components/sleep/SleepGlass";

type View = "dashboard" | "diary" | "hygiene" | "nightmare";

const SECTIONS: { id: Exclude<View, "dashboard">; title: string; icon: typeof BookOpen; glow: string }[] = [
  { id: "diary", title: "Diario de Sueño", icon: BookOpen, glow: "rgba(129,140,248,0.35)" },
  { id: "hygiene", title: "Psicohigiene del Sueño", icon: Sparkles, glow: "rgba(124,194,200,0.35)" },
  { id: "nightmare", title: "Protocolo de Pesadillas", icon: ShieldAlert, glow: "rgba(192,132,252,0.35)" },
];

export default function Sleep() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("dashboard");
  const [calendar, setCalendar] = useState(false);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden text-slate-100 no-scrollbar"
      style={{ background: "linear-gradient(180deg,#070b14 0%,#030712 100%)" }}
    >
      <NightAuras />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-28 pt-10">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div
              key="dash"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigate("/herramientas")}
                  aria-label="Volver"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06]"
                >
                  <ArrowLeft size={18} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setCalendar(true)}
                  aria-label="Abrir tracker de descanso"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-[#7cc2c8]"
                >
                  <CalendarDays size={18} />
                </motion.button>
              </div>

              <h1 className="font-mindful text-4xl leading-tight text-slate-50">Santuario del Sueño</h1>
              <p className="mt-1.5 text-sm text-slate-400">Tu espacio seguro para descansar.</p>

              <div className="mt-8 space-y-4">
                {SECTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i, duration: 0.35 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setView(s.id)}
                      className="w-full text-left"
                    >
                      <GlassPanel
                        className="flex items-center gap-4 p-6"
                        style={{ boxShadow: `0 20px 60px -40px ${s.glow}` }}
                      >
                        <span
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10"
                          style={{ background: s.glow.replace("0.35", "0.14") }}
                        >
                          <Icon size={20} className="text-slate-100" />
                        </span>
                        <span className="flex-1 font-mindful text-[21px] leading-snug text-slate-50">
                          {s.title}
                        </span>
                        <ChevronRight size={18} className="shrink-0 text-slate-500" />
                      </GlassPanel>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {view === "diary" && <DreamDiary key="diary" onBack={() => setView("dashboard")} />}
          {view === "hygiene" && <SleepHygiene key="hyg" onBack={() => setView("dashboard")} />}
          {view === "nightmare" && <NightmareProtocol key="nm" onBack={() => setView("dashboard")} />}
        </AnimatePresence>
      </div>

      <SleepCalendarSheet open={calendar} onOpenChange={setCalendar} />
    </div>
  );
}
