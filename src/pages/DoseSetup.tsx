import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { drugsByCategory } from "@/pages/MedCategoryList";
import { toast } from "sonner";

function slotFromTime(time: string): "Madrugada" | "Mañana" | "Tarde" | "Noche" {
  if (!time) return "Mañana";
  const [h] = time.split(":").map(Number);
  if (h >= 0 && h <= 4) return "Madrugada";
  if (h >= 5 && h <= 11) return "Mañana";
  if (h >= 12 && h <= 18) return "Tarde";
  return "Noche";
}

export default function DoseSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categoryId, drugId } = useParams();
  const category = drugsByCategory[categoryId ?? ""];
  const drug = category?.drugs.find((d) => d.id === drugId);

  const [selectedDose, setSelectedDose] = useState<string>(drug?.standardDoses[0] ?? "otro");
  const [customDose, setCustomDose] = useState("");
  const [time, setTime] = useState("08:00");
  const [saving, setSaving] = useState(false);

  const isOther = selectedDose === "otro";
  const finalDose = isOther ? customDose.trim() : selectedDose;
  const slot = useMemo(() => slotFromTime(time), [time]);

  const canSave = !!drug && !!finalDose && !!time;

  const save = async () => {
    if (!user || !drug || !canSave) return;
    setSaving(true);
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      name: drug.name,
      dosage: finalDose,
      reminder_time: time,
      frequency: slot,
    });
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success(`${drug.name} agregado`);
    navigate("/mi-proceso/medicacion");
  };

  if (!drug) {
    return (
      <div className="px-5 pt-14 pb-28 safe-area-top">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="text-muted-foreground">Medicamento no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-32 safe-area-top bg-[hsl(var(--background))] min-h-screen">
      <button
        onClick={() => navigate(`/mi-proceso/medicacion/biblioteca/${categoryId}?mode=add`)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} /> Elegir otro medicamento
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7cc2c8]/15">
          <Pill size={22} className="text-[#0f766e]" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold">{drug.name}</h1>
          <p className="text-xs text-muted-foreground">Ajustes de toma</p>
        </div>
      </div>

      {/* Dose */}
      <div className="rounded-2xl bg-card p-5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dosis
        </label>
        <select
          value={selectedDose}
          onChange={(e) => setSelectedDose(e.target.value)}
          className="mt-2 w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#7cc2c8]"
        >
          {drug.standardDoses.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
          <option value="otro">Otro (ingreso manual)</option>
        </select>

        <AnimatePresence>
          {isOther && (
            <motion.input
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              type="text"
              value={customDose}
              onChange={(e) => setCustomDose(e.target.value)}
              placeholder="Ej: 1/2 comprimido, 12.5mg…"
              className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#7cc2c8]"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Time */}
      <div className="mt-4 rounded-2xl bg-card p-5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hora de la toma
          </label>
          <span className="rounded-full bg-[#7cc2c8]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0f766e]">
            {slot}
          </span>
        </div>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-6 text-center text-3xl font-semibold tracking-wide focus:outline-none focus:ring-1 focus:ring-[#7cc2c8]"
        />
      </div>

      <button
        onClick={save}
        disabled={!canSave || saving}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7cc2c8] py-4 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,194,200,0.6)] disabled:opacity-40"
      >
        <Check size={18} /> {saving ? "Guardando..." : "Guardar medicación"}
      </button>
    </div>
  );
}
