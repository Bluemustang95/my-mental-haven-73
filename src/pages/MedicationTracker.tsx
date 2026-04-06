import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Check, Clock, Trash2, BookOpen, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SIDE_EFFECTS = ["Somnolencia", "Náuseas", "Mareo", "Dolor de cabeza", "Insomnio", "Sequedad bucal", "Cambio de apetito", "Otro"];
const TIME_SLOTS = ["Mañana", "Tarde", "Noche", "Madrugada"];

type Med = { id: string; name: string; dosage: string | null; frequency: string | null; reminder_time: string | null; active: boolean };
type MedLog = { id: string; medication_id: string; taken: boolean; side_effects: string[]; note: string | null; log_date: string; taken_at: string | null };

export default function MedicationTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meds, setMeds] = useState<Med[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newSlot, setNewSlot] = useState("Mañana");
  const [expandedMed, setExpandedMed] = useState<string | null>(null);
  const [logSideEffects, setLogSideEffects] = useState<Record<string, string[]>>({});
  const todayStr = localDateStr();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("medications").select("*").eq("user_id", user.id).eq("active", true).order("created_at"),
      supabase.from("medication_logs").select("*").eq("user_id", user.id).eq("log_date", todayStr),
    ]).then(([medsRes, logsRes]) => {
      setMeds((medsRes.data as Med[]) ?? []);
      setLogs((logsRes.data as MedLog[]) ?? []);
    });
  }, [user, todayStr]);

  const addMed = async () => {
    if (!user || !newName.trim()) return;
    const { data } = await supabase
      .from("medications")
      .insert({ user_id: user.id, name: newName.trim(), dosage: newDosage || null, reminder_time: newTime || null, frequency: newSlot })
      .select("*")
      .single();
    if (data) setMeds((m) => [...m, data as Med]);
    setNewName(""); setNewDosage(""); setNewTime(""); setNewSlot("Mañana"); setShowAdd(false);
  };

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
      .insert({ user_id: user.id, medication_id: medId, taken: true, side_effects: effects, log_date: todayStr })
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
    <div className="px-5 pt-14 pb-28 safe-area-top bg-[hsl(var(--background))]">
      {/* Header */}
      <button onClick={() => navigate("/mi-proceso")} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Mi Proceso
      </button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Pill size={22} className="text-[hsl(var(--accent))]" /> Medicación
        </h1>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-full bg-[hsl(var(--accent))]/15 p-2.5 text-[hsl(var(--accent-foreground))] active:scale-95 transition-transform">
          <Plus size={18} />
        </button>
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

      {/* Library CTA */}
      <button
        onClick={() => navigate("/mi-proceso/medicacion/biblioteca")}
        className="mb-5 flex w-full items-center gap-3 rounded-2xl bg-[hsl(var(--accent))]/10 p-4 text-left active:bg-[hsl(var(--accent))]/20 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/20">
          <BookOpen size={20} className="text-[hsl(var(--accent-foreground))]" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold">Tipo de medicamentos</p>
          <p className="text-xs text-muted-foreground">Conocé más sobre tu medicación</p>
        </div>
        <ArrowLeft size={14} className="text-muted-foreground rotate-180" />
      </button>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
            <div className="rounded-2xl bg-card p-5 space-y-3 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
              <p className="font-display text-sm font-medium mb-1">Nuevo medicamento</p>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del medicamento" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              <div className="flex gap-2">
                <input value={newDosage} onChange={(e) => setNewDosage(e.target.value)} placeholder="Dosis (ej: 20mg)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              {/* Time slot selector */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Momento del día</p>
                <div className="flex gap-2 flex-wrap">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setNewSlot(slot)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        newSlot === slot ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={addMed} disabled={!newName.trim()} className="w-full rounded-xl bg-primary py-2.5 text-sm font-display font-medium text-primary-foreground disabled:opacity-40">
                Agregar medicamento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medications by time slot */}
      {meds.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
          <Pill size={32} className="mx-auto mb-3 text-[hsl(var(--accent))]" />
          <p className="font-display text-sm font-medium">Sin medicamentos registrados</p>
          <p className="mt-1 text-xs text-muted-foreground">Tocá + para agregar tu medicación.</p>
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
    </div>
  );
}
