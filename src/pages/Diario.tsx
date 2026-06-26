import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock, Lock, Sparkles, ChevronDown, X, Camera, Image as ImageIcon,
  Paperclip, Mic, Pause, Trash2, Flower, Volume2, VolumeX, FileText,
} from "lucide-react";
import { cn, localDateStr } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as audio from "@/lib/diarioAudio";

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
  const [saving, setSaving] = useState(false);

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
    setRecording(false);
  };

  const save = async () => {
    if (!text.trim()) { toast.error("Escribí algo antes de registrar"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Iniciá sesión"); setSaving(false); return; }
    const tags = [emo, ...Array.from(causes)].filter(Boolean) as string[];
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      content: text + (recording ? "\n\n[audio]" : ""),
      entry_date: localDateStr(),
      emotion_tags: tags,
      prompt: prompt?.text ?? null,
    });
    setSaving(false);
    if (error) { toast.error("No se pudo guardar"); return; }
    toast.success("Guardado con éxito");
    reset();
  };

  /* tone classes */
  const cardCls = zen
    ? "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl"
    : "rounded-3xl border border-white/60 bg-white/45 backdrop-blur-2xl shadow-[0_8px_32px_rgba(16,25,39,0.06)]";
  const pillCls = zen
    ? "rounded-full border border-white/10 bg-white/[0.04] text-slate-200"
    : "rounded-full border border-white/60 bg-white/70 text-[#101927] shadow-sm";
  const mm = String(Math.floor(recSec / 60)).padStart(2, "0");
  const ss = String(recSec % 60).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="flex flex-1 flex-col"
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        {zen ? (
          <button
            onClick={onExitZen}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300"
          >
            <X size={14} /> Salir
          </button>
        ) : (
          <div>
            <h1 className="font-mindful text-4xl leading-none tracking-tight">Diario</h1>
            <p className="mt-1 text-sm text-slate-500">Tu espacio seguro para escribir.</p>
          </div>
        )}
        {!zen && (
          <div className="flex gap-2">
            <button className={cn("grid h-10 w-10 place-items-center", pillCls)} aria-label="Privacidad">
              <Lock size={16} />
            </button>
            <button onClick={onOpenHistory} className={cn("grid h-10 w-10 place-items-center", pillCls)} aria-label="Historial">
              <Clock size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Zen tag */}
      {zen && (
        <p className="mb-3 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7cc2c8]">
          Modo Zen
        </p>
      )}

      {/* Prompt banner */}
      <AnimatePresence>
        {prompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(cardCls, "relative mb-4 p-4 pr-10",
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

      {/* Textarea */}
      <div className={cn(cardCls, "relative p-1")}>
        <textarea
          ref={taRef}
          value={text}
          onChange={onTextChange}
          placeholder="¿Qué tenés hoy en la cabeza? Soltalo acá…"
          className={cn(
            "h-52 w-full resize-none rounded-3xl bg-transparent p-4 pr-32 text-base leading-relaxed focus:outline-none",
            zen ? "text-slate-100 placeholder:text-slate-500" : "text-[#101927] placeholder:text-[#101927]/40",
          )}
          style={{ fontFamily: "Lora, serif" }}
        />
        <button
          onClick={inspire}
          className={cn(
            "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold",
            "border border-[#7cc2c8]/40 text-[#7cc2c8]",
            zen ? "bg-[#7cc2c8]/10" : "bg-white/70 shadow-sm",
          )}
        >
          Inspirame <Sparkles size={12} className="text-[#facb60]" />
        </button>
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {attachments.map((a) => (
            <div key={a.id} className={cn(cardCls, "relative aspect-square overflow-hidden")}>
              {a.type === "image" ? (
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                  <FileText size={22} className="opacity-60" />
                  <span className="line-clamp-2 text-[10px] opacity-70">{a.name}</span>
                </div>
              )}
              <button
                onClick={() => removeAtt(a.id)}
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white shadow"
              >
                <X size={12} strokeWidth={3} />
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
            <div className={cn(cardCls, "mt-3 flex items-center gap-3 p-3")}>
              <button
                onClick={() => setRecording(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-red-500 text-white"
              >
                <Pause size={14} />
              </button>
              <Waveform />
              <span className="font-mono text-xs tabular-nums opacity-80">{mm}:{ss}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment bar */}
      <div className={cn(cardCls, "mt-4 flex items-center justify-between gap-1 p-2")}>
        <AttachBtn icon="📸" label="Cámara" onClick={() => camRef.current?.click()} zen={zen} />
        <AttachBtn icon="🖼️" label="Foto" onClick={() => imgRef.current?.click()} zen={zen} />
        <AttachBtn icon="📎" label="Archivo" onClick={() => fileRef.current?.click()} zen={zen} />
        <AttachBtn
          icon={recording ? "⏸️" : "🎙️"}
          label={recording ? "Pausa" : "Audio"}
          onClick={() => setRecording((r) => !r)}
          zen={zen}
          active={recording}
        />
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files, "image"); e.target.value = ""; }} />
        <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files, "image"); e.target.value = ""; }} />
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files, "file"); e.target.value = ""; }} />
      </div>

      {/* Accordions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <AccordionCard
          zen={zen}
          title="SIENTO…"
          summary={emo ?? "Calma"}
          open={openAcc === "emo"}
          onToggle={() => setOpenAcc(openAcc === "emo" ? null : "emo")}
        >
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS.map((it) => {
              const on = emo === it.k;
              return (
                <button
                  key={it.k}
                  onClick={() => { setEmo(it.k); setOpenAcc(null); }}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition",
                    on
                      ? "border-[#7cc2c8] bg-[#7cc2c8]/15 text-[#7cc2c8]"
                      : zen ? "border-white/10 bg-white/[0.03] text-slate-300" : "border-[#101927]/10 bg-white/60 text-[#101927]"
                  )}
                >
                  <span className="mr-0.5">{it.e}</span>{it.k}
                </button>
              );
            })}
          </div>
        </AccordionCard>

        <AccordionCard
          zen={zen}
          title="CAUSAS…"
          summary={causes.size === 0 ? "Ninguna" : causes.size === 1 ? Array.from(causes)[0] : `${causes.size} sel.`}
          open={openAcc === "cause"}
          onToggle={() => setOpenAcc(openAcc === "cause" ? null : "cause")}
        >
          <div className="flex flex-wrap gap-1.5">
            {CAUSES.map((it) => {
              const on = causes.has(it.k);
              return (
                <button
                  key={it.k}
                  onClick={() => toggleCause(it.k)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition",
                    on
                      ? "border-[#7cc2c8] bg-[#7cc2c8]/15 text-[#7cc2c8]"
                      : zen ? "border-white/10 bg-white/[0.03] text-slate-300" : "border-[#101927]/10 bg-white/60 text-[#101927]"
                  )}
                >
                  <span className="mr-0.5">{it.e}</span>{it.k}
                </button>
              );
            })}
          </div>
        </AccordionCard>
      </div>

      {/* Zen soundscape */}
      {zen && <Soundscape />}

      <div className="flex-1" />

      {/* Modo Zen pill (light only) */}
      {!zen && (
        <div className="mt-6 flex justify-end">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onEnterZen}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#101927] shadow-sm backdrop-blur"
          >
            <Flower size={14} className="text-[#7cc2c8]" /> Modo Zen
          </motion.button>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={reset}
          className={cn(
            "h-14 flex-1 rounded-full text-sm font-semibold",
            zen ? "border border-white/10 bg-white/[0.04] text-slate-200" : "border border-[#101927]/15 bg-white/80 text-[#101927]"
          )}
        >
          Vaciar
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={saving}
          onClick={save}
          className="h-14 flex-[1.8] rounded-full bg-[#7cc2c8] font-semibold text-[#101927] shadow-[0_10px_30px_-10px_rgba(124,194,200,0.6)] disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Registrar Entrada"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ────────────── Subcomponents ────────────── */
function AttachBtn({
  icon, label, onClick, zen, active,
}: { icon: string; label: string; onClick: () => void; zen: boolean; active?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-xs font-semibold transition",
        active
          ? "bg-[#7cc2c8]/20 text-[#7cc2c8]"
          : zen ? "text-slate-200" : "text-[#101927]",
      )}
    >
      <span>{icon}</span>{label}
    </motion.button>
  );
}

