import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { VALUE_OPTIONS, COLOR_OPTIONS, ICON_OPTIONS } from "@/hooks/useHabits";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; icon: string; value_key: string; color: string; text_color: string }) => Promise<void>;
}

export function NewHabitSheet({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [valueKey, setValueKey] = useState(VALUE_OPTIONS[0].key);
  const [colorIdx, setColorIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Anotá el hábito que querés incorporar");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        icon,
        value_key: valueKey,
        color: COLOR_OPTIONS[colorIdx].color,
        text_color: COLOR_OPTIONS[colorIdx].textColor,
      });
      toast.success("Hábito creado ✓");
      setName(""); setIcon(ICON_OPTIONS[0]); setValueKey(VALUE_OPTIONS[0].key); setColorIdx(0);
      onClose();
    } catch {
      toast.error("No pudimos guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-[#101927]/35 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-w-[480px] rounded-t-[32px] border border-white/60 bg-white/95 p-6 pb-10 shadow-[0_-20px_50px_-10px_rgba(16,25,39,0.18)] backdrop-blur-[28px]"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#101927]/15" />
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[22px] font-bold text-[#101927]">Nuevo Hábito Clínico</h2>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101927]/5">
                <X size={16} />
              </button>
            </div>
            <div className="my-3 h-px bg-[#101927]/8" />

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/50">¿Qué rutina vas a incorporar?</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Beber 2L de agua"
              className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-sm text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
            />

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/50">Elegí un icono</p>
            <div className="mt-2 flex gap-2 overflow-x-auto rounded-2xl border border-[#101927]/10 bg-white p-2">
              {ICON_OPTIONS.map(em => (
                <button
                  key={em}
                  onClick={() => setIcon(em)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition ${
                    icon === em ? "bg-white shadow-[0_4px_12px_-4px_rgba(16,25,39,0.18)] ring-1 ring-[#101927]/12" : "opacity-65"
                  }`}
                >{em}</button>
              ))}
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/50">¿A qué valor de vida se asocia?</p>
            <select
              value={valueKey}
              onChange={(e) => setValueKey(e.target.value)}
              className="mt-2 w-full appearance-none rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-sm font-semibold text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
            >
              {VALUE_OPTIONS.map(v => (
                <option key={v.key} value={v.key}>{v.label} {v.emoji}</option>
              ))}
            </select>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/50">Elegí tu color hue de acento</p>
            <div className="mt-2 flex gap-3">
              {COLOR_OPTIONS.map((c, i) => (
                <button
                  key={c.color}
                  onClick={() => setColorIdx(i)}
                  className={`h-10 w-10 rounded-full transition ${colorIdx === i ? "ring-2 ring-[#101927] ring-offset-2" : ""}`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>

            <button
              onClick={submit}
              disabled={saving}
              className="mt-6 w-full rounded-full bg-[#101927] py-4 text-sm font-bold tracking-wider text-white disabled:opacity-60"
            >
              {saving ? "GUARDANDO…" : "CREAR HÁBITO"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
