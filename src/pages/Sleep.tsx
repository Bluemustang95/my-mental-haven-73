import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Brain,
  ChevronDown,
  Check,
  Wind,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { cn, localDateStr } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type View = "dashboard" | "diary" | "lab" | "nightmare";

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

const SOFT_GLASS =
  "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl";

/* ───────────────────────── ROOT ───────────────────────── */
export default function Sleep() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("dashboard");

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden text-slate-100 no-scrollbar"
      style={{ background: "#050508" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-32 h-72 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(124,194,200,0.10),transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(139,121,242,0.10),transparent_70%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-28 pt-10">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <Dashboard key="d" onBack={() => navigate("/herramientas")} onOpen={setView} />
          )}
          {view === "diary" && <Diary key="dia" onBack={() => setView("dashboard")} />}
          {view === "lab" && <Lab key="lab" onBack={() => setView("dashboard")} />}
          {view === "nightmare" && <NightmareWizard key="nm" onBack={() => setView("dashboard")} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───────────────────────── HEADERS ───────────────────────── */
function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onBack}
        aria-label="Volver"
        className="grid h-10 w-10 place-items-center rounded-full bg-white/5 ring-1 ring-white/10"
      >
        <ArrowLeft size={18} />
      </motion.button>
      <h1 className="font-mindful text-2xl tracking-tight">{title}</h1>
    </div>
  );
}

/* ───────────────────────── DASHBOARD ───────────────────────── */
function Dashboard({ onOpen, onBack }: { onOpen: (v: View) => void; onBack: () => void }) {
  const todayIdx = (new Date().getDay() + 6) % 7;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          aria-label="Volver"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/5 ring-1 ring-white/10"
        >
          <ArrowLeft size={18} />
        </motion.button>
      </div>

      <h1 className="font-mindful text-4xl leading-tight">Santuario del Sueño</h1>
      <p className="mt-1 text-sm text-slate-400">Tu espacio seguro para descansar.</p>

      {/* Tracker */}
      <div className={cn(SOFT_GLASS, "mt-6 flex items-center justify-between gap-4 p-4")}>
        <div className="min-w-0">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7cc2c8]">
            Tracker de descanso
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            {DAY_LABELS.map((d, i) => {
              const active = i === todayIdx;
              return (
                <span
                  key={i}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full border text-[11px] font-semibold transition",
                    active
                      ? "border-[#7cc2c8] bg-[#7cc2c8] text-slate-900 shadow-[0_0_10px_rgba(124,194,200,0.6)]"
                      : "border-white/10 bg-white/[0.03] text-slate-500"
                  )}
                >
                  {d}
                </span>
              );
            })}
          </div>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
          <Calendar size={16} className="text-slate-300" />
        </div>
      </div>

      {/* Bento 2-cols */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <BentoCard
          onClick={() => onOpen("diary")}
          emoji="📓"
          tint="bg-indigo-500/15"
          title="Diario de Sueño"
          subtitle="Registrá tus sueños y contexto nocturno."
        />
        <BentoCard
          onClick={() => onOpen("lab")}
          emoji="🧪"
          tint="bg-emerald-500/15"
          title="Laboratorio"
          subtitle="Auditoría ambiental y SOS nocturno."
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onOpen("nightmare")}
        className={cn(
          SOFT_GLASS,
          "mt-3 flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/[0.06]"
        )}
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(139,121,242,0.18), rgba(255,255,255,0.02))",
        }}
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500/20 text-xl shadow-[0_0_22px_rgba(139,121,242,0.45)]">
          🛡️
        </div>
        <div className="min-w-0">
          <p className="font-mindful text-lg leading-tight">Protocolo de Pesadillas</p>
          <p className="mt-0.5 text-xs text-slate-400">
            (DBT) Ensayo en imaginación para transformar finales.
          </p>
        </div>
      </motion.button>
    </motion.div>
  );
}

function BentoCard({
  onClick,
  emoji,
  tint,
  title,
  subtitle,
}: {
  onClick: () => void;
  emoji: string;
  tint: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(SOFT_GLASS, "flex flex-col items-start p-4 text-left transition hover:bg-white/[0.06]")}
    >
      <motion.div
        whileHover={{ scale: 1.08 }}
        className={cn("grid h-12 w-12 place-items-center rounded-full text-xl", tint)}
      >
        {emoji}
      </motion.div>
      <p className="mt-4 font-mindful text-base leading-tight">{title}</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-400">{subtitle}</p>
    </motion.button>
  );
}

