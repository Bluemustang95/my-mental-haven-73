import { useState, useRef, useEffect } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { BookmarkPlus, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resmita-chat`;

export default function Resmita() {
  const { user } = useAuth();
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load prior conversation memory (last 30 messages)
  useEffect(() => {
    if (!user) { setLoadingHistory(false); return; }
    (async () => {
      const { data } = await supabase
        .from("resmita_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data && data.length) {
        setMessages(data.reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
      setLoadingHistory(false);
    })();
  }, [user]);

  const clearHistory = async () => {
    if (!user) return;
    if (!confirm("¿Borrar toda la conversación con Resmita?")) return;
    await supabase.from("resmita_messages").delete().eq("user_id", user.id);
    setMessages([]);
    setSavedIdxs(new Set());
    toast.success("Conversación borrada");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Persist user message
    if (user) {
      supabase.from("resmita_messages").insert({ user_id: user.id, role: "user", content: text });
    }

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          setMessages((prev) => [...prev, { role: "assistant", content: "Estoy recibiendo muchas consultas. Intentá de nuevo en unos minutos." }]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: "Hubo un error. Intentá de nuevo." }]);
        }
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

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

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "No pude conectar con el servidor. Revisá tu conexión." }]);
    } finally {
      setIsLoading(false);
      // Persist assistant reply
      if (user && assistantSoFar.trim()) {
        supabase.from("resmita_messages").insert({ user_id: user.id, role: "assistant", content: assistantSoFar });
      }
    }
  };

  return (
    <div className="flex h-screen flex-col safe-area-top">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-5 pb-3 pt-14">
        <div>
          <h1 className="font-display text-lg font-semibold">Resmita</h1>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Recuerda tus conversaciones · No reemplaza terapia
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive"
          >
            Borrar historial
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="mb-2 font-display text-sm font-medium">Estoy acá para acompañarte</p>
              <p className="text-xs text-muted-foreground max-w-[260px]">
                Tu compañera de bienestar. Contame cómo te sentís o preguntame lo que necesites.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "assistant" && msg.content.length > 40 && (
              <button
                onClick={async () => {
                  if (!user || savedIdxs.has(i)) return;
                  const { error } = await supabase
                    .from("therapy_prep_notes")
                    .insert({ user_id: user.id, note: `[Resmita] ${msg.content.slice(0, 1800)}` });
                  if (error) { toast.error("No pude guardar."); return; }
                  setSavedIdxs(new Set([...savedIdxs, i]));
                  toast.success("Guardado en Notas para terapia");
                }}
                className={cn(
                  "mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition",
                  savedIdxs.has(i)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
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
            <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 pb-20">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Escribí tu mensaje..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={send}
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
              input.trim() && !isLoading
                ? "bg-accent text-accent-foreground active:scale-95"
                : "bg-muted text-muted-foreground"
            )}
          >
            <PaperPlaneRight size={18} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
