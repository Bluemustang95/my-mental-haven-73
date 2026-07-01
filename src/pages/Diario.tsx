import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock, Lock, Sparkles, X, Camera, Image as ImageIcon,
  Paperclip, Mic, Pause, Flower, Volume2, VolumeX, FileText,
  Smile, Tag, Bold, Italic, Plus, Search, Pencil, Trash2,
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
import { uploadAttachment, deleteAttachment } from "@/lib/journalAttachments";
import * as e2e from "@/lib/e2ecipher";

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

type Attachment = {
  id: string;
  name: string;
  type: "image" | "file" | "audio";
  url: string;             // blob URL (immediate) o signed URL (después de subir)
  path?: string;           // storage path (set tras upload)
  uploading?: boolean;
  size?: number;
};

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

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-3 pb-28 pt-6">
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
  const [confirmNew, setConfirmNew] = useState(false);
  const [fmtBar, setFmtBar] = useState<{ top: number; left: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastLen = useRef(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Inspirame
  const inspire = () => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  // Attachments — preview inmediato + upload en background a Storage.
  const addFiles = (files: FileList | null, type: "image" | "file" | "audio") => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const id = crypto.randomUUID();
      const blobUrl = URL.createObjectURL(file);
      const detectedType: Attachment["type"] = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("audio/")
        ? "audio"
        : type;
      const placeholder: Attachment = {
        id, name: file.name, type: detectedType, url: blobUrl, uploading: true, size: file.size,
      };
      setAttachments((a) => [...a, placeholder]);
      uploadAttachment(file, detectedType).then((stored) => {
        if (!stored) {
          toast.error(`No se pudo subir ${file.name}`);
          setAttachments((a) => a.map((x) => x.id === id ? { ...x, uploading: false } : x));
          return;
        }
        setAttachments((a) => a.map((x) =>
          x.id === id
            ? { ...x, uploading: false, path: stored.path, url: stored.url || blobUrl }
            : x
        ));
      });
    });
  };
  const removeAtt = (id: string) =>
    setAttachments((a) => {
      const f = a.find((x) => x.id === id);
      if (f) {
        URL.revokeObjectURL(f.url);
        if (f.path) deleteAttachment(f.path).catch(() => undefined);
      }
      return a.filter((x) => x.id !== id);
    });

  // ── Real audio recording with MediaRecorder ──
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      recordChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      rec.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: mime });
        const file = new File([blob], `nota-${Date.now()}.webm`, { type: mime });
        addFiles({ 0: file, length: 1, item: (i: number) => i === 0 ? file : null } as unknown as FileList, "audio");
        recordStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordStreamRef.current = null;
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setRecording(true);
    } catch (e) {
      console.warn("[Diario] mic denied", e);
      toast.error("Permití el micrófono para grabar audio");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const toggleRecording = () => { recording ? stopRecording() : startRecording(); };

  // Recording timer
  useEffect(() => {
    if (!recording) return;
    setRecSec(0);
    const id = setInterval(() => setRecSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Editor input → store sanitized HTML
  const onEditorInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const raw = el.innerHTML;
    const plainLen = (el.innerText ?? "").length;
    if (zen && plainLen > lastLen.current) audio.triggerClick();
    lastLen.current = plainLen;
    setText(raw);
  };

  // Selection toolbar tracking
  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (!sel || sel.isCollapsed || !el) { setFmtBar(null); return; }
      const anchor = sel.anchorNode;
      if (!anchor || !el.contains(anchor)) { setFmtBar(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setFmtBar(null); return; }
      setFmtBar({ top: rect.top + window.scrollY - 44, left: rect.left + rect.width / 2 + window.scrollX });
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const applyFormat = (cmd: "bold" | "italic") => {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    onEditorInput();
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
    if (editorRef.current) editorRef.current.innerHTML = "";
    lastLen.current = 0;
  };


  // Autosave: debounced upsert whenever meaningful content changes
  useEffect(() => {
    if (!text.trim() && !emo && causes.size === 0 && attachments.length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveState("idle"); return; }
      const tags = [emo, ...Array.from(causes)].filter(Boolean) as string[];
      // Save only stable (uploaded) attachment metadata, NOT blob URLs.
      const persistedAttachments = attachments
        .filter((a) => !!a.path)
        .map((a) => ({ id: a.id, name: a.name, type: a.type, path: a.path, size: a.size }));
      const audioAtt = persistedAttachments.find((a) => a.type === "audio");
      const encEnabled = e2e.isE2EEnabled();
      const rawContent = sanitizeHtml(text);
      const contentForDb = encEnabled ? await e2e.encryptText(rawContent) : rawContent;
      const payload = {
        user_id: user.id,
        content: contentForDb,
        entry_date: localDateStr(),
        emotion_tags: tags,
        prompt: prompt?.text ?? null,
        attachments: persistedAttachments as unknown as never,
        voice_note_path: audioAtt?.path ?? null,
        is_encrypted: encEnabled,
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
  }, [text, emo, causes, prompt, attachments]);


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
                onClick={() => {
                  if (!text && !emo && causes.size === 0) return;
                  setConfirmNew(true);
                }}
                disabled={!text && !emo && causes.size === 0}
                className={cn("grid h-8 w-8 place-items-center rounded-full disabled:opacity-30", iconBtnCls)}
                aria-label="Nueva entrada"
                title="Nueva entrada"
              >
                <Plus size={15} />
              </button>
              <button
                onClick={() => setPrivacyOpen(true)}
                className={cn("grid h-8 w-8 place-items-center rounded-full relative", iconBtnCls)}
                aria-label="Privacidad y cifrado"
                title="Privacidad y cifrado"
              >
                <Lock size={15} />
                {e2e.isE2EEnabled() && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
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

      {/* Editor — fills available height, supports bold/italic on selection */}
      <div className="relative flex flex-1 flex-col">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onEditorInput}
          data-placeholder="¿Qué tenés hoy en la cabeza? Soltalo acá…"
          className={cn(
            "diary-editor h-full min-h-[300px] w-full flex-1 resize-none bg-transparent px-1 pt-1 pr-20 text-[15px] leading-relaxed focus:outline-none whitespace-pre-wrap break-words",
            zen ? "text-slate-100" : "text-[#101927]",
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

      {/* Floating selection toolbar (Bold / Italic) */}
      {fmtBar && (
        <div
          style={{ position: "fixed", top: fmtBar.top, left: fmtBar.left, transform: "translateX(-50%)" }}
          className={cn(
            "z-50 flex items-center gap-0.5 rounded-full border px-1 py-1 shadow-lg",
            zen ? "border-white/10 bg-[#0b0b10]" : "border-[#101927]/10 bg-white",
          )}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={() => applyFormat("bold")}
            className={cn("grid h-7 w-7 place-items-center rounded-full", zen ? "text-slate-200 hover:bg-white/10" : "text-[#101927] hover:bg-[#101927]/5")}
            aria-label="Negrita"
          >
            <Bold size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => applyFormat("italic")}
            className={cn("grid h-7 w-7 place-items-center rounded-full", zen ? "text-slate-200 hover:bg-white/10" : "text-[#101927] hover:bg-[#101927]/5")}
            aria-label="Itálica"
          >
            <Italic size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}



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
                onClick={stopRecording}
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
        <IconBtn label={recording ? "Detener" : "Audio"} onClick={toggleRecording} zen={zen} active={recording}>
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

      <AlertDialog open={confirmNew} onOpenChange={setConfirmNew}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Empezar una entrada nueva?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu entrada actual ya se guardó automáticamente. Vamos a vaciar el editor para que empieces una nueva bitácora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { reset(); setConfirmNew(false); }}
              className="bg-[#7cc2c8] text-[#101927] hover:bg-[#7cc2c8]/90"
            >
              Empezar nueva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
type Entry = { id: string; content: string; entry_date: string | null; emotion_tags: string[] | null; created_at: string | null; is_encrypted?: boolean; _locked?: boolean };

function HistoryView({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Entry | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Entry | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("journal_entries")
        .select("id, content, entry_date, emotion_tags, created_at, is_encrypted")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      const rows = (data ?? []) as Entry[];
      const decoded: Entry[] = await Promise.all(rows.map(async (r) => {
        const encrypted = r.is_encrypted || e2e.looksEncrypted(r.content);
        if (!encrypted) return r;
        const dec = await e2e.decryptText(r.content ?? "");
        if (dec === null) return { ...r, content: "", _locked: true };
        return { ...r, content: dec, is_encrypted: true };
      }));
      setEntries(decoded);
      setLoading(false);
    })();
  }, []);

  const fmt = (s: string | null) => {
    if (!s) return "";
    try { return new Date(s).toLocaleDateString("es-AR", { day: "numeric", month: "long" }); }
    catch { return s; }
  };

  const plain = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent ?? "").replace(/\[audio\]/g, "").trim();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const text = plain(e.content ?? "").toLowerCase();
      const date = fmt(e.created_at ?? e.entry_date).toLowerCase();
      const tags = (e.emotion_tags ?? []).join(" ").toLowerCase();
      return text.includes(q) || date.includes(q) || tags.includes(q);
    });
  }, [entries, query]);

  const openDetail = (e: Entry) => {
    setActive(e);
    setDraft(plain(e.content ?? ""));
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!active) return;
    setSaving(true);
    const newHtml = sanitizeHtml(draft.replace(/\n/g, "<br>"));
    const encrypted = active.is_encrypted && e2e.isE2EEnabled();
    const contentForDb = encrypted ? await e2e.encryptText(newHtml) : newHtml;
    const { error } = await supabase.from("journal_entries")
      .update({ content: contentForDb, is_encrypted: !!encrypted }).eq("id", active.id);
    setSaving(false);
    if (error) { toast.error("No se pudo guardar"); return; }
    setEntries((arr) => arr.map((x) => x.id === active.id ? { ...x, content: newHtml } : x));
    setActive((a) => a ? { ...a, content: newHtml } : a);
    setEditing(false);
    toast.success("Bitácora actualizada");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) { toast.error("No se pudo eliminar"); return; }
    setEntries((arr) => arr.filter((x) => x.id !== id));
    if (active?.id === id) setActive(null);
    setToDelete(null);
    toast.success("Bitácora eliminada");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col"
    >
      <div className="mb-4 flex items-start justify-between px-1">
        <div>
          <h1 className="font-mindful text-3xl leading-none">Diario</h1>
          <p className="mt-1 text-xs text-slate-500">Tu espacio seguro para escribir.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border shadow-sm",
              searchOpen ? "border-[#7cc2c8] bg-[#7cc2c8]/15 text-[#7cc2c8]" : "border-white/60 bg-white/70 text-[#101927]"
            )}
            aria-label="Buscar"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => toast.info("Tus notas son privadas y solo vos las ves.")}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-white/70 text-[#101927] shadow-sm"
            aria-label="Privacidad"
          >
            <Lock size={14} />
          </button>
          <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full bg-[#7cc2c8] text-[#101927] shadow-[0_8px_24px_-10px_rgba(124,194,200,0.7)]" aria-label="Cerrar historial">
            <Clock size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por palabra, fecha o emoción…"
              className="mb-3 w-full rounded-full border border-white/60 bg-white/80 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-3 flex items-center justify-between px-1">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[#7cc2c8]">
          Historial de bitácoras
        </p>
        <span className="text-[11px] text-slate-500">{filtered.length} {filtered.length === 1 ? "entrada" : "entradas"}</span>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando…</p>}
      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl border border-white/60 bg-white/45 p-6 text-center text-sm text-slate-500 backdrop-blur-2xl">
          {query ? "Sin resultados para tu búsqueda." : "Aún no registraste bitácoras. Empezá hoy."}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {filtered.map((e) => {
          const emo = e.emotion_tags?.[0];
          const preview = plain(e.content ?? "");
          return (
            <div
              key={e.id}
              className="group relative flex aspect-square flex-col overflow-hidden rounded-[20px] border border-white/60 bg-white/65 p-3 backdrop-blur-2xl shadow-[0_8px_24px_rgba(16,25,39,0.05)]"
            >
              <button
                onClick={() => openDetail(e)}
                className="absolute inset-0 z-0"
                aria-label="Abrir bitácora"
              />
              <div className="pointer-events-none relative z-10">
                <p className="font-mindful text-[13px] leading-tight">{fmt(e.created_at ?? e.entry_date)}</p>
                {emo && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#7cc2c8]">
                    <span className="inline-block h-1 w-1 rounded-full bg-[#7cc2c8]" />
                    {emo}
                  </p>
                )}
                <p
                  className="mt-2 overflow-hidden text-[11.5px] leading-relaxed text-[#101927]/75 line-clamp-5"
                  style={{ fontFamily: "Lora, serif" }}
                >
                  {preview || "(sin texto)"}
                </p>
              </div>
              <div className="relative z-10 mt-auto flex justify-end gap-1 pt-1">
                <button
                  onClick={(ev) => { ev.stopPropagation(); openDetail(e); setEditing(true); }}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/80 text-[#101927] shadow-sm active:scale-95"
                  aria-label="Editar"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(ev) => { ev.stopPropagation(); setToDelete(e); }}
                  className="grid h-7 w-7 place-items-center rounded-full bg-red-500/15 text-red-600 shadow-sm active:scale-95"
                  aria-label="Eliminar"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-4" />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onBack}
        className="mt-6 grid h-13 w-full place-items-center rounded-full bg-[#101927] py-3.5 font-semibold text-white shadow-lg"
      >
        ✎ Escribir Diario
      </motion.button>

      {/* Detail / edit sheet */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              transition={{ type: "spring", damping: 22, stiffness: 220 }}
              className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] flex flex-col"
            >
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#101927]/15" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mindful text-[15px] text-[#101927]">{fmt(active.created_at ?? active.entry_date)}</p>
                  {active.emotion_tags && active.emotion_tags.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-[#7cc2c8] font-semibold">
                      {active.emotion_tags.join(" · ")}
                    </p>
                  )}
                </div>
                <button onClick={() => setActive(null)} className="grid h-8 w-8 place-items-center rounded-full bg-[#101927]/5">
                  <X size={14} />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto">
                {editing ? (
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                    className="w-full min-h-[240px] resize-none rounded-2xl border border-[#101927]/10 bg-white p-3 text-[14px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
                    style={{ fontFamily: "Lora, serif" }}
                  />
                ) : (
                  <div
                    className="text-[14px] leading-relaxed text-[#101927] whitespace-pre-wrap"
                    style={{ fontFamily: "Lora, serif" }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(active.content ?? "") || "<em class='opacity-60'>(sin texto)</em>" }}
                  />
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => { setEditing(false); setDraft(plain(active.content ?? "")); }}
                      className="flex-1 h-11 rounded-full bg-[#101927]/5 text-[#101927] font-semibold text-[13.5px] active:scale-[0.98]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex-1 h-11 rounded-full bg-[#7cc2c8] text-[#101927] font-semibold text-[13.5px] active:scale-[0.98] disabled:opacity-60"
                    >
                      {saving ? "Guardando…" : "Guardar"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setToDelete(active)}
                      className="flex h-11 items-center justify-center gap-2 rounded-full bg-red-500/10 px-4 text-red-600 font-semibold text-[13.5px] active:scale-[0.98]"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex-1 h-11 rounded-full bg-[#101927] text-white font-semibold text-[13.5px] active:scale-[0.98] inline-flex items-center justify-center gap-2"
                    >
                      <Pencil size={14} /> Editar
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta bitácora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. No podrás recuperar el texto ni los adjuntos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}


