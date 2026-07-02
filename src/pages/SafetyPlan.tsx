import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Phone, Plus, ShieldAlert, Trash2, Loader2, Pencil, X,
  AlertTriangle, Sparkles, Users, Home as HomeIcon, LifeBuoy, Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { loadHotlines, detectUserCountry, type Hotline } from "@/lib/crisisHotlines";
import { toast } from "sonner";

// ─── Mock / suggestion data ────────────────────────────────────────────────
const SUGGESTED_SIGNS = [
  "Pensamientos intrusivos y persistentes",
  "Aislamiento de personas queridas",
  "Cambios bruscos de ánimo",
  "Dificultad para dormir o comer",
  "Sensación de desesperanza",
];
const SUGGESTED_COPING = [
  "Escuchar mi playlist de calma",
  "Respiración 4-7-8",
  "Salir a caminar 10 minutos",
  "Escribir en el diario",
  "Ducha con agua fría/caliente",
];
const SUGGESTED_ENV = [
  "Guardar medicación extra bajo llave",
  "Pedirle a alguien de confianza que me acompañe",
  "Retirar objetos peligrosos de mi habitación",
  "Encender luces y abrir ventanas",
];

type Contact = { name: string; phone: string };

type Plan = {
  signs: string[];
  coping: string[];
  network: Contact[];
  env: string[];
  emergencies: Contact[];
};

const DEFAULT_PLAN: Plan = {
  signs: [],
  coping: [],
  network: [],
  env: [],
  emergencies: [],
};

const STEPS = [
  { key: "signs",       title: "Señales de alerta",       icon: AlertTriangle, sub: "Reconocer cuándo empieza la crisis ayuda a frenarla a tiempo." },
  { key: "coping",      title: "Estrategias para calmarme", icon: Sparkles,   sub: "Recursos personales que puedo activar antes de pedir ayuda." },
  { key: "network",     title: "Red de apoyo",             icon: Users,        sub: "Personas de confianza a las que puedo llamar." },
  { key: "env",         title: "Modificar el entorno",     icon: HomeIcon,     sub: "Reducir el acceso a medios que pueden hacerme daño." },
] as const;


const isPlanEmpty = (p: Plan) =>
  p.signs.length === 0 &&
  p.coping.length === 0 &&
  p.network.length === 0 &&
  p.env.length === 0 &&
  p.emergencies.length === 0;

