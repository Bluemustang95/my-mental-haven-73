import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useHideBottomNav } from "@/hooks/useUiChrome";

export function QuickCaptureSheet({
  open,
  onClose,
  onSubmit,
  title,
  placeholder,
  accent = "#7cc2c8",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void> | void;
  title: string;
  placeholder?: string;
  accent?: string;
}) {
  useHideBottomNav(open);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setValue(""); }, [open]);

  const save = async () => {
    const text = value.trim();
    if (!text) return;
    setSaving(true);
    try {
      await onSubmit(text);
      toast.success("Guardado");
      onClose();
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[130] flex items-end justify-center bg-black/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-5"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-bold text-[#101927]">{title}</p>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <X size={14} />
              </button>
            </div>
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder ?? "Escribí acá..."}
              rows={4}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13.5px] text-[#101927] placeholder:text-[#101927]/40 focus:border-[color:var(--acc)] focus:bg-white focus:outline-none"
              style={{ ["--acc" as any]: accent }}
            />
            <button
              onClick={save}
              disabled={!value.trim() || saving}
              className="mt-4 w-full rounded-2xl py-3.5 text-[13px] font-semibold text-white disabled:opacity-50"
              style={{ background: "#101927" }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
