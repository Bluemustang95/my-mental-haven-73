import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Flame, Lightbulb, Scale, Target, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHideBottomNav } from "@/hooks/useUiChrome";

type Props = {
  open: boolean;
  recordId: string | null;
  onClose: () => void;
};

export default function ThoughtRecordDetailSheet({ open, recordId, onClose }: Props) {
  useHideBottomNav(open);
  const [rec, setRec] = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !recordId) { setRec(null); return; }
    (async () => {
      const { data } = await supabase.from("thought_records").select("*").eq("id", recordId).maybeSingle();
      setRec(data);
      const { data: fu } = await supabase.from("thought_followups").select("*").eq("thought_record_id", recordId).order("created_at");
      setFollowups(fu ?? []);
      const ids = (fu ?? []).map((f: any) => f.id);
      if (ids.length) {
        const { data: lg } = await supabase.from("thought_followup_logs").select("*").in("followup_id", ids);
        setLogs(lg ?? []);
      } else setLogs([]);
    })();
  }, [open, recordId]);

  const evFor: string[] = rec?.evidence_for_json ?? (rec?.evidence_for ? [rec.evidence_for] : []);
  const evAgainst: string[] = rec?.evidence_against_json ?? (rec?.evidence_against ? [rec.evidence_against] : []);
  const distortions: any[] = Array.isArray(rec?.distortions) ? rec.distortions : (rec?.distortion_label ? [{ label: rec.distortion_label }] : []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white shadow-xl max-h-[88vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-5 pt-4 pb-2 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#7cc2c8]" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#101927]/60">
                  {rec ? new Date(rec.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                </p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            {!rec ? (
              <div className="p-6 text-center text-[12px] text-[#101927]/50">Cargando…</div>
            ) : (
              <div className="p-5 space-y-4">
                {rec.situation && (
                  <Section title="Situación">
                    <p className="text-[13px] leading-relaxed text-[#101927]/85">{rec.situation}</p>
                  </Section>
                )}

                {(rec.emotion || rec.emotion_intensity != null) && (
                  <Section title="Emoción" icon={<Flame size={13} className="text-rose-500" />}>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-rose-50 text-rose-700 text-[11.5px] px-2.5 py-1 font-semibold">
                        {rec.emotion ?? "—"}{rec.emotion_intensity != null && ` · ${rec.emotion_intensity}/10`}
                      </span>
                      {(rec.sub_emotions ?? []).map((s: string, i: number) => (
                        <span key={i} className="rounded-full bg-slate-100 text-[#101927]/70 text-[11px] px-2 py-1">{s}</span>
                      ))}
                    </div>
                  </Section>
                )}

                {rec.automatic_thought && (
                  <Section title="Pensamiento automático">
                    <p className="text-[13px] italic text-[#101927]/85">"{rec.automatic_thought}"</p>
                  </Section>
                )}

                {distortions.length > 0 && (
                  <Section title="Distorsiones">
                    <div className="flex flex-wrap gap-1.5">
                      {distortions.map((d: any, i: number) => (
                        <span key={i} className="rounded-full bg-amber-50 text-amber-800 text-[11.5px] px-2.5 py-1 font-semibold">
                          {d.emoji ?? ""} {d.label ?? d.key ?? d}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {(evFor.length > 0 || evAgainst.length > 0) && (
                  <Section title="Evidencias" icon={<Scale size={13} className="text-[#7cc2c8]" />}>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-[#7cc2c8]/10 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#7cc2c8] mb-1">A favor</p>
                        {evFor.length === 0 ? <p className="text-[11px] text-[#101927]/50 italic">—</p> :
                          <ul className="space-y-1">{evFor.map((e, i) => <li key={i} className="text-[11.5px] text-[#101927]/85">• {e}</li>)}</ul>}
                      </div>
                      <div className="rounded-2xl bg-emerald-50 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">En contra</p>
                        {evAgainst.length === 0 ? <p className="text-[11px] text-[#101927]/50 italic">—</p> :
                          <ul className="space-y-1">{evAgainst.map((e, i) => <li key={i} className="text-[11.5px] text-[#101927]/85">• {e}</li>)}</ul>}
                      </div>
                    </div>
                  </Section>
                )}

                {rec.alternative_thought && (
                  <Section title="Pensamiento alternativo" icon={<Lightbulb size={13} className="text-amber-500" />}>
                    <p className="text-[13px] text-[#101927]/85 bg-amber-50 rounded-2xl p-3">{rec.alternative_thought}</p>
                  </Section>
                )}

                {(rec.resolution_plan || rec.brainstorm) && (
                  <Section title={rec.resolution_mode === "problem" ? "Plan de acción" : "Resolución"} icon={<Target size={13} className="text-[#101927]" />}>
                    <p className="text-[13px] text-[#101927]/85 whitespace-pre-line">{rec.resolution_plan || rec.brainstorm}</p>
                  </Section>
                )}

                {followups.length > 0 && (
                  <Section title="Tareas de seguimiento" icon={<CheckCircle2 size={13} className="text-emerald-600" />}>
                    <div className="space-y-2">
                      {followups.map((f) => {
                        const log = logs.find((l) => l.followup_id === f.id);
                        const done = f.status === "completed" || !!log;
                        return (
                          <div key={f.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[12.5px] font-semibold text-[#101927] flex-1">{f.title}</p>
                              <span className={`text-[9.5px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                                done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              }`}>{done ? "Completada" : "Pendiente"}</span>
                            </div>
                            <p className="text-[10.5px] text-[#101927]/55 mt-0.5 flex items-center gap-1">
                              <Clock size={10} /> {f.due_date ?? "—"}
                            </p>
                            {log && (
                              <div className="mt-2 text-[11.5px] text-[#101927]/75 space-y-0.5">
                                {log.suds_before != null && log.suds_after != null && (
                                  <p>SUDS {log.suds_before} → {log.suds_after}</p>
                                )}
                                {log.achieved && <p>Logro: {log.achieved}</p>}
                                {log.note && <p className="italic">"{log.note}"</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/55 mb-1.5 flex items-center gap-1.5">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}
