import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock, Lock, Sparkles, X, Camera, Image as ImageIcon,
  Paperclip, Mic, Pause, Flower, Volume2, VolumeX, FileText,
  Smile, Tag, Bold, Italic, Plus,
} from "lucide-react";
import { cn, localDateStr } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as audio from "@/lib/diarioAudio";

/* ────────────── Sanitizer (whitelist b/strong/i/em/br) ────────────── */
function sanitizeHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const allowed = new Set(["B", "STRONG", "I", "EM", "BR", "DIV", "P"]);
  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 1) {
        const el = child as HTMLElement;
        if (!allowed.has(el.tagName)) {
          const text = document.createTextNode(el.textContent ?? "");
          el.replaceWith(text);
        } else {
          // strip attributes
          for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name);
          walk(el);
        }
      }
    }
  };
  walk(tmp);
  return tmp.innerHTML;
}



/* ────────────── Data ────────────── */
const PROMPTS = [
  { tag: "DICOTOMÍA DE CONTROL", text: "¿Qué parte de lo que te preocupa hoy está 100% bajo tu control y qué parte no?" },
  { tag: "VISUALIZACIÓN STOIC", text: "Si eso que tanto temés ocurriera, ¿con qué herramientas internas contás para afrontarlo?" },
  { tag: "GRATITUD SOMÁTICA", text: "Describí con detalle físico o sensorial algo de hoy que te haya hecho sentir a salvo." },
];

const EMOTIONS = [
  { k: "Calma", e: "🧘" }, { k: "Alegría", e: "☀️" }, { k: "Tristeza", e: "🌧️" },
  { k: "Ansiedad", e: "⚡" }, { k: "Enojo", e: "🔥" }, { k: "Agotamiento", e: "🛌" },
];
const CAUSES = [
  { k: "Trabajo", e: "🏢" }, { k: "Pareja", e: "❤️" }, { k: "Salud", e: "🍎" },
  { k: "Finanzas", e: "💵" }, { k: "Sueño", e: "💤" },
];

type Attachment = { id: string; name: string; type: "image" | "file"; url: string };

