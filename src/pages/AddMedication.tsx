import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { drugsByCategory } from "@/pages/MedCategoryList";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function slotFromTime(time: string): "Madrugada" | "Mañana" | "Tarde" | "Noche" {
  if (!time) return "Mañana";
  const [h] = time.split(":").map(Number);
  if (h >= 0 && h <= 4) return "Madrugada";
  if (h >= 5 && h <= 11) return "Mañana";
  if (h >= 12 && h <= 18) return "Tarde";
  return "Noche";
}

type DropdownProps = {
  step: number;
  label: string;
  placeholder: string;
  value: string | null;
  disabled?: boolean;
  options: { value: string; label: string; sub?: string }[];
  onChange: (v: string) => void;
};

function Dropdown({ step, label, placeholder, value, disabled, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn("transition-opacity", disabled && "opacity-40 pointer-events-none")}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {step}. {label}
      </p>
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-4 text-left text-sm transition-all",
          value ? "border-[#7cc2c8] text-[#101927]" : "border-slate-200 text-slate-400",
          open && "ring-2 ring-[#7cc2c8]/30"
        )}
      >
        <span className={cn("font-medium", !value && "font-normal")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={18}
          className={cn("text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
              {options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    o.value === value ? "bg-[#7cc2c8]/15 text-[#0f766e]" : "hover:bg-slate-50 text-[#101927]"
                  )}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{o.label}</span>
                    {o.sub && <span className="text-[11px] text-slate-400">{o.sub}</span>}
                  </span>
                  {o.value === value && <Check size={14} className="text-[#0f766e]" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AddMedication() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [drugId, setDrugId] = useState<string | null>(null);
  const [dose, setDose] = useState<string | null>(null);
  const [customDose, setCustomDose] = useState("");
  const [time, setTime] = useState("08:00");
  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(
    () =>
      Object.entries(drugsByCategory).map(([id, c]) => ({
        value: id,
        label: c.title,
      })),
    []
  );

  const drugOptions = useMemo(() => {
    if (!categoryId) return [];
    return drugsByCategory[categoryId].drugs.map((d) => ({
      value: d.id,
      label: d.name,
      sub: d.genericName,
    }));
  }, [categoryId]);

  const drug = useMemo(() => {
    if (!categoryId || !drugId) return null;
    return drugsByCategory[categoryId].drugs.find((d) => d.id === drugId) ?? null;
  }, [categoryId, drugId]);

  const doseOptions = useMemo(() => {
    if (!drug) return [];
    return [
      ...drug.standardDoses.map((d) => ({ value: d, label: d })),
      { value: "otro", label: "Otro (ingreso manual)" },
    ];
  }, [drug]);

  const isOtherDose = dose === "otro";
  const finalDose = isOtherDose ? customDose.trim() : dose ?? "";
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

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] px-5 pt-14 pb-32 safe-area-top">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate("/mi-proceso/medicacion")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-[#101927]"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-[#101927]">Agregar medicación</h1>
          <p className="text-[11px] text-slate-500">Completá los datos para configurar tu recordatorio.</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-[0_2px_16px_hsl(var(--foreground)/0.05)] space-y-5">
        <Dropdown
          step={1}
          label="Categoría"
          placeholder="Seleccioná una categoría…"
          value={categoryId}
          options={categoryOptions}
          onChange={(v) => {
            setCategoryId(v);
            setDrugId(null);
            setDose(null);
            setCustomDose("");
          }}
        />

        <Dropdown
          step={2}
          label="Fármaco"
          placeholder="Seleccioná tu medicación…"
          value={drugId}
          disabled={!categoryId}
          options={drugOptions}
          onChange={(v) => {
            setDrugId(v);
            setDose(null);
            setCustomDose("");
          }}
        />

        <Dropdown
          step={3}
          label="Dosis"
          placeholder="Seleccioná la dosis…"
          value={dose}
          disabled={!drugId}
          options={doseOptions}
          onChange={(v) => setDose(v)}
        />

        <AnimatePresence>
          {isOtherDose && (
            <motion.input
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              type="text"
              value={customDose}
              onChange={(e) => setCustomDose(e.target.value)}
              placeholder="Ej: 1/2 comprimido, 12.5mg…"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/30"
            />
          )}
        </AnimatePresence>

        <div className={cn("border-t border-slate-100 pt-5", !dose && "opacity-40 pointer-events-none")}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              4. Hora del recordatorio
            </p>
            <span className="rounded-full bg-[#7cc2c8]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0f766e]">
              {slot}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Clock size={18} className="text-slate-400" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-semibold text-[#101927] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={!canSave || saving}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7cc2c8] py-4 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,194,200,0.6)] disabled:opacity-40"
      >
        <Check size={18} /> {saving ? "Guardando..." : "Guardar medicación"}
      </button>
    </div>
  );
}
