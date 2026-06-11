import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BigFiveHexagon } from "./BigFiveHexagon";

type Def = {
  id: string;
  code: string;
  name: string;
  kind: string;
  scale_min: number;
  scale_max: number;
  scale_labels: string[] | null;
  instructions: string | null;
};
type Item = {
  id: string;
  sort: number;
  prompt: string;
  reverse: boolean;
  subscale: string | null;
};

export function TestRunner({
  testCode,
  onClose,
}: {
  testCode: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [def, setDef] = useState<Def | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<"intro" | "items" | "result">("intro");
  const [result, setResult] = useState<{ total: number; subs: Record<string, number>; interpretation: string } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const { data: d } = await supabase
        .from("test_definitions" as any)
        .select("*")
        .eq("code", testCode)
        .maybeSingle();
      if (!d) return;
      setDef(d as any);
      const { data: it } = await supabase
        .from("test_items" as any)
        .select("*")
        .eq("test_id", (d as any).id)
        .order("sort");
      setItems((it as any[]) ?? []);
    })();
  }, [testCode]);

  const current = items[idx];

  const submit = async () => {
    if (!def) return;
    const min = def.scale_min;
    const max = def.scale_max;
    let total = 0;
    const subs: Record<string, number[]> = {};
    items.forEach((it) => {
      const raw = answers[it.id] ?? min;
      const v = it.reverse ? max + min - raw : raw;
      total += v;
      if (it.subscale) {
        subs[it.subscale] = subs[it.subscale] ?? [];
        subs[it.subscale].push(v);
      }
    });
    const subMeans: Record<string, number> = {};
    Object.entries(subs).forEach(([k, arr]) => {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      subMeans[k] = (avg - min) / (max - min);
    });
    const interpretation = interpret(def.code, total);
    setResult({ total, subs: subMeans, interpretation });
    setStage("result");

    if (user) {
      await supabase.from("test_results").insert({
        user_id: user.id,
        test_code: def.code,
        score: total,
        subscale_scores: subMeans,
        interpretation,
      } as any);
    }
  };

  const answerAndNext = (val: number) => {
    if (!current) return;
    setAnswers((p) => ({ ...p, [current.id]: val }));
    if (idx < items.length - 1) {
      setTimeout(() => setIdx(idx + 1), 180);
    } else {
      setTimeout(submit, 200);
    }
  };

  const progress = items.length ? (idx + 1) / items.length : 0;

  const isBigFive = def?.code === "BIGFIVE";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] overflow-y-auto bg-[#0F0F12] text-white"
    >
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative mx-auto min-h-screen max-w-md px-6 pt-12 pb-32">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={stage === "items" && idx > 0 ? () => setIdx(idx - 1) : onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">
            {def?.name ?? "Cargando..."}
          </p>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {stage === "items" && items.length > 0 && (
          <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage === "intro" && def && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-display text-2xl font-bold">{def.name}</h1>
              <p className="mt-3 text-sm text-white/65">{def.instructions}</p>

              {isBigFive && (
                <div className="my-8 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-white/45">
                    Tu hexágono — vista previa
                  </p>
                  <BigFiveHexagon preview />
                  <p className="mt-2 text-center text-xs text-white/55">
                    Cuando termines, este hexágono se llenará con tu perfil OCEAN.
                  </p>
                </div>
              )}

              <p className="mt-6 text-xs text-white/45">
                {items.length} preguntas · ~{Math.max(2, Math.round(items.length / 6))} min
              </p>
              <button
                onClick={() => setStage("items")}
                className="mt-6 w-full rounded-2xl bg-indigo-500 py-4 font-semibold shadow-lg"
              >
                Comenzar
              </button>
            </motion.div>
          )}

          {stage === "items" && current && def && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">
                {idx + 1} de {items.length}
              </p>
              <h2 className="mt-3 font-display text-xl font-bold leading-snug">
                {current.prompt}
              </h2>

              <div className="mt-8 space-y-3">
                {Array.from(
                  { length: def.scale_max - def.scale_min + 1 },
                  (_, i) => def.scale_min + i
                ).map((v) => {
                  const label = def.scale_labels?.[v - def.scale_min] ?? String(v);
                  const selected = answers[current.id] === v;
                  return (
                    <button
                      key={v}
                      onClick={() => answerAndNext(v)}
                      className={`w-full rounded-2xl border px-5 py-4 text-left text-sm font-medium transition active:scale-[0.99] ${
                        selected
                          ? "border-indigo-400/60 bg-indigo-500/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {stage === "result" && def && result && (
            <motion.div
              key="res"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8 text-center">
                <Check size={48} className="mx-auto text-emerald-400" />
                <h2 className="mt-4 font-display text-2xl font-bold">Test completado</h2>
                <p className="mt-1 text-sm text-white/55">{def.name}</p>
              </div>

              {isBigFive ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <BigFiveHexagon scores={result.subs} />
                  <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[10px]">
                    {["O", "C", "E", "A", "N"].map((k) => (
                      <div key={k}>
                        <p className="font-bold text-white">{Math.round((result.subs[k] ?? 0) * 100)}%</p>
                        <p className="text-white/50">{k}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">
                    Puntaje total
                  </p>
                  <p className="mt-2 font-display text-5xl font-bold text-amber-400">
                    {result.total}
                  </p>
                  <p className="mt-3 text-sm text-white/75">{result.interpretation}</p>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-8 w-full rounded-2xl bg-indigo-500 py-4 font-semibold shadow-lg"
              >
                Listo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function interpret(code: string, total: number): string {
  if (code === "BDI") {
    if (total <= 13) return "Mínima depresión.";
    if (total <= 19) return "Depresión leve.";
    if (total <= 28) return "Depresión moderada.";
    return "Depresión severa. Considerá hablar con un profesional.";
  }
  if (code === "BAI") {
    if (total <= 7) return "Ansiedad mínima.";
    if (total <= 15) return "Ansiedad leve.";
    if (total <= 25) return "Ansiedad moderada.";
    return "Ansiedad severa. Considerá hablar con un profesional.";
  }
  if (code === "PSWQ") {
    if (total <= 39) return "Baja tendencia a preocuparse.";
    if (total <= 59) return "Tendencia moderada a preocuparse.";
    return "Alta tendencia a preocuparse.";
  }
  return `Puntaje total: ${total}`;
}
