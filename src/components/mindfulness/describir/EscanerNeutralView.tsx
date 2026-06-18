import { useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2, RotateCcw, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { ExerciseTopBar } from "@/components/exercises/ExerciseTopBar";

interface Props {
  music: MusicTrack;
  onComplete: () => void;
  onAbort: () => void;
}

type Result = { neutral: string; removed: string[]; note: string };

const ACCENT = "#A78BFA";

export function EscanerNeutralView({ music, onComplete, onAbort }: Props) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(true);

  const audio = useMindfulAudio();
  useEffect(() => {
    audio.playMusic(music);
    return () => { audio.stopMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music]);

  async function scan() {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("describe-neutral", { body: { text } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as Result);
    } catch (e: any) {
      toast({ title: "No se pudo procesar", description: e.message ?? "Probá de nuevo en un momento.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function reset() { setText(""); setResult(null); setHighlight(true); }

  // Construye el texto original con las palabras "removidas" resaltadas
  const originalHighlighted = useMemo(() => {
    if (!result || !highlight) return null;
    const removed = (result.removed ?? []).filter(Boolean);
    if (removed.length === 0) return null;
    const escaped = removed.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = text.split(regex);
    return parts.map((p, i) =>
      regex.test(p)
        ? (
          <span key={i} className="rounded bg-[#F87171]/25 px-1 text-[#FCA5A5] line-through decoration-[#FCA5A5]/60">
            {p}
          </span>
        )
        : <span key={i}>{p}</span>
    );
  }, [result, highlight, text]);

  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-12 pb-8 overflow-y-auto">
      <ExerciseTopBar title="Escáner Neutral" onAbort={onAbort} />

      <div className="mt-6">
        <h2 className="font-serif text-2xl font-bold text-white">Reescribir sin etiquetas</h2>
        <p className="mt-1 text-sm text-white/55">Escribí lo que pasó. Te lo devuelvo en formato observable, sin juicios.</p>
      </div>

      {!result && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Por ejemplo: «mi pareja me ignoró todo el día, es un imbécil…»"
            maxLength={1200}
            className="mt-5 min-h-[180px] w-full rounded-2xl border border-white/10 bg-white/5 p-4 font-serif text-base leading-relaxed text-white placeholder:text-white/30 focus:border-[#A78BFA] focus:outline-none"
          />
          <div className="mt-2 text-right text-[10px] text-white/40">{text.length}/1200</div>

          <button
            onClick={scan}
            disabled={!text.trim() || loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-sm font-bold text-white disabled:opacity-40"
            style={{ background: ACCENT, boxShadow: `0 12px 30px ${ACCENT}55` }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? "Reescribiendo…" : "Reescribir neutral"}
          </button>
        </>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/40">Tu versión</div>
            <p className="mt-2 font-serif text-sm text-white/75 leading-relaxed">{text}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: `${ACCENT}66`, background: `${ACCENT}1a` }}>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: "#C4B5FD" }}>
              <Sparkles size={12} /> Versión observable
            </div>
            <p className="mt-2 font-serif text-base text-white leading-relaxed">{result.neutral}</p>
          </div>
          {result.removed?.length > 0 && (
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/40">Etiquetas que se quitaron</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.removed.map((r) => (
                  <span key={r} className="rounded-full bg-[#F87171]/15 px-2.5 py-0.5 text-xs text-[#FCA5A5] line-through">{r}</span>
                ))}
              </div>
              {result.note && <p className="mt-3 text-xs text-white/55 leading-relaxed">{result.note}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 text-sm font-medium text-white/75">
              <RotateCcw size={14} /> Otro
            </button>
            <button
              onClick={onComplete}
              className="rounded-2xl py-3 text-sm font-bold text-white"
              style={{ background: ACCENT, boxShadow: `0 10px 24px ${ACCENT}55` }}
            >
              Terminar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
