import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BigFiveHexagon } from "./BigFiveHexagon";


type Baremo = { label: string; min: number; max: number; color: string; message: string };
type Def = {
  id: string;
  code: string;
  name: string;
  kind: string;
  scale_min: number;
  scale_max: number;
  scale_labels: string[] | null;
  instructions: string | null;
  baremos: Baremo[] | null;
  result_message: string | null;
};
type ItemOption = { label: string; score: number };
type Item = {
  id: string;
  sort: number;
  prompt: string;
  reverse: boolean;
  subscale: string | null;
  options: ItemOption[] | null;
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
  const [stage, setStage] = useState<"items" | "result">("items");
  const [result, setResult] = useState<{ total: number; subs: Record<string, number>; interpretation: string } | null>(
    null
  );
  // Ocultamos el BottomNav (SOS/hogar) vía CSS `zen-mode` sin usar el flag global,
  // así el FAB de Resmita sigue visible durante el test.
  useEffect(() => {
    document.body.classList.add("zen-mode");
    return () => document.body.classList.remove("zen-mode");
  }, []);

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
      // effective min/max for this item (item options override scale)
      const localMin = it.options && it.options.length > 0 ? Math.min(...it.options.map((o) => o.score)) : min;
      const localMax = it.options && it.options.length > 0 ? Math.max(...it.options.map((o) => o.score)) : max;
      const v = it.reverse ? localMax + localMin - raw : raw;
      total += v;
      if (it.subscale) {
        subs[it.subscale] = subs[it.subscale] ?? [];
        subs[it.subscale].push((v - localMin) / Math.max(1, localMax - localMin));
      }
    });
    const subMeans: Record<string, number> = {};
    Object.entries(subs).forEach(([k, arr]) => {
      subMeans[k] = arr.reduce((a, b) => a + b, 0) / arr.length;
    });
    const interpretation = interpret(def, total);
    setResult({ total, subs: subMeans, interpretation });
    setStage("result");

    if (user) {
      await supabase.from("test_results").insert({
        user_id: user.id,
        test_type: def.code,
        score: total,
        answers: { responses: answers, subscales: subMeans },
        severity: interpretation,
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
      className="fixed inset-0 z-[9999] overflow-y-auto bg-[#f9f9fb] text-[#0f172a]"
    >
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-[#7cc2c8]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-[#facb60]/15 blur-3xl" />

      <div className="relative mx-auto min-h-screen max-w-md px-6 pt-12 pb-32">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={stage === "items" && idx > 0 ? () => setIdx(idx - 1) : onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94a3b8]">
            {def?.name ?? "Cargando..."}
          </p>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        {stage === "items" && items.length > 0 && (
          <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
            <div
              className="h-full bg-[#7cc2c8] transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage === "items" && !current && (
            <div className="py-16 text-center text-sm text-[#64748b]">Cargando…</div>
          )}



          {stage === "items" && current && def && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                {idx + 1} de {items.length}
              </p>
              <h2 className="mt-3 font-serif text-xl font-semibold leading-snug text-[#0f172a]">
                {current.prompt}
              </h2>

              <div className="mt-8 space-y-3">
                {(current.options && current.options.length > 0
                  ? current.options.map((o) => ({ label: o.label, score: o.score }))
                  : Array.from({ length: def.scale_max - def.scale_min + 1 }, (_, i) => {
                      const v = def.scale_min + i;
                      return { label: def.scale_labels?.[i] ?? String(v), score: v };
                    })
                ).map((opt) => {
                  const selected = answers[current.id] === opt.score;
                  return (
                    <button
                      key={opt.score + opt.label}
                      onClick={() => answerAndNext(opt.score)}
                      className={`w-full rounded-2xl border px-5 py-4 text-left text-sm font-medium transition active:scale-[0.99] ${
                        selected
                          ? "border-[#7cc2c8] bg-[#7cc2c8]/10 text-[#0f172a]"
                          : "border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f1f5f9]"
                      }`}
                    >
                      {opt.label}
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
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7cc2c8]/15">
                  <Check size={28} className="text-[#7cc2c8]" />
                </div>
                <h2 className="mt-4 font-serif text-2xl font-semibold text-[#0f172a]">Test completado</h2>
                <p className="mt-1 text-sm text-[#64748b]">{def.name}</p>
              </div>

              {isBigFive ? (
                <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
                  <BigFiveHexagon scores={result.subs} />
                  <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[10px]">
                    {["O", "C", "E", "A", "N"].map((k) => (
                      <div key={k}>
                        <p className="font-bold text-[#0f172a]">{Math.round((result.subs[k] ?? 0) * 100)}%</p>
                        <p className="text-[#94a3b8]">{k}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 text-center shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                    Puntaje total
                  </p>
                  <p className="mt-2 font-serif text-5xl font-bold text-[#7cc2c8]">
                    {result.total}
                  </p>
                  <p className="mt-3 text-sm text-[#475569]">{result.interpretation}</p>
                </div>
              )}

              {def.result_message && (
                <p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-center text-[13px] leading-relaxed text-[#475569]">
                  {def.result_message}
                </p>
              )}

              <button
                onClick={onClose}
                className="mt-8 w-full rounded-2xl bg-[#0f172a] py-4 font-semibold text-white shadow-lg"
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

function interpret(def: Def, total: number): string {
  if (def.baremos && def.baremos.length > 0) {
    const hit = def.baremos.find((b) => total >= b.min && total <= b.max);
    if (hit) return hit.message || hit.label;
  }
  // Fallback legacy hardcoded
  const code = def.code;
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
