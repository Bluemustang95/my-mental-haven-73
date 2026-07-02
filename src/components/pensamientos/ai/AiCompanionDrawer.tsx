import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Loader2, Sparkles, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { ThoughtDraft } from "@/lib/pensamientos/state";
import { useHideBottomNav } from "@/hooks/useUiChrome";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCountryOverride } from "@/lib/countryOverride";

type Msg = { role: "user" | "assistant"; content: string };

const INITIAL: Msg = {
  role: "assistant",
  content:
    "Hola, soy tu acompañante cognitivo. Estoy acá para ayudarte a desarmar este pensamiento, paso a paso. Recordá que no reemplazo terapia profesional. ¿Qué te gustaría explorar?",
};

type Props = { draft: ThoughtDraft };

export default function AiCompanionDrawer({ draft }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useHideBottomNav(open);

  useEffect(() => {
    const override = getCountryOverride();
    if (override) { setCountry(override); return; }
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("country")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setCountry(data?.country ?? null));
  }, [user]);


  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const sendText = async (text: string) => {
    if (!text.trim() || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const ctx = {
      step: draft.step,
      triggerEvent: draft.triggerEvent,
      automaticThought: draft.automaticThought,
      emotion: draft.emotion,
      subEmotions: draft.subEmotions,
      intensityInitial: draft.intensityInitial,
      intensityFinal: draft.intensityFinal,
      behavior: draft.behavior,
      bodySensations: draft.bodySensations,
      evidenceFor: draft.evidenceFor,
      evidenceAgainst: draft.evidenceAgainst,
      distortions: draft.distortions,
      alternativeThought: draft.alternativeThought,
      resolutionPlan: draft.resolutionPlan,
      userCountry: country ?? undefined,
    };

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pensamientos-companion`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, draft: ctx }),
        signal: ctrl.signal,
      });

      if (res.status === 429) { toast.error("Muchas consultas. Esperá un momento."); setStreaming(false); setMessages(next); return; }
      if (res.status === 402) { toast.error("Sin créditos de IA."); setStreaming(false); setMessages(next); return; }
      if (!res.ok || !res.body) { toast.error("La IA no pudo responder."); setStreaming(false); setMessages(next); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = m.slice();
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error("Error de conexión con la IA.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Acompañante IA"
        className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#7cc2c8]/90 shadow-[0_10px_30px_-12px_rgba(124,194,200,0.7)] backdrop-blur-xl active:scale-95"
        style={{ right: "1.25rem", bottom: "calc(env(safe-area-inset-bottom) + 9.5rem)" }}
      >
        <Bot size={20} className="text-[#101927]" />
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#34D399] border-2 border-white" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[115] bg-black/35 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 h-[82dvh] flex flex-col rounded-t-[28px] bg-[#f9f9fb]"
            >
              <div className="flex items-center justify-between border-b border-[#101927]/5 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7cc2c8]/20">
                    <Bot size={16} className="text-[#101927]" />
                  </div>
                  <div>
                    <p className="font-display text-[14px] font-bold text-[#101927]">Acompañante cognitivo</p>
                    <p className="text-[10px] text-[#101927]/55">IA · No reemplaza terapia</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                  aria-label="Cerrar"
                >
                  <X size={14} />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                        m.role === "user"
                          ? "bg-[#101927] text-white rounded-br-md"
                          : "bg-white text-[#101927] shadow-sm rounded-bl-md"
                      }`}
                    >
                      {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#101927]/5 bg-white px-4 pt-2.5 pb-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
                {/* Quick chips */}
                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => sendText("Leé lo que escribí en el registro y devolveme un resumen empático en 3 líneas.")}
                    disabled={streaming}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-[#7cc2c8]/15 px-3 py-1.5 text-[11px] font-semibold text-[#101927] disabled:opacity-40"
                  >
                    <BookOpen size={12} /> Leé lo que escribí
                  </button>
                  <button
                    onClick={() => sendText("Ayudame a completar este paso con 2 o 3 sugerencias breves basadas en lo que ya escribí.")}
                    disabled={streaming}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-[#facb60]/25 px-3 py-1.5 text-[11px] font-semibold text-[#101927] disabled:opacity-40"
                  >
                    <Sparkles size={12} /> Ayudame a completar
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendText(input);
                      }
                    }}
                    placeholder="Escribí lo que sentís…"
                    rows={1}
                    className="flex-1 max-h-28 resize-none rounded-2xl border border-[#101927]/10 bg-[#f9f9fb] px-3.5 py-2.5 text-[13px] text-[#101927] placeholder:text-[#101927]/40 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
                  />
                  <button
                    onClick={() => sendText(input)}
                    disabled={streaming || !input.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101927] text-white disabled:opacity-40 active:scale-95"
                  >
                    {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
