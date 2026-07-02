import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHideBottomNav } from "@/hooks/useUiChrome";

type Followup = { id: string; title: string; type: string };

type Props = { followup: Followup | null; onClose: () => void; onDone: () => void };

export default function FollowupCompleteSheet({ followup, onClose, onDone }: Props) {
  const open = !!followup;
  useHideBottomNav(open);
  const [didIt, setDidIt] = useState<boolean | null>(null);
  const [sudsBefore, setSudsBefore] = useState(50);
  const [sudsAfter, setSudsAfter] = useState(30);
  const [achieved, setAchieved] = useState<"si" | "parcial" | "no">("parcial");
  const [note, setNote] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDidIt(null); setSudsBefore(50); setSudsAfter(30); setAchieved("parcial"); setNote(""); setNextStep("");
  }, [open]);

  const save = async () => {
    if (!followup || didIt === null) return;
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setSaving(false); return; }
    await supabase.from("thought_followup_logs").insert({
      followup_id: followup.id,
      user_id: uid,
      did_it: didIt,
      suds_before: didIt ? sudsBefore : null,
      suds_after: didIt ? sudsAfter : null,
      achieved: didIt ? achieved : null,
      note: note || null,
      next_step: nextStep || null,
    } as any);
    if (didIt) {
      await supabase.from("thought_followups").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        pinned_home: false,
      }).eq("id", followup.id);
    }
    setSaving(false);
    toast.success(didIt ? "Registrado, ¡bien ahí!" : "Anotado, seguimos.");
    onDone();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-sm flex items-end justify-center"
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 max-h-[85dvh] overflow-y-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#101927]/55">Tarea</p>
                <p className="font-display text-[15px] font-bold text-[#101927] line-clamp-2">{followup?.title}</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={14}/></button>
            </div>

            <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-[#101927]/55">¿La hiciste?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => setDidIt(true)} className={`rounded-2xl py-3 text-[13px] font-semibold ${didIt === true ? "bg-[#101927] text-white" : "bg-slate-100 text-[#101927]/70"}`}>Sí</button>
              <button onClick={() => setDidIt(false)} className={`rounded-2xl py-3 text-[13px] font-semibold ${didIt === false ? "bg-[#101927] text-white" : "bg-slate-100 text-[#101927]/70"}`}>Todavía no</button>
            </div>

            {didIt && (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-[#101927]/55">Malestar ANTES</span><span className="text-[12px] font-bold text-[#7cc2c8]">{sudsBefore}</span></div>
                  <input type="range" min={0} max={100} value={sudsBefore} onChange={(e) => setSudsBefore(Number(e.target.value))} className="w-full accent-[#7cc2c8]" />
                </div>
                <div>
                  <div className="flex justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-[#101927]/55">Malestar DESPUÉS</span><span className="text-[12px] font-bold text-[#7cc2c8]">{sudsAfter}</span></div>
                  <input type="range" min={0} max={100} value={sudsAfter} onChange={(e) => setSudsAfter(Number(e.target.value))} className="w-full accent-[#7cc2c8]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#101927]/55 mb-1">¿Lo lograste?</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["si","parcial","no"] as const).map((k) => (
                      <button key={k} onClick={() => setAchieved(k)} className={`rounded-xl py-2 text-[12px] font-semibold capitalize ${achieved === k ? "bg-[#101927] text-white" : "bg-slate-100 text-[#101927]/70"}`}>{k}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#101927]/55 mb-1">Cómo te sentiste</p>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] focus:outline-none focus:border-[#7cc2c8] focus:bg-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#101927]/55 mb-1">Próximo paso</p>
                  <input value={nextStep} onChange={(e) => setNextStep(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] focus:outline-none focus:border-[#7cc2c8] focus:bg-white" />
                </div>
              </div>
            )}

            <button
              onClick={save}
              disabled={didIt === null || saving}
              className="mt-5 w-full rounded-2xl bg-[#101927] py-3.5 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Guardar seguimiento
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