/* ───────────────────────── DIARY ───────────────────────── */
const PROMPTS = [
  { label: "¿Por qué soñé esto?", emoji: "✨", text: "Creo que soñé esto porque…\n\n" },
  { label: "¿Qué pasó hoy?", emoji: "🗓️", text: "Hoy durante el día pasó que…\n\n" },
  { label: "Emociones de hoy", emoji: "🧠", text: "Las emociones que llevo a la cama son…\n\n" },
];
const EMOTIONS = ["Tranquilidad", "Ansiedad", "Tristeza", "Alivio", "Enojo", "Miedo"];
const BEHAVIORS = [
  { label: "Pantallas", emoji: "📱" },
  { label: "Cafeína", emoji: "☕" },
  { label: "Lectura", emoji: "📖" },
  { label: "Ejercicio", emoji: "🏃" },
  { label: "Alcohol", emoji: "🍷" },
];

function Diary({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [emos, setEmos] = useState<Set<string>>(new Set());
  const [behs, setBehs] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (snippet: string) => {
    setText((t) => (t ? t + "\n" + snippet : snippet));
    requestAnimationFrame(() => ref.current?.focus());
  };

  const toggle = (s: Set<string>, set: (n: Set<string>) => void, v: string) => {
    const n = new Set(s);
    n.has(v) ? n.delete(v) : n.add(v);
    set(n);
  };

  const save = async () => {
    if (!text.trim()) {
      toast.error("Escribí algo antes de guardar");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Iniciá sesión");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      content: text,
      emotion_tags: ["sueno", ...Array.from(emos), ...Array.from(behs)],
      entry_date: localDateStr(),
    });
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar");
      return;
    }
    toast.success("Guardado con éxito");
    setTimeout(onBack, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
    >
      <BackHeader title="Diario de Sueño" onBack={onBack} />

      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7cc2c8]">
        Descarga mental / Sueños
      </p>

      {/* Prompt pills */}
      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {PROMPTS.map((p, i) => (
          <motion.button
            key={p.label}
            whileTap={{ scale: 0.95 }}
            onClick={() => insert(p.text)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
              i === 0
                ? "border-violet-400/40 bg-violet-500/15 text-violet-200 shadow-[0_0_14px_rgba(139,121,242,0.25)]"
                : "border-white/10 bg-white/[0.04] text-slate-200"
            )}
          >
            <span className="mr-1">{p.emoji}</span>
            {p.label}
          </motion.button>
        ))}
      </div>

      {/* Textarea */}
      <div className={cn(SOFT_GLASS, "mt-4 p-1")}>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí lo que soñaste o volcá los pensamientos que no te dejan dormir…"
          className="h-52 w-full resize-none rounded-3xl bg-transparent p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {/* Accordion */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(SOFT_GLASS, "mt-4 flex w-full items-center justify-between p-4 text-left")}
      >
        <span className="font-semibold">Añadir contexto a la noche</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={18} />
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
            <div className={cn(SOFT_GLASS, "mt-2 space-y-4 p-4")}>
              <div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Emociones antes de dormir
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EMOTIONS.map((e) => {
                    const on = emos.has(e);
                    return (
                      <motion.button
                        key={e}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggle(emos, setEmos, e)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs transition",
                          on
                            ? "border-[#7cc2c8] bg-[#7cc2c8]/15 text-[#7cc2c8] shadow-[0_0_10px_rgba(124,194,200,0.3)]"
                            : "border-white/10 bg-white/[0.03] text-slate-300"
                        )}
                      >
                        {e}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Conductas previas
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BEHAVIORS.map((b) => {
                    const on = behs.has(b.label);
                    return (
                      <motion.button
                        key={b.label}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggle(behs, setBehs, b.label)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs transition",
                          on
                            ? "border-[#7cc2c8] bg-[#7cc2c8]/15 text-[#7cc2c8] shadow-[0_0_10px_rgba(124,194,200,0.3)]"
                            : "border-white/10 bg-white/[0.03] text-slate-300"
                        )}
                      >
                        <span className="mr-1">{b.emoji}</span>
                        {b.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={saving}
        onClick={save}
        className="mt-5 grid h-14 w-full place-items-center rounded-full bg-[#7cc2c8] font-semibold text-slate-900 shadow-[0_0_24px_rgba(124,194,200,0.35)] disabled:opacity-60"
      >
        {saving ? <Loader2 className="animate-spin" size={18} /> : "Guardar en Historial"}
      </motion.button>
    </motion.div>
  );
}

/* ───────────────────────── LAB ───────────────────────── */
const HABITS = [
  { key: "fresh", emoji: "🌡️", title: "Cuarto fresco", sub: "Ambiente templado" },
  { key: "off", emoji: "📱", title: "Desconexión", sub: "Sin pantallas previas" },
  { key: "noc", emoji: "☕", title: "Cero cafeína", sub: "Evité estimulantes" },
  { key: "bed", emoji: "🛏️", title: "Solo dormir", sub: "Cama solo para descanso" },
];

function Lab({ onBack }: { onBack: () => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sos, setSos] = useState<"anx" | "calm" | null>(null);
  const pct = Math.round((picked.size / HABITS.length) * 100);

  // Debounced cloud upsert (one row per day).
  useEffect(() => {
    const id = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = localDateStr();
      const items = Array.from(picked);
      await supabase.from("sleep_hygiene_audits").upsert({
        user_id: user.id,
        audit_date: today,
        items: items as unknown as never,
        score: pct,
        sos_mode: sos,
      } as never, { onConflict: "user_id,audit_date" });
    }, 700);
    return () => clearTimeout(id);
  }, [picked, sos, pct]);

  const toggle = (k: string) => {
    const n = new Set(picked);
    n.has(k) ? n.delete(k) : n.add(k);
    setPicked(n);
  };

  const R = 22;
  const C = 2 * Math.PI * R;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
    >
      <BackHeader title="Laboratorio de Higiene" onBack={onBack} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7cc2c8]">
            Auditoría ambiental
          </p>
          <p className="mt-1 text-sm text-slate-400">Seleccioná los hábitos que cumpliste hoy.</p>
        </div>
        <div className="relative grid h-14 w-14 shrink-0 place-items-center">
          <svg viewBox="0 0 56 56" className="absolute inset-0">
            <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <motion.circle
              cx="28"
              cy="28"
              r={R}
              fill="none"
              stroke="#7cc2c8"
              strokeWidth="4"
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              strokeDasharray={C}
              animate={{ strokeDashoffset: C - (C * pct) / 100 }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              style={{ filter: "drop-shadow(0 0 6px rgba(124,194,200,0.55))" }}
            />
          </svg>
          <span className="text-xs font-bold">{pct}%</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {HABITS.map((h) => {
          const on = picked.has(h.key);
          return (
            <motion.button
              key={h.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(h.key)}
              className={cn(
                SOFT_GLASS,
                "flex flex-col items-center p-4 text-center transition",
                on && "border-[#7cc2c8]/50 bg-[#7cc2c8]/10 shadow-[0_0_20px_rgba(124,194,200,0.2)]"
              )}
            >
              <div className={cn("grid h-14 w-14 place-items-center rounded-full text-2xl", on ? "bg-[#7cc2c8]/20" : "bg-white/[0.04]")}>
                {h.emoji}
              </div>
              <p className="mt-3 text-sm font-semibold">{h.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{h.sub}</p>
            </motion.button>
          );
        })}
      </div>

      {/* SOS */}
      <div
        className={cn(
          SOFT_GLASS,
          "mt-6 p-4"
        )}
        style={{ borderColor: "rgba(250,203,96,0.3)" }}
      >
        <p className="flex items-center gap-2 font-semibold text-[#facb60]">
          <ShieldAlert size={18} /> SOS Nocturno
        </p>
        <p className="mt-1 text-sm text-slate-300">¿No podés dormir? Elegí tu estado actual:</p>

        <div className="mt-3 space-y-2">
          <SosButton
            active={sos === "anx"}
            onClick={() => setSos(sos === "anx" ? null : "anx")}
            title="Ansioso / Rumiando"
            sub="La cabeza no para, siento tensión."
          />
          <AnimatePresence>
            {sos === "anx" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-[#facb60]/20 bg-[#facb60]/[0.06] p-4 text-sm leading-relaxed text-slate-200">
                  <p className="mb-1 font-semibold text-[#facb60]">Habilidad TIP — Agua fría</p>
                  Sumergí la cara en agua muy fría 15-30 segundos (o aplicá una compresa fría en
                  pómulos y frente). Activa el reflejo de inmersión y baja la activación fisiológica
                  en minutos. Luego volvé a la cama.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <SosButton
            active={sos === "calm"}
            onClick={() => setSos(sos === "calm" ? null : "calm")}
            title="Tranquilo pero despierto"
            sub="Cuerpo relajado, pero el sueño no llega."
          />
          <AnimatePresence>
            {sos === "calm" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-[#facb60]/20 bg-[#facb60]/[0.06] p-4 text-sm leading-relaxed text-slate-200">
                  <p className="mb-1 font-semibold text-[#facb60]">Control de estímulos</p>
                  Salí de la cama. Andá a otra habitación con luz tenue y hacé una actividad
                  monótona (leer algo aburrido) hasta sentir somnolencia real. Recién entonces
                  volvé. La cama vuelve a asociarse al sueño.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function SosButton({
  active,
  onClick,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition",
        active
          ? "border-[#facb60]/50 bg-[#facb60]/10"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
      )}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </motion.button>
  );
}

/* ───────────────────────── NIGHTMARE WIZARD ───────────────────────── */
const SAFE_ENDINGS = [
  "De pronto encuentro un escudo de luz cálida que me rodea. Una puerta de salida segura aparece frente a mí, la cruzo y respiro profundo. Estoy a salvo, mi cuerpo se relaja y todo se vuelve quieto.",
  "Aparece alguien que confío plenamente y me toma de la mano. Juntos transformamos la escena en un paisaje tranquilo: cielo abierto, brisa suave. Recupero el control y elijo qué pasa después.",
  "Mi voz se vuelve firme y digo 'basta'. La escena pierde fuerza, los colores se aclaran. Me veo en un lugar seguro que conozco bien, abrigado, en calma, sabiendo que estoy soñando y que puedo despertar.",
];

function NightmareWizard({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [original, setOriginal] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const suggest = () => {
    const pick = SAFE_ENDINGS[Math.floor(Math.random() * SAFE_ENDINGS.length)];
    setNewEnd(pick);
    toast.success("Final seguro sugerido");
  };

  const finish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        content: `[Protocolo Pesadillas]\n\nOriginal:\n${original}\n\nNuevo desenlace:\n${newEnd}`,
        emotion_tags: ["pesadilla", "IRT"],
        entry_date: localDateStr(),
      });
    }
    setSaving(false);
    toast.success("Guardado con éxito");
    setTimeout(onBack, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28 }}
    >
      <BackHeader title="Protocolo Pesadillas" onBack={onBack} />

      <div className="mb-5 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(
              "h-1.5 flex-1 rounded-full transition",
              n <= step ? "bg-[#7cc2c8]" : "bg-white/10"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <StepHead n={1} label="Descarga original" />
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Escribí la pesadilla tal cual la recordás. Tratá de incluir colores, sonidos o cómo te
              sentías.
            </p>
            <div className={cn(SOFT_GLASS, "mt-4 p-1")}>
              <textarea
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Estaba en un lugar oscuro y de repente…"
                className="h-48 w-full resize-none rounded-3xl bg-transparent p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!original.trim()}
              onClick={() => setStep(2)}
              className="mt-5 grid h-14 w-full place-items-center rounded-full bg-white font-semibold text-slate-900 disabled:opacity-50"
            >
              Siguiente Paso
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <StepHead n={2} label="Nuevo desenlace" />
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Reescribí el final. Llevá la escena hacia un lugar donde te sentís seguro y con
              control.
            </p>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={suggest}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-200 shadow-[0_0_18px_rgba(139,121,242,0.3)]"
            >
              <Sparkles size={16} /> Asistente IA: Sugerir un final seguro
            </motion.button>

            <div className={cn(SOFT_GLASS, "mt-4 p-1")}>
              <textarea
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                placeholder="Encuentro un escudo de luz y una puerta segura…"
                className="h-48 w-full resize-none rounded-3xl bg-transparent p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(1)}
                className="h-14 flex-1 rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold"
              >
                Atrás
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!newEnd.trim()}
                onClick={() => setStep(3)}
                className="h-14 flex-[1.4] rounded-full bg-[#7cc2c8] font-semibold text-slate-900 shadow-[0_0_24px_rgba(124,194,200,0.35)] disabled:opacity-50"
              >
                Ver Ensayo
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <StepHead n={3} label="Ensayo mental" />
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Leé este guion en silencio o en voz baja varias veces antes de dormir. Visualizalo con
              detalle.
            </p>

            <div className={cn(SOFT_GLASS, "mt-4 p-5 leading-relaxed")}>
              <Brain size={20} className="mb-3 text-[#7cc2c8]" />
              <p className="text-sm text-slate-200">
                {original}{" "}
                <span className="font-semibold text-[#7cc2c8]">Pero ahora…</span> {newEnd}
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(2)}
                className="h-14 flex-1 rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold"
              >
                Atrás
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={saving}
                onClick={finish}
                className="h-14 flex-[1.4] rounded-full bg-[#7cc2c8] font-semibold text-slate-900 shadow-[0_0_24px_rgba(124,194,200,0.35)] disabled:opacity-50"
              >
                {saving ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Finalizar y Guardar"}
              </motion.button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Wind size={12} /> Repetir cada noche durante 1-2 semanas (IRT)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StepHead({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#7cc2c8] text-sm font-bold text-slate-900 shadow-[0_0_12px_rgba(124,194,200,0.5)]">
        {n}
      </span>
      <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </span>
    </div>
  );
}