/* ────────────── Root ────────────── */
export default function Diario() {
  const [view, setView] = useState<"write" | "history">("write");
  const [zen, setZen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("zen-mode", zen);
    return () => document.body.classList.remove("zen-mode");
  }, [zen]);

  useEffect(() => () => audio.stopAll(), []);

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-x-hidden transition-colors duration-500",
        zen ? "text-slate-100" : "text-[#101927]"
      )}
      style={{ background: zen ? "#050508" : "#f9f9fb" }}
    >
      {/* Orbs (only light mode) */}
      {!zen && (
        <>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#7cc2c8]/20 blur-3xl animate-diario-orb-a" />
          <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[#facb60]/20 blur-3xl animate-diario-orb-b" />
        </>
      )}

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-28 pt-8">
        <AnimatePresence mode="wait">
          {view === "write" && (
            <WriteView
              key="w"
              zen={zen}
              onOpenHistory={() => setView("history")}
              onEnterZen={() => setZen(true)}
              onExitZen={() => setZen(false)}
            />
          )}
          {view === "history" && (
            <HistoryView key="h" onBack={() => setView("write")} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ────────────── Write View ────────────── */
function WriteView({
  zen, onOpenHistory, onEnterZen, onExitZen,
}: {
  zen: boolean;
  onOpenHistory: () => void;
  onEnterZen: () => void;
  onExitZen: () => void;
}) {
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState<typeof PROMPTS[number] | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [emo, setEmo] = useState<string | null>(null);
  const [causes, setCauses] = useState<Set<string>>(new Set());
  const [openAcc, setOpenAcc] = useState<"emo" | "cause" | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [entryId, setEntryId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastLen = useRef(0);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Inspirame
  const inspire = () => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  // Attachments
  const addFiles = (files: FileList | null, type: "image" | "file") => {
    if (!files) return;
    const next: Attachment[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type.startsWith("image/") ? "image" : type,
      url: URL.createObjectURL(f),
    }));
    setAttachments((a) => [...a, ...next]);
  };
  const removeAtt = (id: string) =>
    setAttachments((a) => {
      const f = a.find((x) => x.id === id);
      if (f) URL.revokeObjectURL(f.url);
      return a.filter((x) => x.id !== id);
    });

  // Recording sim
  useEffect(() => {
    if (!recording) return;
    setRecSec(0);
    const id = setInterval(() => setRecSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Mechanical click on textarea typing (zen only)
  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (zen && v.length > lastLen.current) audio.triggerClick();
    lastLen.current = v.length;
    setText(v);
  };

  const toggleCause = (k: string) => {
    setCauses((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const reset = () => {
    setText(""); setPrompt(null); attachments.forEach((a) => URL.revokeObjectURL(a.url));
    setAttachments([]); setEmo(null); setCauses(new Set()); setOpenAcc(null);
    setRecording(false); setEntryId(null); setSaveState("idle");
  };

  // Autosave: debounced upsert whenever meaningful content changes
  useEffect(() => {
    if (!text.trim() && !emo && causes.size === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveState("idle"); return; }
      const tags = [emo, ...Array.from(causes)].filter(Boolean) as string[];
      const payload = {
        user_id: user.id,
        content: text + (recording ? "\n\n[audio]" : ""),
        entry_date: localDateStr(),
        emotion_tags: tags,
        prompt: prompt?.text ?? null,
      };
      if (entryId) {
        const { error } = await supabase.from("journal_entries").update(payload).eq("id", entryId);
        if (error) { setSaveState("idle"); return; }
      } else {
        const { data, error } = await supabase.from("journal_entries").insert(payload).select("id").single();
        if (error || !data) { setSaveState("idle"); return; }
        setEntryId(data.id);
      }
      setSaveState("saved");
    }, 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, emo, causes, prompt, recording]);


  /* tone classes */
  const surfaceCls = zen
    ? "border border-white/10 bg-white/[0.03] backdrop-blur-xl"
    : "border border-white/60 bg-white/55 backdrop-blur-2xl shadow-[0_8px_32px_rgba(16,25,39,0.05)]";
  const iconBtnCls = zen
    ? "text-slate-300 hover:text-slate-100"
    : "text-[#101927]/70 hover:text-[#101927]";
  const mm = String(Math.floor(recSec / 60)).padStart(2, "0");
  const ss = String(recSec % 60).padStart(2, "0");

  const selectedEmo = EMOTIONS.find((e) => e.k === emo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="flex flex-1 flex-col"
    >
      {/* Minimal header — only logo / actions */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {zen && <Flower size={20} className="text-[#7cc2c8]" />}
          <SaveIndicator state={saveState} zen={zen} />
        </div>
        <div className="flex gap-1.5">
          {!zen && (
            <>
              <button
                onClick={reset}
                disabled={!text && !emo && causes.size === 0}
                className={cn("grid h-8 w-8 place-items-center rounded-full disabled:opacity-30", iconBtnCls)}
                aria-label="Nueva entrada"
                title="Nueva entrada"
              >
                <Sparkles size={15} />
              </button>
              <button className={cn("grid h-8 w-8 place-items-center rounded-full", iconBtnCls)} aria-label="Privacidad">
                <Lock size={15} />
              </button>
              <button onClick={onOpenHistory} className={cn("grid h-8 w-8 place-items-center rounded-full", iconBtnCls)} aria-label="Historial">
                <Clock size={15} />
              </button>
            </>
          )}
          {zen && (
            <button onClick={onExitZen} className={cn("grid h-8 w-8 place-items-center rounded-full", iconBtnCls)} aria-label="Salir Modo Zen">
              <X size={16} />
            </button>
          )}
        </div>
      </div>


      {/* Prompt banner */}
      <AnimatePresence>
        {prompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn("relative mb-3 rounded-3xl p-4 pr-10", surfaceCls,
              !zen && "bg-[#7cc2c8]/10 border-[#7cc2c8]/30")}>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[#7cc2c8]">
                {prompt.tag}
              </p>
              <p className="mt-1.5 font-mindful text-base leading-snug">{prompt.text}</p>
              <button onClick={() => setPrompt(null)} className="absolute right-3 top-3 opacity-60">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea — fills available height */}
      <div className="relative flex flex-1 flex-col">
        <textarea
          ref={taRef}
          value={text}
          onChange={onTextChange}
          placeholder="¿Qué tenés hoy en la cabeza? Soltalo acá…"
          className={cn(
            "h-full min-h-[300px] w-full flex-1 resize-none bg-transparent p-2 pt-1 pr-24 text-lg leading-relaxed focus:outline-none",
            zen ? "text-slate-100 placeholder:text-slate-500" : "text-[#101927] placeholder:text-[#101927]/35",
          )}
          style={{ fontFamily: "Lora, serif" }}
        />
        <button
          onClick={inspire}
          className={cn(
            "absolute right-1 top-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            "border border-[#7cc2c8]/40 text-[#7cc2c8]",
            zen ? "bg-[#7cc2c8]/10" : "bg-white/70",
          )}
        >
          Inspirame <Sparkles size={11} className="text-[#facb60]" />
        </button>
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {attachments.map((a) => (
            <div key={a.id} className={cn("relative aspect-square overflow-hidden rounded-2xl", surfaceCls)}>
              {a.type === "image" ? (
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                  <FileText size={18} className="opacity-60" />
                  <span className="line-clamp-2 text-[9px] opacity-70">{a.name}</span>
                </div>
              )}
              <button
                onClick={() => removeAtt(a.id)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white shadow"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording bar */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn("mt-2 flex items-center gap-3 rounded-full p-2 pl-3", surfaceCls)}>
              <button
                onClick={() => setRecording(false)}
                className="grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white"
              >
                <Pause size={12} />
              </button>
              <Waveform />
              <span className="pr-2 font-mono text-[11px] tabular-nums opacity-80">{mm}:{ss}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slim icon toolbar */}
      <div className={cn("mt-3 flex items-center justify-between gap-1 rounded-full px-2 py-1.5", surfaceCls)}>
        <IconBtn label="Cámara" onClick={() => camRef.current?.click()} zen={zen}>
          <Camera size={17} />
        </IconBtn>
        <IconBtn label="Foto" onClick={() => imgRef.current?.click()} zen={zen}>
          <ImageIcon size={17} />
        </IconBtn>
        <IconBtn label="Archivo" onClick={() => fileRef.current?.click()} zen={zen}>
          <Paperclip size={17} />
        </IconBtn>
        <IconBtn label={recording ? "Pausa" : "Audio"} onClick={() => setRecording((r) => !r)} zen={zen} active={recording}>
          {recording ? <Pause size={17} /> : <Mic size={17} />}
        </IconBtn>

        <span className={cn("mx-0.5 h-5 w-px", zen ? "bg-white/10" : "bg-[#101927]/10")} />

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1.5 text-sm transition",
                emo ? "text-[#7cc2c8]" : iconBtnCls,
              )}
              aria-label="Siento"
              title="Siento…"
            >
              {selectedEmo ? <span className="text-base leading-none">{selectedEmo.e}</span> : <Smile size={17} />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="center" sideOffset={8} className="w-64 rounded-2xl p-3">
            <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">Siento…</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((it) => {
                const on = emo === it.k;
                return (
                  <button
                    key={it.k}
                    onClick={() => setEmo(on ? null : it.k)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition",
                      on ? "border-[#7cc2c8] bg-[#7cc2c8]/15 text-[#7cc2c8]" : "border-[#101927]/10 bg-white/60 text-[#101927]",
                    )}
                  >
                    <span className="mr-0.5">{it.e}</span>{it.k}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "relative flex items-center gap-1 rounded-full px-2 py-1.5 transition",
                causes.size > 0 ? "text-[#7cc2c8]" : iconBtnCls,
              )}
              aria-label="Causas"
              title="Causas…"
            >
              <Tag size={17} />
              {causes.size > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-[#7cc2c8] text-[8px] font-bold text-[#101927]">
                  {causes.size}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="center" sideOffset={8} className="w-64 rounded-2xl p-3">
            <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">Causas…</p>
            <div className="flex flex-wrap gap-1.5">
              {CAUSES.map((it) => {
                const on = causes.has(it.k);
                return (
                  <button
                    key={it.k}
                    onClick={() => toggleCause(it.k)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition",
                      on ? "border-[#7cc2c8] bg-[#7cc2c8]/15 text-[#7cc2c8]" : "border-[#101927]/10 bg-white/60 text-[#101927]",
                    )}
                  >
                    <span className="mr-0.5">{it.e}</span>{it.k}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {!zen ? (
          <>
            <span className="mx-0.5 h-5 w-px bg-[#101927]/10" />
            <IconBtn label="Modo Zen" onClick={onEnterZen} zen={zen}>
              <Flower size={17} className="text-[#7cc2c8]" />
            </IconBtn>
          </>
        ) : (
          <>
            <span className="mx-0.5 h-5 w-px bg-white/10" />
            <SoundscapePopover />
          </>
        )}

        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files, "image"); e.target.value = ""; }} />
        <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files, "image"); e.target.value = ""; }} />
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files, "file"); e.target.value = ""; }} />
      </div>

      {/* Zen soundscape moved into toolbar popover */}



      {/* Autosave — no manual buttons */}
    </motion.div>
  );
}


/* ────────────── Subcomponents ────────────── */
function SaveIndicator({ state, zen }: { state: "idle" | "saving" | "saved"; zen: boolean }) {
  const base = cn("text-[10px] font-medium tracking-wide transition-opacity", zen ? "text-slate-400" : "text-[#101927]/45");
  if (state === "idle") return <span className={cn(base, "opacity-0")}>·</span>;
  if (state === "saving") return <span className={base}>Guardando…</span>;
  return (
    <span className={cn(base, "flex items-center gap-1 text-[#7cc2c8]")}>
      <span className="h-1.5 w-1.5 rounded-full bg-[#7cc2c8]" /> Guardado
    </span>
  );
}

function IconBtn({
  label, onClick, zen, active, children,
}: { label: string; onClick: () => void; zen: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full transition",
        active
          ? "bg-[#7cc2c8]/20 text-[#7cc2c8]"
          : zen ? "text-slate-300 hover:text-slate-100" : "text-[#101927]/75 hover:text-[#101927]",
      )}
    >
      {children}
    </motion.button>
  );
}


function Waveform() {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 12 }, () => 0.3));
  useEffect(() => {
    const id = setInterval(() => {
      setBars(Array.from({ length: 12 }, () => 0.25 + Math.random() * 0.75));
    }, 140);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-1 items-center gap-1">
      {bars.map((b, i) => (
        <motion.span
          key={i}
          animate={{ height: `${b * 100}%` }}
          transition={{ duration: 0.14 }}
          className="block w-1 rounded-full bg-[#7cc2c8]"
          style={{ minHeight: 4 }}
        />
      ))}
    </div>
  );
}

