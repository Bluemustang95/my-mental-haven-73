import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Send, Loader2, Trash2, BookmarkPlus, Check, Eye, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useResmitaContext } from "@/hooks/useResmitaContext";
import { useHideBottomNav, useUiChrome } from "@/hooks/useUiChrome";
import { useResmitaPrivacy } from "@/hooks/useResmitaPrivacy";
import { useResmitaSnapshot, buildSnapshotSummary } from "@/hooks/useResmitaSnapshot";
import { logResmitaEvent, newSessionId } from "@/lib/resmitaTelemetry";
import { ResmitaSnapshotConsentModal } from "@/components/resmita/ResmitaSnapshotConsentModal";
import { cn } from "@/lib/utils";
import resmitaAssetJson from "@/assets/resmita-bot.png.asset.json";
const resmitaAvatar = resmitaAssetJson.url;

type Message = { role: "user" | "assistant"; content: string };
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resmita-chat`;

export function ResmitaFAB() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hidden, ctx, route } = useResmitaContext();
  const { bottomNavHidden } = useUiChrome();
  const { prefs, update: updatePrefs } = useResmitaPrivacy();
  const snapshot = useResmitaSnapshot(prefs.shareSnapshot && prefs.contextConsent);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [sessionId, setSessionId] = useState<string>(() => newSessionId());
  const [showConsent, setShowConsent] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useHideBottomNav(open);

  // Only send screen context if user allowed it
  const outboundCtx = useMemo(() => {
    if (!prefs.shareScreen) return { route, screenTitle: undefined, screenPurpose: undefined };
    return { route, screenTitle: ctx.screenTitle, screenPurpose: ctx.screenPurpose };
  }, [prefs.shareScreen, route, ctx.screenTitle, ctx.screenPurpose]);

  useEffect(() => {
    if (!open || loadedHistory || !user) return;
    (async () => {
      const { data } = await supabase
        .from("resmita_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data?.length) {
        setMessages(data.reverse().map((m: any) => ({ role: m.role, content: m.content })));
      }
      setLoadedHistory(true);
    })();
  }, [open, loadedHistory, user]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, isLoading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  // Log open + check first-run consent
  useEffect(() => {
    if (!open || !user || !prefs.loaded) return;
    const sid = newSessionId();
    setSessionId(sid);
    logResmitaEvent({
      userId: user.id,
      sessionId: sid,
      eventType: "open_sheet",
      route,
      screenTitle: prefs.shareScreen ? ctx.screenTitle : undefined,
      screenPurpose: prefs.shareScreen ? ctx.screenPurpose : undefined,
    });
    // First-run: never asked for consent
    if (!prefs.contextConsentAt) setShowConsent(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefs.loaded]);

  if (hidden) return null;

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    if (user && prefs.storeHistory) {
      supabase.from("resmita_messages").insert({ user_id: user.id, role: "user", content: text });
    }

    let assistantSoFar = "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: nextMessages,
          context: outboundCtx,
          userSummary: prefs.shareSnapshot && prefs.contextConsent ? buildSnapshotSummary(snapshot) : null,
          sessionId,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Muchas consultas. Esperá un momento.");
        else if (resp.status === 402) toast.error("Créditos de IA agotados.");
        else toast.error("No pude responder ahora.");
        if (user) {
          logResmitaEvent({
            userId: user.id, sessionId, eventType: "error",
            route, errorMessage: `http_${resp.status}`,
          });
        }
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let done = false;
      while (!done) {
        const r = await reader.read();
        if (r.done) break;
        buf += decoder.decode(r.value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) {
      toast.error("Error de conexión.");
      if (user) {
        logResmitaEvent({
          userId: user.id, sessionId, eventType: "error",
          route, errorMessage: e instanceof Error ? e.message : "network",
        });
      }
    } finally {
      setIsLoading(false);
      if (user && prefs.storeHistory && assistantSoFar.trim()) {
        supabase.from("resmita_messages").insert({ user_id: user.id, role: "assistant", content: assistantSoFar });
      }
    }
  };

  const clearHistory = async () => {
    if (!user || !confirm("¿Borrar toda la conversación con Resmita?")) return;
    await supabase.from("resmita_messages").delete().eq("user_id", user.id);
    setMessages([]);
    setSavedIdxs(new Set());
    toast.success("Conversación borrada");
  };

  const handleConsent = async (granted: boolean) => {
    await updatePrefs({ contextConsent: granted, shareSnapshot: granted });
    if (user) {
      logResmitaEvent({
        userId: user.id, sessionId,
        eventType: granted ? "consent_granted" : "consent_declined",
        route,
      });
    }
    setShowConsent(false);
    toast.success(granted ? "Contexto activado" : "Chateando sin contexto");
  };

  return (
    <>
      {!bottomNavHidden && !open && (() => {
        // En módulos "zen" (Mindfulness, Regulación DBT) el BottomNav global se
        // oculta con la clase `zen-mode` en body; ahí la posición por defecto
        // (bottom-left) se pisa con la mini-navbar interna. Reubicamos a
        // bottom-right, por encima de esa mini-navbar, donde vivía el bot azul.
        const isZen = /^\/herramientas\/mindfulness|^\/herramientas\/regulacion-dbt/.test(route);
        const posStyle: React.CSSProperties = isZen
          ? {
              right: "max(1rem, env(safe-area-inset-right))",
              bottom: "max(5.25rem, calc(env(safe-area-inset-bottom) + 4.5rem))",
              zIndex: 10000,
            }
          : {
              left: "max(1rem, env(safe-area-inset-left))",
              bottom: "max(1.35rem, calc(env(safe-area-inset-bottom) + 0.35rem))",
              zIndex: 10000,
            };
        return (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Hablar con Resmita"
            className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-[#facb60] shadow-[0_10px_24px_-8px_rgba(250,203,96,0.6)] active:scale-95 overflow-hidden"
            style={posStyle}
          >
            <img src={resmitaAvatar} alt="Resmita" className="h-11 w-11 object-contain" />
          </motion.button>
        );
      })()}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[10001] bg-black/45 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 flex h-[86dvh] flex-col rounded-t-[28px] bg-[#f9f9fb]"
            >
              <div className="flex items-center justify-between border-b border-[#101927]/5 px-5 py-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7cc2c8]/20 overflow-hidden">
                    <img src={resmitaAvatar} alt="Resmita" className="h-11 w-11 object-contain" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-[14px] font-bold text-[#101927]">Resmita</p>
                    <p className="truncate text-[10px] text-[#101927]/55">
                      No reemplaza terapia profesional
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-[#101927]/60 hover:text-destructive"
                      aria-label="Borrar historial"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
                    aria-label="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* In-chat context chip */}
              {!showConsent && (() => {
                const bothOn = prefs.shareScreen && prefs.shareSnapshot && prefs.contextConsent;
                const onlyScreen = prefs.shareScreen && !bothOn;
                const label = bothOn
                  ? `Ve: ${ctx.screenTitle} + resumen`
                  : onlyScreen
                    ? `Ve: ${ctx.screenTitle}`
                    : "Modo privado";
                const Icon = prefs.shareScreen ? Eye : Lock;
                return (
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className={cn(
                      "mx-4 mt-2 flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition",
                      prefs.shareScreen
                        ? "bg-[#7cc2c8]/15 text-[#101927]/80"
                        : "bg-[#f2f2f5] text-[#101927]/55",
                    )}
                    aria-label="Ver qué está viendo Resmita"
                  >
                    <Icon size={11} />
                    <span className="truncate max-w-[220px]">{label}</span>
                  </button>
                );
              })()}


              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && !showConsent && (
                  <div className="mt-2 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-[13px] leading-relaxed text-[#101927]">{ctx.welcome}</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                        m.role === "user"
                          ? "bg-[#101927] text-white rounded-br-md"
                          : "bg-white text-[#101927] shadow-sm rounded-bl-md",
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                    {m.role === "assistant" && m.content.length > 40 && user && (
                      <button
                        onClick={async () => {
                          if (savedIdxs.has(i)) return;
                          const { error } = await supabase
                            .from("therapy_prep_notes")
                            .insert({ user_id: user.id, note: `[Resmita] ${m.content.slice(0, 1800)}` });
                          if (error) { toast.error("No pude guardar."); return; }
                          setSavedIdxs(new Set([...savedIdxs, i]));
                          toast.success("Guardado en Notas para terapia");
                        }}
                        className={cn(
                          "mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition",
                          savedIdxs.has(i) ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {savedIdxs.has(i) ? <Check size={11} /> : <BookmarkPlus size={11} />}
                        {savedIdxs.has(i) ? "Guardado" : "Guardar para terapia"}
                      </button>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-[#7cc2c8]/60 animate-pulse" />
                        <span className="h-2 w-2 rounded-full bg-[#7cc2c8]/60 animate-pulse [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-[#7cc2c8]/60 animate-pulse [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="border-t border-[#101927]/5 bg-white px-4 pt-2.5"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
              >
                {ctx.actions.length > 0 && messages.length < 4 && !showConsent && (
                  <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {ctx.actions.map((a, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (user) {
                            logResmitaEvent({
                              userId: user.id, sessionId, eventType: "action_click",
                              route, screenTitle: prefs.shareScreen ? ctx.screenTitle : undefined,
                              snapshot: { label: a.label, kind: a.kind, target: a.target },
                            });
                          }
                          if (a.kind === "prefill") send(a.target);
                          else { setOpen(false); navigate(a.target); }
                        }}
                        disabled={isLoading}
                        className="shrink-0 rounded-full bg-[#7cc2c8]/15 px-3 py-1.5 text-[11px] font-semibold text-[#101927] disabled:opacity-40"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Escribí lo que sentís…"
                    rows={1}
                    className="flex-1 max-h-28 resize-none rounded-2xl border border-[#101927]/10 bg-[#f9f9fb] px-3.5 py-2.5 text-[13px] text-[#101927] placeholder:text-[#101927]/40 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
                  />
                  <button
                    onClick={() => send()}
                    disabled={isLoading || !input.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101927] text-white disabled:opacity-40 active:scale-95"
                  >
                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[9.5px] text-[#101927]/40">
                  Resmita usa IA. No reemplaza terapia profesional.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResmitaSnapshotConsentModal
        open={showConsent}
        onOpenChange={(v) => { if (!v) setShowConsent(false); }}
        mode="consent"
        onConfirm={() => handleConsent(true)}
        onDecline={() => handleConsent(false)}
      />

      <ResmitaSnapshotConsentModal
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
        mode="info"
        shareScreen={prefs.shareScreen}
        shareSnapshot={prefs.shareSnapshot && prefs.contextConsent}
      />
    </>
  );
}
