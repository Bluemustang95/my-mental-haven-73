import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TestRunner } from "@/components/tests/TestRunner";
import { BigFiveHexagon } from "@/components/tests/BigFiveHexagon";
import { useHideBottomNav } from "@/hooks/useUiChrome";

type Def = { id: string; code: string; name: string; kind: string };

const emojiByCode: Record<string, string> = {
  BDI: "🌧️",
  BAI: "😟",
  PSWQ: "🌀",
  BIGFIVE: "🧭",
};

export function SymptomsTestModal({
  open,
  kind = "symptom",
  onClose,
}: {
  open: boolean;
  kind?: "symptom" | "personality";
  onClose: () => void;
}) {
  const [defs, setDefs] = useState<Def[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  useHideBottomNav(open);


  useEffect(() => {
    if (!open) return;
    setRunning(null);
    supabase
      .from("test_definitions" as any)
      .select("id, code, name, kind")
      .eq("kind", kind)
      .eq("active", true)
      .order("sort")
      .then(({ data }) => setDefs(((data as any[]) ?? []) as Def[]));
  }, [open, kind]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-[#0F0F12] text-white"
        >
          <div className={`relative mx-auto min-h-screen max-w-md px-6 pt-12 pb-12 ${running ? "hidden" : ""}`}>
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative mb-8 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">
                  {kind === "symptom" ? "Tests de Síntomas" : "Tests de Personalidad"}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold">Elegí un test</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>

            {kind === "personality" && (
              <div className="relative mb-8 rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-white/45">
                  Tu perfil — vista previa
                </p>
                <BigFiveHexagon preview size={220} />
              </div>
            )}

            {defs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/55">
                No hay tests disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {defs.map((d) => (
                  <motion.button
                    key={d.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setRunning(d.code)}
                    className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] p-4 text-left backdrop-blur-md"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
                      {d.code}
                    </p>
                    <p className="font-display text-base font-semibold leading-tight">{d.name}</p>
                    <div className="flex justify-end text-5xl">{emojiByCode[d.code] ?? "🧠"}</div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {running && <TestRunner testCode={running} onClose={() => setRunning(null)} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