function SoundscapePopover() {
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);
  const toggle = (t: audio.Track) => {
    if (audio.isPlaying(t)) audio.stop(t); else audio.play(t);
    refresh();
  };
  const items: { t: audio.Track; label: string; emoji: string }[] = [
    { t: "solfeggio", label: "528Hz Solfeggio", emoji: "🧬" },
    { t: "rain", label: "Lluvia suave", emoji: "🌧️" },
    { t: "brown", label: "Ruido Marrón", emoji: "🪵" },
    { t: "click", label: "Click Mecánico", emoji: "⌨️" },
  ];
  const anyOn = items.some((it) => audio.isPlaying(it.t));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Paisajes sonoros"
          title="Paisajes sonoros"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full transition",
            anyOn ? "bg-[#7cc2c8]/20 text-[#7cc2c8]" : "text-slate-300 hover:text-slate-100",
          )}
        >
          {anyOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="w-64 rounded-2xl border-white/10 bg-[#0b0b10] p-3">
        <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[#7cc2c8]">
          Paisajes sonoros
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((it) => {
            const on = audio.isPlaying(it.t);
            return (
              <button
                key={it.t}
                onClick={() => toggle(it.t)}
                className={cn(
                  "flex items-center justify-between gap-1 rounded-xl border px-2 py-2 text-[11px] transition",
                  on
                    ? "border-[#7cc2c8]/50 bg-[#7cc2c8]/10 text-[#7cc2c8]"
                    : "border-white/10 bg-white/[0.03] text-slate-200"
                )}
              >
                <span className="truncate"><span className="mr-1">{it.emoji}</span>{it.label}</span>
                {on ? <Volume2 size={12} /> : <VolumeX size={12} className="opacity-60" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}


/* ────────────── History View ────────────── */
type Entry = { id: string; content: string; entry_date: string | null; emotion_tags: string[] | null; created_at: string | null };

function HistoryView({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("journal_entries")
        .select("id, content, entry_date, emotion_tags, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      setEntries((data ?? []) as Entry[]);
      setLoading(false);
    })();
  }, []);
  const fmt = (s: string | null) => {
    if (!s) return "";
    try { return new Date(s).toLocaleDateString("es-AR", { day: "numeric", month: "long" }); }
    catch { return s; }
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col"
    >
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-mindful text-4xl leading-none">Diario</h1>
          <p className="mt-1 text-sm text-slate-500">Tu espacio seguro para escribir.</p>
        </div>
        <div className="flex gap-2">
          <button className="grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-white/70 text-[#101927] shadow-sm" aria-label="Privacidad">
            <Lock size={16} />
          </button>
          <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-[#7cc2c8] text-[#101927] shadow-[0_8px_24px_-10px_rgba(124,194,200,0.7)]" aria-label="Cerrar historial">
            <Clock size={16} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-[#7cc2c8]">
          Historial de bitácoras
        </p>
        <span className="text-xs text-slate-500">{entries.length} {entries.length === 1 ? "entrada" : "entradas"}</span>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {!loading && entries.length === 0 && (
          <div className="rounded-3xl border border-white/60 bg-white/45 p-6 text-center text-sm text-slate-500 backdrop-blur-2xl">
            Aún no registraste bitácoras. Empezá hoy.
          </div>
        )}
        {entries.map((e) => {
          const emo = e.emotion_tags?.[0];
          const triggers = (e.emotion_tags ?? []).slice(1);
          return (
            <div key={e.id} className="rounded-3xl border border-white/60 bg-white/55 p-4 backdrop-blur-2xl shadow-[0_8px_32px_rgba(16,25,39,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mindful text-base">{fmt(e.created_at ?? e.entry_date)}</p>
                  {emo && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7cc2c8]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7cc2c8] shadow-[0_0_10px_rgba(124,194,200,0.8)]" />
                      {emo}
                    </p>
                  )}
                </div>
                {triggers.length > 0 && (
                  <span className="rounded-full bg-[#101927]/[0.05] px-3 py-1 text-xs text-[#101927]/70">
                    {triggers[0]}
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#101927]/80" style={{ fontFamily: "Lora, serif" }}>
                {e.content.replace("[audio]", "").trim()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex-1" />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onBack}
        className="mt-6 grid h-14 w-full place-items-center rounded-full bg-[#101927] font-semibold text-white shadow-lg"
      >
        ✎ Escribir Diario
      </motion.button>
    </motion.div>
  );
}