function AccordionCard({
  title, summary, open, onToggle, children, zen,
}: {
  title: string; summary: string; open: boolean; onToggle: () => void;
  children: React.ReactNode; zen: boolean;
}) {
  return (
    <div className={cn(
      "rounded-3xl border transition",
      zen ? "border-white/10 bg-white/[0.04]" : "border-white/60 bg-white/55 backdrop-blur-2xl shadow-[0_8px_32px_rgba(16,25,39,0.05)]"
    )}>
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-2 p-3 text-left">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">{title}</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{summary}</p>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={16} className="opacity-60" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

function Soundscape() {
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
  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[#7cc2c8]">
        Paisajes sonoros binaurales
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((it) => {
          const on = audio.isPlaying(it.t);
          return (
            <button
              key={it.t}
              onClick={() => toggle(it.t)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-xs transition",
                on
                  ? "border-[#7cc2c8]/50 bg-[#7cc2c8]/10 text-[#7cc2c8]"
                  : "border-white/10 bg-white/[0.03] text-slate-200"
              )}
            >
              <span className="truncate"><span className="mr-1.5">{it.emoji}</span>{it.label}</span>
              {on ? <Volume2 size={14} /> : <VolumeX size={14} className="opacity-60" />}
            </button>
          );
        })}
      </div>
    </div>
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