// ─── Component ─────────────────────────────────────────────────────────────
export default function SafetyPlan() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"view" | "edit">(params.get("mode") === "edit" ? "edit" : "view");
  const [wizardStep, setWizardStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan>(DEFAULT_PLAN);
  const [country, setCountry] = useState("AR");
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [hasSavedPlan, setHasSavedPlan] = useState(false);

  // Load
  useEffect(() => {
    (async () => {
      const c = (await detectUserCountry()) ?? "AR";
      setCountry(c);
      setHotlines(await loadHotlines(c));
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("safety_plans").select("*").eq("user_id", user.id).maybeSingle();
        if (data) {
          let env: string[] = [];
          let emergencies: Contact[] = [];
          try {
            const raw = (data.environment_notes ?? "") as string;
            const parsed = raw ? JSON.parse(raw) : {};
            env = Array.isArray(parsed.env) ? parsed.env : [];
            emergencies = Array.isArray(parsed.emergencies) ? parsed.emergencies : [];
          } catch { /* ignore */ }
          const loaded: Plan = {
            signs: (data.warning_signs as unknown as string[]) ?? [],
            coping: (data.coping_strategies as unknown as string[]) ?? [],
            network: (data.contacts as unknown as Contact[]) ?? [],
            env,
            emergencies,
          };
          setPlan(loaded);
          setHasSavedPlan(!isPlanEmpty(loaded));
          if (isPlanEmpty(loaded) && params.get("mode") !== "view") setMode("edit");
        } else if (params.get("mode") !== "view") {
          setMode("edit");
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave (debounced) whenever plan changes
  useEffect(() => {
    if (loading) return;
    const id = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("safety_plans").upsert({
        user_id: user.id,
        warning_signs: plan.signs as unknown as never,
        coping_strategies: plan.coping as unknown as never,
        contacts: plan.network as unknown as never,
        environment_notes: JSON.stringify({ env: plan.env, emergencies: plan.emergencies }),
      }, { onConflict: "user_id" });
      if (!isPlanEmpty(plan)) setHasSavedPlan(true);
    }, 700);
    return () => clearTimeout(id);
  }, [plan, loading]);

  const enterEdit = () => { setWizardStep(0); setMode("edit"); };
  const exitEdit = () => { setMode("view"); setWizardStep(0); };
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/herramientas");
  };

  // Merge hotlines (country) with user-added emergencies for the view
  const allEmergencies: Contact[] = useMemo(() => [
    ...hotlines.map(h => ({ name: h.label, phone: h.phone })),
    ...plan.emergencies,
  ], [hotlines, plan.emergencies]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7f9] text-slate-500">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const planEmpty = isPlanEmpty(plan);

  return (
    <div className="relative min-h-screen bg-[#f4f7f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <AnimatePresence mode="wait">
          {mode === "view" ? (
            <ViewMode
              key="view"
              plan={plan}
              planEmpty={planEmpty}
              allEmergencies={allEmergencies}
              country={country}
              onEdit={enterEdit}
              onBack={goBack}
            />
          ) : (
            <EditWizard
              key="edit"
              plan={plan}
              setPlan={setPlan}
              step={wizardStep}
              setStep={setWizardStep}
              onCancel={hasSavedPlan ? exitEdit : goBack}
              onFinish={() => { toast.success("Plan guardado"); exitEdit(); }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── VIEW MODE (SOS) ───────────────────────────────────────────────────────
function ViewMode({
  plan, planEmpty, allEmergencies, country, onEdit, onBack,
}: {
  plan: Plan; planEmpty: boolean; allEmergencies: Contact[]; country: string;
  onEdit: () => void; onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-1 flex-col px-5 pb-32 pt-4"
    >
      <header className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 shadow-sm">
          <ArrowLeft size={18} className="text-slate-700" />
        </button>
        {!planEmpty && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm active:scale-95"
          >
            <Pencil size={13} /> Editar Plan
          </button>
        )}
      </header>

      {/* Hero */}
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 shadow-inner shadow-rose-100">
          <ShieldAlert size={34} className="text-rose-500" strokeWidth={1.8} />
        </div>
        <h1 className="mt-4 font-serif text-[26px] leading-tight text-slate-900">Tu red de contención</h1>
        <p className="mt-1 text-xs text-slate-500">Un plan pensado en calma para usar en momentos difíciles.</p>
      </div>

      {/* Emergencias — always visible */}
      {allEmergencies.length > 0 && (
        <>
          <SectionTitle>Líneas de emergencia</SectionTitle>
          <div className="space-y-2">
            {allEmergencies.map((e, i) => (
              <a
                key={`${e.name}-${i}`}
                href={e.phone ? `tel:${e.phone.replace(/\s+/g, "")}` : undefined}
                className="group flex items-center gap-3 rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/80 to-white/80 p-4 shadow-sm backdrop-blur-xl transition hover:bg-white active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-rose-500 group-hover:text-rose-600">
                  <Phone size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-rose-800">{e.name}</p>
                  {e.phone && <p className="font-mono text-[13px] text-rose-600">{e.phone}</p>}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* CTA when plan is empty */}
      {planEmpty ? (
        <div className="mt-8 rounded-3xl border border-[#7cc2c8]/30 bg-white/85 p-6 text-center shadow-sm backdrop-blur-md">
          <p className="font-serif text-[18px] leading-snug text-slate-900">
            Todavía no armaste tu plan de seguridad
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
            Un plan pensado en calma te da herramientas concretas para los momentos difíciles.
            Lleva 5 minutos y podés editarlo cuando quieras.
          </p>
          <button
            onClick={onEdit}
            className="mt-5 w-full rounded-2xl bg-[#7cc2c8] py-3.5 font-serif text-sm font-semibold text-[#101927] shadow-[0_10px_28px_-12px_rgba(124,194,200,0.6)] active:scale-[0.98]"
          >
            Armar mi plan
          </button>
        </div>
      ) : (
        <>
          {plan.coping.length > 0 && (
            <>
              <SectionTitle>Estrategias de calma</SectionTitle>
              <div className="space-y-2">
                {plan.coping.map((c, i) => (
                  <div key={`${c}-${i}`} className="flex items-center gap-3 rounded-2xl border border-teal-100/70 bg-white/80 p-3.5 shadow-sm backdrop-blur-md">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-[13px] font-bold text-[#2c6e73]">
                      {i + 1}
                    </span>
                    <p className="flex-1 text-[13.5px] leading-snug text-slate-700">{c}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {plan.signs.length > 0 && (
            <>
              <SectionTitle>Señales de alerta</SectionTitle>
              <div className="rounded-2xl border border-amber-100/70 bg-white/80 p-4 shadow-sm backdrop-blur-md">
                <ul className="space-y-2">
                  {plan.signs.map((s, i) => (
                    <li key={`${s}-${i}`} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {plan.network.length > 0 && (
            <>
              <SectionTitle>Red de apoyo</SectionTitle>
              <div className="space-y-2">
                {plan.network.map((c, i) => (
                  <div key={`${c.name}-${i}`} className="flex items-center gap-3 rounded-2xl border border-indigo-100/70 bg-white/80 p-3.5 shadow-sm backdrop-blur-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                      <Users size={17} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                      {c.phone && <p className="font-mono text-[12px] text-slate-500">{c.phone}</p>}
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone.replace(/\s+/g, "")}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm active:scale-95"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {plan.env.length > 0 && (
            <>
              <SectionTitle>Modificar el entorno</SectionTitle>
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur-md">
                <ul className="space-y-2">
                  {plan.env.map((e, i) => (
                    <li key={`${e}-${i}`} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-slate-400">
            País: {country} · guardado automático
          </p>
        </>
      )}
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-6 mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{children}</h2>;
}
function EmptyHint({ text }: { text: string }) {
  return <p className="rounded-xl bg-white/60 p-3 text-center text-[12px] text-slate-400">{text}</p>;
}

// ─── EDIT WIZARD ───────────────────────────────────────────────────────────
function EditWizard({
  plan, setPlan, step, setStep, onCancel, onFinish,
}: {
  plan: Plan; setPlan: React.Dispatch<React.SetStateAction<Plan>>;
  step: number; setStep: (n: number) => void;
  onCancel: () => void; onFinish: () => void;
}) {
  const current = STEPS[step];
  const Icon = current.icon;

  const next = () => {
    if (step >= STEPS.length - 1) onFinish();
    else setStep(step + 1);
  };
  const back = () => { if (step > 0) setStep(step - 1); else onCancel(); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex flex-1 flex-col px-5 pt-4"
    >
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <button onClick={back} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 shadow-sm">
          <ArrowLeft size={18} className="text-slate-700" />
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm active:scale-95"
        >
          <X size={13} /> Cancelar
        </button>
      </header>

      {/* Step header */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7cc2c8]/15 text-[#2c6e73]">
          <Icon size={22} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paso {step + 1} de {STEPS.length}</p>
          <h1 className="font-serif text-[22px] leading-tight text-slate-900">{current.title}</h1>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{current.sub}</p>

      {/* Progress bar */}
      <div className="mt-4 flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition ${i <= step ? "bg-[#7cc2c8]" : "bg-slate-200"}`}
          />
        ))}
      </div>

      {/* Body */}
      <div className="mt-5 flex-1 overflow-y-auto pb-40 no-scrollbar">
        <div className="rounded-3xl border border-slate-100 bg-white/85 p-4 shadow-sm backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
          {current.key === "signs" && (
            <ListEditor
              placeholder="Escribí una señal…"
              items={plan.signs}
              suggestions={SUGGESTED_SIGNS}
              onAdd={(v) => setPlan(p => ({ ...p, signs: [...p.signs, v] }))}
              onRemove={(i) => setPlan(p => ({ ...p, signs: p.signs.filter((_, idx) => idx !== i) }))}
            />
          )}
          {current.key === "coping" && (
            <ListEditor
              placeholder="Escribí una estrategia…"
              items={plan.coping}
              suggestions={SUGGESTED_COPING}
              onAdd={(v) => setPlan(p => ({ ...p, coping: [...p.coping, v] }))}
              onRemove={(i) => setPlan(p => ({ ...p, coping: p.coping.filter((_, idx) => idx !== i) }))}
            />
          )}
          {current.key === "env" && (
            <ListEditor
              placeholder="Ej: guardar medicación bajo llave…"
              items={plan.env}
              suggestions={SUGGESTED_ENV}
              onAdd={(v) => setPlan(p => ({ ...p, env: [...p.env, v] }))}
              onRemove={(i) => setPlan(p => ({ ...p, env: p.env.filter((_, idx) => idx !== i) }))}
            />
          )}
          {current.key === "network" && (
            <ContactEditor
              items={plan.network}
              onAdd={(c) => setPlan(p => ({ ...p, network: [...p.network, c] }))}
              onRemove={(i) => setPlan(p => ({ ...p, network: p.network.filter((_, idx) => idx !== i) }))}
            />
          )}
        </div>

      </div>

      {/* Footer CTA — sits above the bottom nav */}
      <div className="fixed inset-x-0 bottom-0 px-5 pt-4 bg-gradient-to-t from-[#f4f7f9] via-[#f4f7f9]/95 to-transparent"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6.5rem)" }}
      >
        <div className="mx-auto max-w-md">
          <button
            onClick={next}
            className="w-full rounded-[20px] bg-[#7cc2c8] py-4 font-serif text-[15px] font-semibold text-[#101927] shadow-[0_10px_28px_-12px_rgba(124,194,200,0.6)] active:scale-[0.98]"
          >
            {step === STEPS.length - 1 ? "Finalizar Plan de Seguridad" : "Siguiente Paso"}
          </button>
        </div>
      </div>

    </motion.div>
  );
}

function ListEditor({
  items, suggestions, placeholder, onAdd, onRemove,
}: {
  items: string[]; suggestions?: string[]; placeholder: string;
  onAdd: (v: string) => void; onRemove: (i: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    onAdd(v); setDraft("");
  };
  const remaining = (suggestions ?? []).filter(s => !items.includes(s));
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7cc2c8]"
        />
        <button
          onClick={commit}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#101927] text-white active:scale-95"
        >
          <Plus size={18} />
        </button>
      </div>
      {remaining.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sugerencias</p>
          <div className="flex flex-wrap gap-1.5">
            {remaining.map(s => (
              <button
                key={s}
                onClick={() => onAdd(s)}
                className="rounded-full border border-[#7cc2c8]/40 bg-white px-3 py-1 text-[11.5px] font-medium text-[#2c6e73] active:scale-95"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {items.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {items.map((it, i) => (
            <li key={`${it}-${i}`} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 animate-[slideIn_0.3s_ease-out]">
              <span className="flex-1 text-[13px] text-slate-700">{it}</span>
              <button onClick={() => onRemove(i)} className="p-1 text-slate-400 hover:text-rose-500">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ContactEditor({
  items, onAdd, onRemove, placeholderName = "Nombre", hint,
}: {
  items: Contact[]; onAdd: (c: Contact) => void; onRemove: (i: number) => void;
  placeholderName?: string; hint?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const commit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), phone: phone.trim() });
    setName(""); setPhone("");
  };
  return (
    <div className="space-y-3">
      {hint && <p className="rounded-xl bg-[#7cc2c8]/10 px-3 py-2 text-[11.5px] text-[#2c6e73]">{hint}</p>}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholderName}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7cc2c8]"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Teléfono"
          inputMode="tel"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7cc2c8]"
        />
        <button
          onClick={commit}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#101927] text-white active:scale-95"
        >
          <Plus size={18} />
        </button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {items.map((c, i) => (
            <li key={`${c.name}-${i}`} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 animate-[slideIn_0.3s_ease-out]">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-800">{c.name}</p>
                {c.phone && <p className="font-mono text-[11.5px] text-slate-500">{c.phone}</p>}
              </div>
              <button onClick={() => onRemove(i)} className="p-1 text-slate-400 hover:text-rose-500">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
