import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pill, Plus, Check, Clock, Warning, Trash } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SIDE_EFFECTS = ["Somnolencia", "Náuseas", "Mareo", "Dolor de cabeza", "Insomnio", "Sequedad bucal", "Cambio de apetito", "Otro"];

type Med = { id: string; name: string; dosage: string | null; frequency: string | null; reminder_time: string | null; active: boolean };
type MedLog = { id: string; medication_id: string; taken: boolean; side_effects: string[]; note: string | null; log_date: string };

export default function MedicationTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meds, setMeds] = useState<Med[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newTime, setNewTime] = useState("");
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
      .insert({ user_id: user.id, name: newName.trim(), dosage: newDosage || null, reminder_time: newTime || null })
      .select("*")
      .single();
    if (data) setMeds((m) => [...m, data as Med]);
    setNewName(""); setNewDosage(""); setNewTime(""); setShowAdd(false);
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

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <button onClick={() => navigate("/mi-proceso")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Mi Proceso
      </button>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Pill size={24} weight="duotone" className="text-accent" /> Medicación
        </h1>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-full bg-accent/15 p-2 text-accent-foreground active:scale-95 transition-transform">
          <Plus size={18} />
        </button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Registrá tu toma diaria y efectos secundarios.</p>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del medicamento" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              <div className="flex gap-2">
                <input value={newDosage} onChange={(e) => setNewDosage(e.target.value)} placeholder="Dosis (ej: 20mg)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <button onClick={addMed} disabled={!newName.trim()} className="w-full rounded-xl bg-primary py-2 text-sm font-display font-medium text-primary-foreground disabled:opacity-40">
                Agregar medicamento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medications list */}
      {meds.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Pill size={32} weight="duotone" className="mx-auto mb-3 text-accent" />
          <p className="font-display text-sm font-medium">Sin medicamentos registrados</p>
          <p className="mt-1 text-xs text-muted-foreground">Tocá + para agregar tu medicación.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meds.map((med) => {
            const taken = isTaken(med.id);
            const effects = logSideEffects[med.id] ?? [];
            return (
              <div key={med.id} className={cn("rounded-2xl border bg-card p-4 transition-colors", taken ? "border-mood-5/30" : "border-border")}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors", taken ? "bg-mood-5 text-foreground" : "bg-accent/10")}>
                    {taken ? <Check size={16} weight="bold" /> : <Pill size={16} weight="duotone" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-medium">{med.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {med.dosage && <span>{med.dosage}</span>}
                      {med.reminder_time && <span className="flex items-center gap-0.5"><Clock size={10} /> {med.reminder_time.slice(0, 5)}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteMed(med.id)} className="p-1 text-muted-foreground/40 active:text-destructive">
                    <Trash size={14} />
                  </button>
                </div>

                {!taken && (
                  <>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {SIDE_EFFECTS.map((se) => (
                        <button
                          key={se}
                          onClick={() => toggleSideEffect(med.id, se)}
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                            effects.includes(se) ? "border-accent bg-accent/15 text-accent-foreground" : "border-border text-muted-foreground"
                          )}
                        >
                          {se}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => logMed(med.id)} className="w-full rounded-xl bg-primary py-2 text-sm font-display font-medium text-primary-foreground active:scale-[0.98]">
                      Registrar toma
                    </button>
                  </>
                )}

                {taken && (
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <Check size={12} /> Tomado hoy
                    {logs.find((l) => l.medication_id === med.id)?.side_effects?.length ? (
                      <span className="ml-1 flex items-center gap-0.5 text-mood-2"><Warning size={10} /> {logs.find((l) => l.medication_id === med.id)?.side_effects?.join(", ")}</span>
                    ) : null}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
