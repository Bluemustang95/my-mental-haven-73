import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight, Clock, Trash2 } from "lucide-react";

const DRAFT_KEY = "mindfulness-current-draft";

type Draft = {
  exerciseType: string;
  exerciseName: string;
  resourceKey: string;
  subMode: string | null;
  returnPath: string;
  startedAt: number;
};

function relTime(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} d`;
}

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed?.exerciseName || !parsed?.returnPath) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function OpenMindfulnessList() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setDraft(readDraft());
  }, []);

  if (!draft) return null;

  const discard = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setDraft(null);
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FB923C]" />
          <span className="font-display text-sm font-semibold text-[#101927]">
            Práctica abierta · 1
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={18} className="text-[#101927]/60" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#101927]/5">
              <div>
                <p className="font-display text-base font-bold text-[#101927]">
                  {draft.exerciseName}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/80">
                  <Clock size={11} /> {relTime(draft.startedAt)}
                </p>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  onClick={() => navigate(draft.returnPath)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#101927] py-2.5 font-display text-[12px] font-semibold text-white active:scale-[0.97]"
                >
                  Continuar <ArrowRight size={14} />
                </button>
                <button
                  onClick={discard}
                  aria-label="Descartar"
                  className="flex items-center justify-center rounded-xl bg-[#101927]/5 px-3 text-[#101927]/60 active:scale-[0.97]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
