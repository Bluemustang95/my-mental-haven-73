import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHideBottomNav } from "@/hooks/useUiChrome";

type Props = {
  open: boolean;
  thoughtRecordId: string | null;
  userId: string | null;
  mode: "reestructuracion" | "abordaje";
  defaultTitle: string;
  onClose: () => void;
};

const DUE_OPTS = [
  { key: "today", label: "Hoy", days: 0 },
  { key: "tomorrow", label: "Mañana", days: 1 },
  { key: "3d", label: "En 3 días", days: 3 },
];

export default function FollowupPromptModal({ open, thoughtRecordId, userId, mode, defaultTitle, onClose }: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [due, setDue] = useState<"today" | "tomorrow" | "3d">("tomorrow");
  const [saving, setSaving] = useState(false);

  const skip = () => onClose();

  const save = async () => {
    if (!userId) return onClose();
    setSaving(true);
    const opt = DUE_OPTS.find((o) => o.key === due)!;
    const d = new Date();
    d.setDate(d.getDate() + opt.days);
    const dueDate = d.toISOString().slice(0, 10);
    const { error } = await supabase.from("thought_followups").insert({
      user_id: userId,
      thought_record_id: thoughtRecordId,
      type: mode,
      title: title.trim() || defaultTitle,
      due_date: dueDate,
      pinned_home: true,
      status: "pending",
    } as any);
    setSaving(false);
    if (error) { toast.error("No pudimos crear la tarea."); return; }
    toast.success("Tarea agregada al inicio");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center px-4"
          onClick={skip}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7cc2c8]/20">
                  <CheckCircle2 size={16} className="text-[#7cc2c8]" />
                </div>
                <div>
                  <p className="font-display text-[15px] font-bold text-[#101927]">¡Gran trabajo!</p>
                  <p className="text-[11px] text-[#101927]/60">Tarea de seguimiento</p>
                </div>
              </div>
              <button onClick={skip} className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-100"><X size={14}/></button>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-[#101927]/75">
              ¿Querés fijar esta tarea en tu <b>inicio</b> para hacerla y hacerle seguimiento?
            </p>

            <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-[#101927]/55">Tarea</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-[#101927] focus:outline-none focus:border-[#7cc2c8] focus:bg-white"
            />

            <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-[#101927]/55">Cuándo</label>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {DUE_OPTS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setDue(o.key as any)}
                  className={`rounded-xl px-2 py-2 text-[12px] font-semibold ${
                    due === o.key ? "bg-[#101927] text-white" : "bg-slate-100 text-[#101927]/70"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={skip} className="flex-1 rounded-2xl bg-slate-100 py-3 text-[13px] font-semibold text-[#101927]/70">
                Ahora no
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-2xl bg-[#101927] py-3 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                Fijar en inicio
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
