import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Ic } from "./shared";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Contexto del paso actual (qué pregunta DBT está respondiendo el usuario). */
  context: string;
  /** Texto que el usuario ya escribió en el paso (opcional, se incluye al contexto). */
  draftText?: string;
}

type Turn = { role: "user" | "assistant"; text: string };

/**
 * Drawer lateral con guía socrática DBT.
 * No persiste — es un acompañamiento del paso actual.
 */
export function SocraticDrawer({ open, onClose, context, draftText }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mensaje inicial de la guía cuando se abre por primera vez.
  useEffect(() => {
    if (open && turns.length === 0) {
      setTurns([
        {
          role: "assistant",
          text: "Estoy acá para ayudarte a pensar este paso. Contame con tus palabras qué estás notando y te devuelvo una pregunta para profundizar.",
        },
      ]);
    }
    if (!open) {
      // limpiar al cerrar
      setTimeout(() => setTurns([]), 300);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    const userTurn: Turn = { role: "user", text: msg };
    setTurns((t) => [...t, userTurn]);
    setLoading(true);
    try {
      const fullContext = `${context}\n\nLo que escribió el usuario en el paso (borrador): "${draftText || ""}"`;
      const { data, error } = await supabase.functions.invoke("dbt-ai", {
        body: { task: "socratic", payload: { context: fullContext, user_message: msg } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTurns((t) => [...t, { role: "assistant", text: String(data?.result || "—") }]);
    } catch (e: any) {
      setTurns((t) => [...t, { role: "assistant", text: "No pude responder ahora. Probá de nuevo en un momento." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-[#101927]/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed top-0 right-0 bottom-0 z-[91] w-full max-w-md bg-white shadow-2xl flex flex-col"
            role="dialog" aria-label="Guía socrática DBT"
          >
            <header className="flex items-center justify-between px-4 py-3 border-b border-[#101927]/8 bg-gradient-to-r from-[#facb60]/10 to-transparent">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-[#facb60]/20 flex items-center justify-center">
                  <Ic.Bulb size={16} />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-[#101927]">Guía socrática</p>
                  <p className="font-display text-[10px] tracking-wide uppercase text-[#101927]/50">DBT · acompañamiento</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Cerrar" className="h-9 w-9 rounded-full bg-[#f2f2f2] flex items-center justify-center active:scale-95">
                <Ic.X size={16} color="#101927" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {turns.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[20px] px-4 py-2.5 font-body text-[14px] leading-6 ${
                      t.role === "user"
                        ? "bg-[#101927] text-white"
                        : "bg-[#facb60]/10 text-[#101927] border border-[#facb60]/30"
                    }`}
                  >
                    {t.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-1 px-3 py-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      className="h-2 w-2 rounded-full bg-[#facb60]"
                    />
                  ))}
                </div>
              )}
            </div>

            <footer className="border-t border-[#101927]/8 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  placeholder="Escribí lo que estás pensando…"
                  rows={2}
                  className="flex-1 rounded-[20px] border border-[#d8d9db] bg-white px-4 py-2.5 font-body text-[14px] text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:border-[#facb60] focus:ring-2 focus:ring-[#facb60]/20 resize-none"
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="h-11 px-4 rounded-[20px] bg-[#101927] text-white font-display text-sm font-semibold active:scale-95 disabled:opacity-40"
                >
                  Enviar
                </button>
              </div>
              <p className="mt-2 font-body text-[10.5px] text-[#101927]/40 text-center">
                Orientación clínica. No reemplaza tu terapia.
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
