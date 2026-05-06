import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarBlank, Check, Confetti, DownloadSimple, JarLabel, WarningCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Wine } from "lucide-react";
import { jsPDF } from "jspdf";
import { cn, localDateStr } from "@/lib/utils";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

type DayStatus = "success" | "relapse";
type RecoveryEntry = { status: DayStatus; triggers?: string[] };
type RecoverySettings = { startDate: string; dailySpend: number };
type RecoveryState = { settings: RecoverySettings | null; entries: Record<string, RecoveryEntry> };
type View = "setup" | "dashboard" | "day" | "urge" | "done";

const STORAGE_KEY = "resma-recovery-monitor-v1";
const triggers = ["Estrés", "Conflicto familiar/pareja", "Cansancio", "Soledad", "Entorno social", "Aburrimiento"];
const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const daysBetween = (from: string, to: string) => {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
};

const currency = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export default function Recovery() {
  const navigate = useNavigate();
  const today = localDateStr();
  const [view, setView] = useState<View>("setup");
  const [settings, setSettings] = useState<RecoverySettings>({ startDate: today, dailySpend: 0 });
  const [entries, setEntries] = useState<Record<string, RecoveryEntry>>({});
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [relapseDraftOpen, setRelapseDraftOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as RecoveryState;
      if (parsed.settings) {
        setSettings(parsed.settings);
        setEntries(parsed.entries || {});
        setView("dashboard");
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (view === "setup") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, entries }));
  }, [settings, entries, view]);

  const monthDays = useMemo(() => {
    const base = parseLocalDate(selectedDate || today);
    const year = base.getFullYear();
    const month = base.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: offset }, () => null);
    const days = Array.from({ length: total }, (_, index) => localDateStr(new Date(year, month, index + 1)));
    return [...blanks, ...days];
  }, [selectedDate, today]);

  const stats = useMemo(() => {
    const datedEntries = Object.entries(entries).filter(([date]) => date >= settings.startDate && date <= today);
    const successes = datedEntries.filter(([, entry]) => entry.status === "success").length;
    const relapses = datedEntries.filter(([, entry]) => entry.status === "relapse").length;
    const amount = Math.max(0, (successes - relapses) * Number(settings.dailySpend || 0));
    let streak = 0;
    const start = parseLocalDate(settings.startDate);
    let cursor = parseLocalDate(today);
    while (cursor >= start) {
      const key = localDateStr(cursor);
      const entry = entries[key];
      if (!entry) {
        if (key === today) {
          cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
          continue;
        }
        break;
      }
      if (entry.status !== "success") break;
      streak += 1;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    }
    const triggerCounts = datedEntries.flatMap(([, entry]) => entry.triggers || []).reduce<Record<string, number>>((acc, trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1;
      return acc;
    }, {});
    return { successes, relapses, amount, streak, triggerCounts };
  }, [entries, settings, today]);

  const jarLevel = Math.min(92, 12 + stats.successes * 8 - stats.relapses * 6);
  const elapsedDays = daysBetween(settings.startDate, today) + 1;

  const saveSetup = () => {
    const next = { startDate: settings.startDate || today, dailySpend: Number(settings.dailySpend || 0) };
    setSettings(next);
    setView("dashboard");
  };

  const openDate = (date: string | null) => {
    if (!date || date !== today) return;
    setSelectedDate(date);
    setSelectedTriggers(entries[date]?.triggers || []);
    setRelapseDraftOpen(entries[date]?.status === "relapse");
    setView("day");
  };

  const markSuccess = () => {
    setEntries((prev) => ({ ...prev, [today]: { status: "success" } }));
    setRelapseDraftOpen(false);
    setShowConfetti(true);
    setView("dashboard");
    window.setTimeout(() => setShowConfetti(false), 1800);
  };

  const markRelapse = () => {
    setEntries((prev) => ({ ...prev, [today]: { status: "relapse", triggers: selectedTriggers } }));
    setRelapseDraftOpen(false);
    setView("dashboard");
  };

  const downloadReport = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const monthLabel = parseLocalDate(selectedDate).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    const frequentTriggers = Object.entries(stats.triggerCounts).sort((a, b) => b[1] - a[1]);

    doc.setFillColor(245, 243, 255);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Reporte de Recuperación - RESMA", 15, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fecha: ${today}`, 15, 28);
    doc.text(`Inicio del proceso: ${settings.startDate}`, 15, 34);

    doc.setDrawColor(124, 58, 237);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 44, 180, 36, 4, 4, "FD");
    doc.setTextColor(42, 28, 73);
    doc.setFont("helvetica", "bold");
    doc.text(`Racha actual: ${stats.streak} días`, 22, 55);
    doc.text(`Ahorro acumulado: $${currency.format(stats.amount)}`, 22, 64);
    doc.text(`Días exitosos: ${stats.successes} · Recaídas: ${stats.relapses}`, 22, 73);

    doc.setTextColor(124, 58, 237);
    doc.setFontSize(13);
    doc.text(`Calendario de ${monthLabel}`, 15, 96);
    const cell = 10;
    const startX = 18;
    const startY = 106;
    weekDays.forEach((day, index) => doc.text(day, startX + index * 24, startY));
    monthDays.forEach((date, index) => {
      if (!date) return;
      const row = Math.floor(index / 7);
      const col = index % 7;
      const x = startX + col * 24;
      const y = startY + 10 + row * 14;
      const entry = entries[date];
      if (entry?.status === "success") doc.setFillColor(124, 58, 237);
      else if (entry?.status === "relapse") doc.setFillColor(249, 115, 22);
      else doc.setFillColor(255, 255, 255);
      doc.circle(x + 3, y - 2, cell / 2, "F");
      doc.setTextColor(entry ? 255 : 42, entry ? 255 : 28, entry ? 255 : 73);
      doc.setFontSize(9);
      doc.text(String(parseLocalDate(date).getDate()), x, y);
    });

    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Disparadores más frecuentes", 15, 205);
    doc.setTextColor(42, 28, 73);
    doc.setFont("helvetica", "normal");
    if (frequentTriggers.length) {
      frequentTriggers.slice(0, 6).forEach(([trigger, count], index) => doc.text(`${trigger}: ${count}`, 20, 217 + index * 7));
    } else {
      doc.text("Sin disparadores registrados este mes.", 20, 217);
    }

    doc.save(`reporte-recuperacion-resma-${today}.pdf`);
  };

  const triggerToggle = (trigger: string) => {
    setSelectedTriggers((prev) => prev.includes(trigger) ? prev.filter((item) => item !== trigger) : [...prev, trigger]);
  };

  if (view === "setup") {
    return (
      <div className="flex min-h-screen flex-col bg-resource-recovery-bg px-5 pt-12 pb-6 text-resource-recovery-accent safe-area-top">
        <button onClick={() => navigate("/herramientas")} className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center text-center">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="mb-4 flex h-20 w-20 items-center justify-center">
            <img src={resmitaAvatar} alt="Resmita" className="h-16 w-16 object-contain drop-shadow-md" />
          </motion.div>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-card/80 shadow-sm shadow-resource-recovery-accent/10">
            <Wine size={34} strokeWidth={2.2} />
          </div>
          <h1 className="mb-3 font-mindful text-3xl leading-tight sm:text-4xl">Recuperación</h1>
          <p className="max-w-sm font-sans text-xs font-normal leading-6 text-resource-recovery-accent/75 sm:text-sm sm:leading-7">
            Tomar consciencia de tus hábitos es el primer paso para el cambio. Mirá cuánto venís ganando en salud y tiempo.
          </p>
          <div className="mt-8 w-full space-y-4 text-left">
            <label className="block rounded-[2.25rem] border border-resource-recovery-accent/15 bg-card/85 p-5 shadow-sm">
              <span className="mb-2 block font-display text-sm font-semibold">¿Cuál es tu fecha de inicio en este proceso?</span>
              <input type="date" value={settings.startDate} max={today} onChange={(event) => setSettings({ ...settings, startDate: event.target.value })} className="w-full bg-transparent text-base font-semibold outline-none" />
            </label>
            <label className="block rounded-[2.25rem] border border-resource-recovery-accent/15 bg-card/85 p-5 shadow-sm">
              <span className="mb-2 block font-display text-sm font-semibold">¿Cuánto dinero estimás que gastabas por día en el consumo?</span>
              <input type="number" min="0" inputMode="numeric" value={settings.dailySpend || ""} onChange={(event) => setSettings({ ...settings, dailySpend: Number(event.target.value) })} placeholder="$" className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-resource-recovery-accent/35" />
            </label>
          </div>
          <button onClick={saveSetup} className="mt-auto w-full rounded-[3rem] bg-resource-recovery-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-recovery-accent/25 active:scale-[0.98]">
            Empezar
          </button>
        </motion.div>
      </div>
    );
  }

  if (view === "urge") {
    return (
      <div className="flex min-h-screen flex-col bg-resource-recovery-bg px-5 pt-14 pb-6 text-resource-recovery-accent transition-colors duration-500 safe-area-top">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => setView("dashboard")} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm"><ArrowLeft size={20} /></button>
          <div><p className="font-mindful text-2xl leading-tight">Tengo ganas de consumir</p><p className="font-sans text-xs font-normal leading-5 text-resource-recovery-accent/65">Elegí una herramienta rápida</p></div>
        </div>
        <div className="flex flex-1 flex-col justify-center space-y-4">
          <div className="rounded-[3rem] border border-resource-recovery-accent/15 bg-card/85 p-6 text-center shadow-sm">
            <WarningCircle className="mx-auto mb-4" size={42} weight="duotone" />
            <h1 className="font-mindful text-3xl leading-tight">No te rindas</h1>
            <p className="mt-3 font-sans text-xs font-normal leading-6 text-resource-recovery-accent/70 sm:text-sm">Un impulso sube y baja. Elegí algo concreto para atravesar este momento.</p>
          </div>
          <button onClick={() => navigate("/herramientas/regulacion-emocional?tool=stop")} className="rounded-[3rem] bg-resource-recovery-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-recovery-accent/20 active:scale-[0.98]">Necesito frenar ahora (STOP)</button>
          <button onClick={() => navigate("/herramientas/regulacion-emocional?tool=tip&step=temperatura")} className="rounded-[3rem] border border-resource-recovery-accent/20 bg-card/85 py-4 font-display text-base font-semibold shadow-sm active:scale-[0.98]">Usar hielo (TIP)</button>
          <button onClick={() => navigate("/herramientas/rumiacion")} className="rounded-[3rem] border border-resource-recovery-accent/20 bg-card/85 py-4 font-display text-base font-semibold shadow-sm active:scale-[0.98]">Hacer un registro de rumiación</button>
        </div>
      </div>
    );
  }

  if (view === "day") {
    const relapseMode = relapseDraftOpen || entries[today]?.status === "relapse";
    return (
      <div className="flex min-h-screen flex-col bg-resource-recovery-bg px-5 pt-14 pb-6 text-resource-recovery-accent safe-area-top">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => setView("dashboard")} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm"><ArrowLeft size={20} /></button>
          <div><p className="font-display text-lg font-semibold">Registro de hoy</p><p className="text-xs font-semibold text-resource-recovery-accent/65">Elegí cómo fue tu día</p></div>
        </div>
        <div className="space-y-4">
          <button onClick={markSuccess} className="flex w-full items-center justify-center gap-2 rounded-[3rem] bg-resource-recovery-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-recovery-accent/20 active:scale-[0.98]">
            <Check size={20} weight="bold" /> Logré mi objetivo
          </button>
          <div className="rounded-[3rem] border border-resource-recovery-relapse/20 bg-card/85 p-5 shadow-sm">
            <button onClick={() => setRelapseDraftOpen(true)} className="w-full rounded-[2.5rem] bg-resource-recovery-relapse/10 py-3.5 font-display text-sm font-semibold text-resource-recovery-relapse active:scale-[0.98]">Tuve una recaída</button>
            <AnimatePresence>
              {relapseMode && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <p className="mt-5 text-sm font-semibold leading-6 text-resource-recovery-accent/70">Elegí los disparadores que estuvieron presentes.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {triggers.map((trigger) => (
                      <button key={trigger} onClick={() => triggerToggle(trigger)} className={cn("rounded-2xl border px-3 py-2 text-xs font-semibold transition", selectedTriggers.includes(trigger) ? "border-resource-recovery-relapse bg-resource-recovery-relapse text-primary-foreground" : "border-resource-recovery-accent/15 bg-resource-recovery-bg/60 text-resource-recovery-accent/70")}>{trigger}</button>
                    ))}
                  </div>
                  <p className="mt-5 rounded-[2rem] bg-resource-recovery-bg/80 p-4 text-sm font-semibold leading-6 text-resource-recovery-accent/75">Un tropiezo no define tu camino. Lo importante es que hoy estás acá registrándolo. Mañana volvemos a empezar juntos.</p>
                  <button onClick={markRelapse} className="mt-4 w-full rounded-[2.5rem] bg-resource-recovery-relapse py-3.5 font-display text-sm font-semibold text-primary-foreground active:scale-[0.98]">Guardar registro</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  if (view === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-resource-recovery-bg px-5 py-8 text-center text-resource-recovery-accent safe-area-top">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }} className="mx-auto mb-7 flex h-24 w-24 items-center justify-center">
            <img src={resmitaAvatar} alt="Resmita" className="h-20 w-20 object-contain drop-shadow-md" />
          </motion.div>
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-card/85 shadow-xl shadow-resource-recovery-accent/10">
            <Confetti size={40} weight="duotone" />
          </div>
          <h1 className="font-mindful text-3xl leading-tight">Seguís caminando</h1>
          <p className="mt-4 font-sans text-xs font-normal leading-6 text-resource-recovery-accent/75 sm:text-sm sm:leading-7">Cada registro suma claridad. No te rindas.</p>
          <button onClick={() => navigate("/herramientas")} className="mt-9 w-full rounded-[3rem] bg-resource-recovery-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-recovery-accent/20 active:scale-[0.98]">Cerrar</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-resource-recovery-bg px-5 pt-12 pb-6 text-resource-recovery-accent transition-colors duration-500 safe-area-top">
      <AnimatePresence>
        {showConfetti && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
            {Array.from({ length: 22 }).map((_, index) => (
              <motion.span key={index} initial={{ y: -20, x: `${8 + (index * 4) % 84}vw`, rotate: 0, opacity: 1 }} animate={{ y: "92vh", rotate: 360, opacity: [1, 1, 0] }} transition={{ duration: 1.5 + (index % 4) * 0.12, ease: "easeOut" }} className="absolute top-0 text-resource-recovery-accent">✦</motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-5 flex items-start justify-between">
        <button onClick={() => navigate("/herramientas")} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm"><ArrowLeft size={20} /></button>
        <button onClick={() => setView("done")} className="rounded-full bg-card/70 px-4 py-2 text-xs font-semibold shadow-sm">Cerrar</button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-card/85 shadow-sm shadow-resource-recovery-accent/10"><Wine size={28} /></div>
        <div>
          <h1 className="font-mindful text-3xl leading-tight">Recuperación</h1>
          <p className="font-sans text-xs font-normal leading-5 text-resource-recovery-accent/65">Día {elapsedDays} de tu proceso</p>
        </div>
      </div>

      <button onClick={() => setView("urge")} className="mb-4 flex w-full items-center justify-center gap-2 rounded-[3rem] bg-resource-recovery-relapse py-3.5 font-sans text-sm font-bold text-primary-foreground shadow-xl shadow-resource-recovery-relapse/30 ring-2 ring-resource-recovery-relapse/15 active:scale-[0.98]">
        <WarningCircle size={19} weight="bold" /> Tengo ganas de consumir
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[3rem] border border-resource-recovery-accent/15 bg-card/85 p-5 shadow-sm">
          <span className="text-3xl" aria-hidden="true">🔥</span>
          <p className="mt-4 font-display text-3xl font-semibold">{stats.streak}</p>
          <p className="text-xs font-semibold leading-5 text-resource-recovery-accent/65">Llevás {stats.streak} días de racha</p>
        </div>
        <div className="rounded-[3rem] border border-resource-recovery-accent/15 bg-card/85 p-5 shadow-sm">
          <CalendarBlank size={28} weight="duotone" />
          <p className="mt-4 font-display text-3xl font-semibold">{stats.successes}</p>
          <p className="text-xs font-semibold leading-5 text-resource-recovery-accent/65">días exitosos registrados</p>
        </div>
      </div>

      <div className="mt-3 rounded-[3rem] border border-resource-recovery-accent/15 bg-card/85 p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-48 w-32 flex-col justify-end overflow-hidden rounded-b-[2.5rem] rounded-t-xl border-4 border-resource-recovery-accent/20 bg-resource-recovery-bg/60 shadow-inner">
          <div className="mx-auto mb-2 rounded-full bg-card px-3 py-1 text-[10px] font-bold text-resource-recovery-accent shadow-sm">Para mi meta</div>
          <motion.div animate={{ height: `${Math.max(8, jarLevel)}%` }} transition={{ type: "spring", stiffness: 70, damping: 16 }} className="relative rounded-t-[2rem] bg-resource-recovery-accent/75">
            <div className="absolute inset-x-2 top-2 flex flex-wrap justify-center gap-1 text-xs text-resource-recovery-bg">{Array.from({ length: Math.min(18, stats.successes) }).map((_, index) => <span key={index}>●</span>)}</div>
          </motion.div>
        </div>
        <JarLabel className="mx-auto mb-2" size={24} weight="duotone" />
        <p className="font-display text-2xl font-semibold">Ahorraste ${currency.format(stats.amount)} hasta hoy</p>
      </div>

      <div className="mt-3 rounded-[3rem] border border-resource-recovery-accent/15 bg-card/85 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="font-display text-base font-semibold">Calendario mensual</p>
          <p className="text-xs font-semibold text-resource-recovery-accent/60">Tocá hoy</p>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-resource-recovery-accent/55">{weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {monthDays.map((date, index) => {
            const entry = date ? entries[date] : null;
            const isToday = date === today;
            return (
              <button key={date || `blank-${index}`} onClick={() => openDate(date)} disabled={!isToday} className={cn("aspect-square rounded-full text-xs font-bold transition", !date && "opacity-0", entry?.status === "success" && "bg-resource-recovery-accent text-primary-foreground", entry?.status === "relapse" && "bg-resource-recovery-relapse text-primary-foreground", !entry && isToday && "border-2 border-resource-recovery-accent bg-card", !entry && !isToday && "bg-resource-recovery-bg/50 text-resource-recovery-accent/45", isToday && "shadow-sm")}>{date ? parseLocalDate(date).getDate() : ""}</button>
            );
          })}
        </div>
      </div>

      <button onClick={downloadReport} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[3rem] border border-resource-recovery-accent/20 bg-card/85 py-4 font-display text-sm font-semibold shadow-sm active:scale-[0.98]">
        <DownloadSimple size={19} weight="bold" /> Descargar progreso para mi terapeuta
      </button>
    </div>
  );
}
