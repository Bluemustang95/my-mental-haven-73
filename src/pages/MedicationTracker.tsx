import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Check, Clock, Trash2, Pill, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SIDE_EFFECTS = ["Somnolencia", "Náuseas", "Mareo", "Dolor de cabeza", "Insomnio", "Sequedad bucal", "Cambio de apetito", "Otro"];
const TIME_SLOTS = ["Madrugada", "Mañana", "Tarde", "Noche"];

type Med = { id: string; name: string; dosage: string | null; frequency: string | null; reminder_time: string | null; active: boolean };
type MedLog = { id: string; medication_id: string; taken: boolean; side_effects: string[]; note: string | null; log_date: string; taken_at: string | null };

export default function MedicationTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meds, setMeds] = useState<Med[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [monthAdherence, setMonthAdherence] = useState<number | null>(null);
  const [expandedMed, setExpandedMed] = useState<string | null>(null);
  const [logSideEffects, setLogSideEffects] = useState<Record<string, string[]>>({});
  const todayStr = localDateStr();

  useEffect(() => {
    if (!user) return;
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = localDateStr(monthStart);
    Promise.all([
      supabase.from("medications").select("*").eq("user_id", user.id).eq("active", true).order("created_at"),
      supabase.from("medication_logs").select("*").eq("user_id", user.id).eq("log_date", todayStr),
      supabase.from("medication_logs").select("id, taken, log_date").eq("user_id", user.id).gte("log_date", monthStartStr),
    ]).then(([medsRes, logsRes, monthRes]) => {
      const medsList = (medsRes.data as Med[]) ?? [];
      setMeds(medsList);
      setLogs((logsRes.data as MedLog[]) ?? []);
      // Adherencia = tomas registradas / (dosis diarias × días transcurridos)
      const dailyDoses = medsList.length;
      const daysElapsed = new Date().getDate();
      const expected = dailyDoses * daysElapsed;
      const taken = ((monthRes.data as { taken: boolean }[]) ?? []).filter((l) => l.taken).length;
      setMonthAdherence(expected > 0 ? Math.round((taken / expected) * 100) : null);
    });
  }, [user, todayStr]);

  // Adding a medication is now handled in a dedicated flow (biblioteca → dose setup)

  const deleteMed = async (id: string) => {
    await supabase.from("medications").delete().eq("id", id);
    setMeds((m) => m.filter((x) => x.id !== id));
  };

  const logMed = async (medId: string) => {
    if (!user) return;
    const existing = logs.find((l) => l.medication_id === medId);
    if (existing) return;
    const effects = logSideEffects[medId] ?? [];
    const { data } = await supabase
      .from("medication_logs")
      .insert({ user_id: user.id, medication_id: medId, taken: true, side_effects: effects, log_date: todayStr, taken_at: new Date().toISOString() })
      .select("*")
      .single();
    if (data) setLogs((l) => [...l, data as MedLog]);
  };

  const toggleSideEffect = (medId: string, effect: string) => {
    setLogSideEffects((prev) => {
      const current = prev[medId] ?? [];
      return { ...prev, [medId]: current.includes(effect) ? current.filter((e) => e !== effect) : [...current, effect] };
    });
  };

  const isTaken = (medId: string) => logs.some((l) => l.medication_id === medId);

  // Group meds by time slot
  const grouped = TIME_SLOTS.map((slot) => ({
    slot,
    meds: meds.filter((m) => (m.frequency || "Mañana") === slot),
  })).filter((g) => g.meds.length > 0);

  const takenCount = meds.filter((m) => isTaken(m.id)).length;

  return (
    <div className="px-5 pt-14 pb-36 safe-area-top bg-[hsl(var(--background))]">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => navigate("/mi-proceso")} className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Mi Proceso
        </button>
        <button
          onClick={() => navigate("/mi-proceso/medicacion/biblioteca?mode=info")}
          aria-label="Información de medicamentos"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm text-muted-foreground active:scale-95 transition-transform"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div className="mt-3 mb-1 flex items-center gap-2">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Pill size={22} className="text-[hsl(var(--accent))]" /> Medicación
        </h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Registrá tu toma diaria y efectos secundarios.</p>

      {/* Progress */}
      {meds.length > 0 && (
        <div className="mb-5 rounded-2xl bg-card p-4 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-display">Progreso de hoy</span>
            <span className="text-xs font-medium font-display">{takenCount}/{meds.length}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[hsl(var(--accent))]"
              initial={{ width: 0 }}
              animate={{ width: meds.length > 0 ? `${(takenCount / meds.length) * 100}%` : "0%" }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}


      {/* Medications by time slot */}
      {meds.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
          <Pill size={32} className="mx-auto mb-3 text-[hsl(var(--accent))]" />
          <p className="font-display text-sm font-medium">Sin medicamentos registrados</p>
          <p className="mt-1 text-xs text-muted-foreground">Tocá el botón + para agregar tu medicación.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ slot, meds: slotMeds }) => (
            <div key={slot}>
              <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">{slot}</p>
              <div className="space-y-3">
                {slotMeds.map((med) => {
                  const taken = isTaken(med.id);
                  const effects = logSideEffects[med.id] ?? [];
                  const expanded = expandedMed === med.id;
                  const logEntry = logs.find((l) => l.medication_id === med.id);

                  return (
                    <motion.div
                      key={med.id}
                      layout
                      className={cn(
                        "rounded-2xl bg-card p-4 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] transition-colors",
                        taken && "ring-1 ring-[hsl(var(--mood-5))]/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Take button */}
                        <button
                          onClick={() => !taken && logMed(med.id)}
                          disabled={taken}
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            taken
                              ? "border-[hsl(var(--mood-5))] bg-[hsl(var(--mood-5))] text-white"
                              : "border-muted-foreground/20 active:scale-95 active:border-[hsl(var(--accent))]"
                          )}
                        >
                          {taken ? <Check size={18} strokeWidth={3} /> : <Pill size={16} className="text-muted-foreground" />}
                        </button>

                        <div className="flex-1 min-w-0" onClick={() => !taken && setExpandedMed(expanded ? null : med.id)}>
                          <p className={cn("font-display text-sm font-medium", taken && "line-through text-muted-foreground")}>{med.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {med.dosage && <span>{med.dosage}</span>}
                            {med.reminder_time && (
                              <span className="flex items-center gap-0.5">
                                <Clock size={10} /> {(med.reminder_time as string).slice(0, 5)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button onClick={() => deleteMed(med.id)} className="p-1.5 text-muted-foreground/30 active:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Taken confirmation */}
                      {taken && (
                        <p className="mt-2 text-xs text-muted-foreground italic flex items-center gap-1">
                          <Check size={12} className="text-[hsl(var(--mood-5))]" /> Tomado hoy
                          {logEntry?.side_effects?.length ? (
                            <span className="ml-1 text-[hsl(var(--mood-2))]">· {logEntry.side_effects.join(", ")}</span>
                          ) : null}
                        </p>
                      )}

                      {/* Expandable side effects */}
                      <AnimatePresence>
                        {!taken && expanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-[10px] text-muted-foreground mb-2 font-display">¿Algún efecto secundario?</p>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {SIDE_EFFECTS.map((se) => (
                                  <button
                                    key={se}
                                    onClick={() => toggleSideEffect(med.id, se)}
                                    className={cn(
                                      "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
                                      effects.includes(se)
                                        ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent-foreground))]"
                                        : "border-border text-muted-foreground"
                                    )}
                                  >
                                    {se}
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => logMed(med.id)} className="w-full rounded-xl bg-primary py-2.5 text-sm font-display font-medium text-primary-foreground active:scale-[0.98]">
                                Registrar toma
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Recordá no modificar dosis sin consultar a tu psiquiatra.
      </p>

      {/* FAB para agregar medicación */}
      <button
        onClick={() => navigate("/mi-proceso/medicacion/agregar")}
        aria-label="Agregar medicación"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-lg shadow-black/20 active:scale-95 transition-transform"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
