import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, RotateCcw, ChevronDown, Search, Plus, X, Star, Check,
  ArrowRight, Calendar, ListChecks, LayoutGrid, CheckCircle2, Loader2, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  VALUE_CATEGORIES, ACTIVITIES, DAYS, DAY_LABELS, HOURS, activityCatsForValues,
} from "@/components/bienestar/data";
import {
  useBienestarDraft, readFavs, toggleFav, type BienestarDraft, type BlockLog, type CustomActivity,
} from "@/components/bienestar/useBienestarDraft";

// ─────────────────────────────────────────────────────────────
// Ambient background
// ─────────────────────────────────────────────────────────────
function AmbientBG() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#7cc2c8] opacity-20 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 24, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 h-[460px] w-[460px] rounded-full bg-[#facb60] opacity-20 blur-3xl"
        animate={{ x: [0, -28, 0], y: [0, -18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

const glass =
  "bg-white/60 backdrop-blur-xl border border-white/55 shadow-[0_10px_40px_-10px_rgba(16,25,39,0.08)]";

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────
function Header({ title, onReset }: { title: string; onReset: () => void }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-[28px] px-4 py-3", glass)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7cc2c8]/15">
        <Sparkles size={20} className="text-[#0c5b62]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#101927]/55">
          Desarrollo personal
        </p>
        <p className="truncate font-serif text-lg font-bold text-[#101927]">{title}</p>
      </div>
      <button
        onClick={onReset}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#101927]/70 shadow-sm active:scale-95"
        aria-label="Reiniciar"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PASO 1 — Valores
// ─────────────────────────────────────────────────────────────
function Step1Values({ draft, update }: { draft: BienestarDraft; update: any }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const isSel = (id: number) => draft.selectedValues.includes(id);
  const togItem = (id: number) =>
    update((d: BienestarDraft) => ({
      selectedValues: isSel(id)
        ? d.selectedValues.filter((x) => x !== id)
        : [...d.selectedValues, id],
    }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-widest text-[#7cc2c8]">Paso 1 de 4</span>
        <span className="font-semibold text-[#101927]/60">Brújula de Valores</span>
      </div>
      <p className="text-sm leading-6 text-[#101927]/75">
        Elegí uno o más valores prioritarios. Desplegá cada sección para tildar lo que querés cultivar hoy.
      </p>

      <div className="space-y-2">
        {VALUE_CATEGORIES.map((cat) => {
          const isOpen = !!open[cat.id];
          const count = cat.items.filter((i) => isSel(i.id)).length;
          return (
            <div key={cat.id} className={cn("rounded-[24px] overflow-hidden", glass)}>
              <button
                onClick={() => toggle(cat.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="flex-1 font-display text-[13px] font-bold uppercase tracking-wide text-[#101927]">
                  {cat.title}
                </span>
                {count > 0 && (
                  <span className="rounded-full bg-[#7cc2c8] px-2 py-0.5 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                  <ChevronDown size={16} className="text-[#101927]/55" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 border-t border-white/60 bg-white/30 px-4 py-3">
                      {cat.items.map((it) => {
                        const sel = isSel(it.id);
                        return (
                          <button
                            key={it.id}
                            onClick={() => togItem(it.id)}
                            className="flex w-full items-start gap-3 rounded-2xl px-2 py-2 text-left active:bg-white/60"
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                                sel
                                  ? "border-[#7cc2c8] bg-[#7cc2c8] text-white"
                                  : "border-[#101927]/25 bg-white/70"
                              )}
                            >
                              {sel && <Check size={12} strokeWidth={3} />}
                            </span>
                            <span className="text-[13px] font-medium leading-snug text-[#101927]">
                              {it.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PASO 2 — Embudo de metas
// ─────────────────────────────────────────────────────────────
function Step2Goals({ draft, update }: { draft: BienestarDraft; update: any }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);

  const selectedValueTexts = useMemo(() => {
    const all = VALUE_CATEGORIES.flatMap((c) => c.items);
    return draft.selectedValues
      .map((id) => all.find((v) => v.id === id)?.text)
      .filter(Boolean) as string[];
  }, [draft.selectedValues]);

  const fallbackSuggestions = (vals: string[]): string[] => {
    const base = vals[0]?.toLowerCase() || "tu bienestar";
    return [
      `Dedicar 15 minutos diarios a ${base.slice(0, 40)}.`,
      `Sumar una actividad placentera concreta esta semana.`,
      `Compartir un momento de calidad con alguien importante.`,
    ];
  };

  const askAI = async () => {
    setLoading(true);
    setSuggestions(null);
    try {
      const { data, error } = await supabase.functions.invoke("dbt-ai", {
        body: {
          task: "bienestar-goals",
          payload: { values: selectedValueTexts.join(" · ") },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const text = (data?.result as string) || "";
      const lines = text
        .split("\n")
        .map((l) => l.replace(/^[\-\*\d\.\)\s]+/, "").trim())
        .filter((l) => l.length > 6)
        .slice(0, 3);
      const final = lines.length ? lines : fallbackSuggestions(selectedValueTexts);
      setSuggestions(final);
      // Auto-aplicar la primera como Meta 1 y como Meta de hoy si están vacías
      update((d: BienestarDraft) => {
        const g = [...d.goals] as [string, string, string];
        const patch: Partial<BienestarDraft> = {};
        if (!g[0].trim()) { g[0] = final[0]; patch.goals = g; }
        if (!d.todayGoal.trim()) patch.todayGoal = final[0];
        return patch;
      });
    } catch (e: any) {
      const fb = fallbackSuggestions(selectedValueTexts);
      setSuggestions(fb);
      toast.message("Usamos sugerencias locales", { description: "La IA no respondió, pero podés trabajar con estas ideas." });
      update((d: BienestarDraft) => {
        const g = [...d.goals] as [string, string, string];
        const patch: Partial<BienestarDraft> = {};
        if (!g[0].trim()) { g[0] = fb[0]; patch.goals = g; }
        if (!d.todayGoal.trim()) patch.todayGoal = fb[0];
        return patch;
      });
    } finally {
      setLoading(false);
    }
  };

  const setGoal = (idx: number, val: string) =>
    update((d: BienestarDraft) => {
      const g = [...d.goals] as [string, string, string];
      g[idx] = val;
      // Si el usuario escribe en todayGoal y meta1 vacía, espejar (manejado abajo)
      return { goals: g };
    });

  const setTodayGoal = (val: string) =>
    update((d: BienestarDraft) => {
      const patch: Partial<BienestarDraft> = { todayGoal: val };
      if (!d.goals[0].trim() && val.trim()) {
        patch.goals = [val, d.goals[1], d.goals[2]];
      }
      return patch;
    });

  const useSuggestion = (s: string) => {
    const emptyIdx = draft.goals.findIndex((g) => !g.trim());
    if (emptyIdx >= 0) setGoal(emptyIdx, s);
    else setGoal(0, s);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-widest text-[#7cc2c8]">Paso 2 de 4</span>
        <span className="font-semibold text-[#101927]/60">Embudo de Acción</span>
      </div>

      <div className={cn("rounded-[24px] px-4 py-3", glass)}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
          Valores elegidos
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedValueTexts.length === 0 && (
            <span className="text-xs text-[#101927]/55">Volvé al paso 1 para elegir valores.</span>
          )}
          {selectedValueTexts.map((t, i) => (
            <span
              key={i}
              className="rounded-full border border-[#7cc2c8]/30 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-[#0c5b62]"
            >
              {t.length > 50 ? t.slice(0, 48) + "…" : t}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={askAI}
        disabled={loading || selectedValueTexts.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#facb60]/25 px-4 py-3 font-display text-[13px] font-semibold text-[#8a6a14] backdrop-blur-md active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        ¿Necesitás ideas? Preguntale a la IA
      </button>

      <AnimatePresence>
        {suggestions && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn("space-y-2 rounded-[24px] p-3", glass)}
          >
            <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
              Sugerencias · tocá para usar
            </p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => useSuggestion(s)}
                className="flex w-full items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-left text-[13px] text-[#101927] active:bg-white"
              >
                <Sparkles size={12} className="mt-1 shrink-0 text-[#facb60]" />
                <span>{s}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inverted funnel */}
      <div className="space-y-3">
        <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
          Tres metas relacionadas
        </p>
        {[0, 1, 2].map((i) => (
          <input
            key={i}
            value={draft.goals[i] ?? ""}
            onChange={(e) => setGoal(i, e.target.value)}
            placeholder={`Meta ${i + 1}…`}
            className="w-full rounded-full border border-white/60 bg-white/70 px-5 py-3 text-sm text-[#101927] shadow-inner placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
            style={{ width: `${100 - i * 8}%`, marginLeft: `${i * 4}%` }}
          />
        ))}
        <div className="flex justify-center pt-1">
          <div className="w-2/3">
            <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-[#8a6a14]">
              Meta de enfoque · HOY
            </p>
            <input
              value={draft.todayGoal}
              onChange={(e) => setTodayGoal(e.target.value)}
              placeholder="¿Qué vas a trabajar hoy?"
              className="w-full rounded-full border-2 border-[#facb60] bg-gradient-to-br from-[#facb60]/20 to-white/70 px-5 py-3 text-center text-sm font-semibold text-[#101927] shadow-inner placeholder:text-[#8a6a14]/60 focus:outline-none focus:ring-2 focus:ring-[#facb60]/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PASO 3 — Catálogo de actividades
// ─────────────────────────────────────────────────────────────
function Step3Activities({ draft, update }: { draft: BienestarDraft; update: any }) {
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<number[]>(() => readFavs());
  const [customName, setCustomName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const allActs = useMemo(() => [...ACTIVITIES, ...draft.customActivities], [draft.customActivities]);

  const recommendedCats = useMemo(() => activityCatsForValues(draft.selectedValues), [draft.selectedValues]);

  const sorted = useMemo(() => {
    const arr = [...allActs];
    arr.sort((a, b) => {
      const ar = recommendedCats.has(a.category) ? 0 : 1;
      const br = recommendedCats.has(b.category) ? 0 : 1;
      return ar - br;
    });
    return arr;
  }, [allActs, recommendedCats]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter(
      (a) => a.name.toLowerCase().includes(term) || a.category.toLowerCase().includes(term)
    );
  }, [q, sorted]);

  const recommended = useMemo(
    () => sorted.filter((a) => recommendedCats.has(a.category)).slice(0, 8),
    [sorted, recommendedCats]
  );

  const favActivities = useMemo(
    () => favs.map((id) => allActs.find((a) => a.id === id)).filter(Boolean) as typeof ACTIVITIES,
    [favs, allActs]
  );

  const isSel = (id: number) => draft.selectedActivities.includes(id);
  const togSel = (id: number) =>
    update((d: BienestarDraft) => ({
      selectedActivities: isSel(id)
        ? d.selectedActivities.filter((x) => x !== id)
        : [...d.selectedActivities, id],
    }));

  const togFav = (id: number) => setFavs(toggleFav(id));

  const addCustom = (name: string, category = "Personal") => {
    const trimmed = name.trim();
    if (!trimmed) return;
    update((d: BienestarDraft) => {
      const nextId = 10000 + d.customActivities.length + Math.floor(Math.random() * 1000);
      const newAct: CustomActivity = { id: nextId, name: trimmed, category };
      return {
        customActivities: [...d.customActivities, newAct],
        selectedActivities: [...d.selectedActivities, nextId],
      };
    });
  };

  const askAIActivities = async () => {
    const valTexts = VALUE_CATEGORIES.flatMap((c) => c.items)
      .filter((i) => draft.selectedValues.includes(i.id))
      .map((i) => i.text);
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("dbt-ai", {
        body: {
          task: "bienestar-activities",
          payload: { values: valTexts.join(" · "), goal: draft.todayGoal || "" },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const text = (data?.result as string) || "";
      const lines = text
        .split("\n")
        .map((l) => l.replace(/^[\-\*\d\.\)\s]+/, "").trim())
        .filter((l) => l.length > 4)
        .slice(0, 5);
      if (lines.length === 0) throw new Error("Sin sugerencias");
      lines.forEach((l) => addCustom(l, "IA"));
      toast.success(`${lines.length} ideas agregadas`);
    } catch (e: any) {
      toast.error("La IA no respondió. Probá agregar la tuya manualmente.");
    } finally {
      setAiLoading(false);
    }
  };

  const selected = draft.selectedActivities
    .map((id) => allActs.find((a) => a.id === id))
    .filter(Boolean) as typeof ACTIVITIES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-widest text-[#7cc2c8]">Paso 3 de 4</span>
        <span className="font-semibold text-[#101927]/60">Actividades Agradables</span>
      </div>
      <p className="text-sm leading-6 text-[#101927]/75">
        Buscá y sumá al menos 3 actividades placenteras. Marcá con ⭐ las que quieras reutilizar.
      </p>

      <div className={cn("flex items-center gap-2 rounded-full px-4 py-2.5", glass)}>
        <Search size={16} className="text-[#101927]/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar actividad…"
          className="w-full bg-transparent text-sm text-[#101927] placeholder:text-[#101927]/40 focus:outline-none"
        />
      </div>

      {/* Crear propia + IA */}
      <div className={cn("space-y-2 rounded-[24px] p-3", glass)}>
        <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-[#7cc2c8]">
          Crear actividad propia
        </p>
        <div className="flex gap-2">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { addCustom(customName); setCustomName(""); } }}
            placeholder="Ej: Tomar mate con mi hermana"
            className="flex-1 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-[13px] text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
          />
          <button
            onClick={() => { addCustom(customName); setCustomName(""); }}
            disabled={!customName.trim()}
            className="rounded-full bg-[#101927] px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          onClick={askAIActivities}
          disabled={aiLoading || draft.selectedValues.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#facb60]/25 px-4 py-2.5 text-[12px] font-semibold text-[#8a6a14] disabled:opacity-50"
        >
          {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Pedir 5 ideas a la IA según tus valores
        </button>
      </div>

      {favActivities.length > 0 && (
        <div className={cn("rounded-[24px] p-3", glass)}>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#facb60]">
            ⭐ Tus favoritas
          </p>
          <div className="space-y-1">
            {favActivities.map((a) => (
              <ActivityRow key={a.id} a={a} selected={isSel(a.id)} fav onAdd={() => togSel(a.id)} onFav={() => togFav(a.id)} />
            ))}
          </div>
        </div>
      )}

      {!q && recommended.length > 0 && (
        <div className={cn("rounded-[24px] p-3", glass)}>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#7cc2c8]">
            Recomendadas para tus valores
          </p>
          <div className="space-y-1">
            {recommended.map((a) => (
              <ActivityRow key={"rec-" + a.id} a={a} selected={isSel(a.id)} fav={favs.includes(a.id)} onAdd={() => togSel(a.id)} onFav={() => togFav(a.id)} />
            ))}
          </div>
        </div>
      )}

      <div className={cn("rounded-[24px] p-3", glass)}>
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
          Catálogo completo
        </p>
        <div className="max-h-[45vh] space-y-1 overflow-y-auto pr-1">
          {filtered.map((a) => (
            <ActivityRow key={a.id} a={a} selected={isSel(a.id)} fav={favs.includes(a.id)} onAdd={() => togSel(a.id)} onFav={() => togFav(a.id)} />
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
            Tus seleccionadas · {selected.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((a) => (
              <button
                key={a.id}
                onClick={() => togSel(a.id)}
                className="flex items-center gap-1.5 rounded-full bg-[#101927] px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                <span className="max-w-[180px] truncate">{a.name}</span>
                <X size={12} className="text-[#facb60]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityRow({
  a, selected, fav, onAdd, onFav,
}: {
  a: (typeof ACTIVITIES)[number];
  selected: boolean;
  fav: boolean;
  onAdd: () => void;
  onFav: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-2 py-2 transition-colors",
        selected ? "bg-[#7cc2c8]/15 ring-1 ring-[#7cc2c8]" : "bg-white/40"
      )}
    >
      <button onClick={onFav} className="shrink-0 p-1" aria-label="Favorita">
        <Star
          size={16}
          className={fav ? "fill-[#facb60] text-[#facb60]" : "text-[#101927]/30"}
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight text-[#101927]">{a.name}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#101927]/45">
          {a.category}
        </p>
      </div>
      <button
        onClick={onAdd}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-[#7cc2c8] text-white" : "bg-white/80 text-[#101927]/55"
        )}
        aria-label={selected ? "Quitar" : "Agregar"}
      >
        {selected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PASO 4 — Planificador
// ─────────────────────────────────────────────────────────────
type Tab = "armado" | "seguimiento" | "semana";

function Step4Planner({
  draft, update, initialDay, initialTab,
}: {
  draft: BienestarDraft;
  update: any;
  initialDay?: string;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "armado");
  const [day, setDay] = useState<string>(initialDay ?? DAYS[0]);
  const [assignFor, setAssignFor] = useState<string | null>(null); // hour key
  const [logFor, setLogFor] = useState<string | null>(null);

  const selectedActivities = draft.selectedActivities
    .map((id) => ACTIVITIES.find((a) => a.id === id))
    .filter(Boolean) as typeof ACTIVITIES;

  const blocks = draft.agenda[day] ?? {};

  const assign = (hour: string, activityId: number) => {
    const act = ACTIVITIES.find((a) => a.id === activityId);
    if (!act) return;
    update((d: BienestarDraft) => ({
      agenda: {
        ...d.agenda,
        [day]: { ...(d.agenda[day] ?? {}), [hour]: { activityId, activityName: act.name } },
      },
    }));
    setAssignFor(null);
  };

  const removeBlock = (hour: string) => {
    update((d: BienestarDraft) => {
      const dayBlocks = { ...(d.agenda[day] ?? {}) };
      delete dayBlocks[hour];
      return { agenda: { ...d.agenda, [day]: dayBlocks } };
    });
    setAssignFor(null);
  };

  const saveLog = (hour: string, log: BlockLog) => {
    update((d: BienestarDraft) => {
      const dayBlocks = { ...(d.agenda[day] ?? {}) };
      const blk = dayBlocks[hour];
      if (blk) dayBlocks[hour] = { ...blk, log };
      return { agenda: { ...d.agenda, [day]: dayBlocks } };
    });
    setLogFor(null);
    toast.success("Registro guardado");
  };

  const dayCount = (dKey: string) => Object.values(draft.agenda[dKey] ?? {}).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-widest text-[#7cc2c8]">Paso 4 de 4</span>
        <span className="font-semibold text-[#101927]/60">Planificador Semanal</span>
      </div>

      <div className={cn("flex rounded-full p-1", glass)}>
        {[
          { id: "armado", label: "Armado", icon: ListChecks },
          { id: "seguimiento", label: "Seguimiento", icon: Calendar },
          { id: "semana", label: "Semana", icon: LayoutGrid },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[11px] font-semibold",
              tab === t.id ? "bg-[#101927] text-white" : "text-[#101927]/65"
            )}
          >
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {tab !== "semana" && (
        <div className={cn("flex justify-between gap-1 rounded-[24px] px-2 py-3", glass)}>
          {DAYS.map((d, i) => {
            const c = dayCount(d);
            const active = day === d;
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-[10px] font-bold transition-colors",
                  active ? "bg-[#7cc2c8]/20 text-[#0c5b62]" : "text-[#101927]/60"
                )}
              >
                <span>{DAY_LABELS[i]}</span>
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                    c > 0
                      ? "bg-[#7cc2c8] text-white"
                      : "border border-dashed border-[#101927]/25 text-[#101927]/40"
                  )}
                >
                  {c}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {tab === "armado" && (
        <div className={cn("space-y-1.5 rounded-[24px] p-3", glass)}>
          {HOURS.map((h) => {
            const blk = blocks[h];
            return (
              <button
                key={h}
                onClick={() => setAssignFor(h)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                  blk
                    ? "bg-[#7cc2c8]/20 border border-[#7cc2c8]/40"
                    : "border border-dashed border-[#101927]/15 bg-white/30"
                )}
              >
                <span className="font-display text-[13px] font-bold text-[#101927]">{h}</span>
                <span
                  className={cn(
                    "flex-1 text-[12px]",
                    blk ? "font-semibold text-[#101927]" : "italic text-[#101927]/40"
                  )}
                >
                  {blk ? blk.activityName : "Bloque vacío. Agendar…"}
                </span>
                <Plus size={16} className="text-[#101927]/45" />
              </button>
            );
          })}
        </div>
      )}

      {tab === "seguimiento" && (
        <div className={cn("space-y-1.5 rounded-[24px] p-3", glass)}>
          {HOURS.map((h) => {
            const blk = blocks[h];
            const done = !!blk?.log;
            return (
              <div
                key={h}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3",
                  done
                    ? "bg-emerald-100/60 border border-emerald-300"
                    : blk
                    ? "bg-[#7cc2c8]/15 border border-[#7cc2c8]/30"
                    : "border border-dashed border-[#101927]/10 bg-white/20 opacity-60"
                )}
              >
                <span className="w-12 font-display text-[13px] font-bold text-[#101927]">{h}</span>
                {blk ? (
                  <>
                    <button
                      onClick={() => (done ? null : setLogFor(h))}
                      disabled={done}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md border-2",
                        done
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-[#101927]/35 bg-white"
                      )}
                    >
                      {done && <Check size={12} strokeWidth={3} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[#101927]">
                        {blk.activityName}
                      </p>
                      {done && blk.log && (
                        <p className="text-[10px] text-[#101927]/55">
                          Agrado {blk.log.enjoyment}/5 · Atención {blk.log.attention}/5
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-[12px] italic text-[#101927]/40">Sin actividad</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "semana" && <WeekHeatmap agenda={draft.agenda} onPick={(d, h) => { setDay(d); setTab("seguimiento"); }} />}

      {/* ASSIGN MODAL */}
      <AnimatePresence>
        {assignFor && (
          <Sheet onClose={() => setAssignFor(null)}>
            <div className="space-y-3">
              <div>
                <p className="font-display text-base font-bold text-[#101927]">
                  Asignar a {assignFor}
                </p>
                <p className="text-[12px] text-[#101927]/60">
                  Día: <span className="font-semibold uppercase">{day}</span>
                </p>
              </div>
              <div className="max-h-[55vh] space-y-1 overflow-y-auto">
                {selectedActivities.length === 0 && (
                  <p className="rounded-xl bg-amber-50 p-3 text-[12px] text-amber-800">
                    No tenés actividades seleccionadas. Volvé al Paso 3.
                  </p>
                )}
                {selectedActivities.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => assign(assignFor!, a.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2 text-left active:bg-white"
                  >
                    <span className="text-[13px] font-semibold text-[#101927]">{a.name}</span>
                    <ArrowRight size={14} className="text-[#7cc2c8]" />
                  </button>
                ))}
              </div>
              {blocks[assignFor!] && (
                <button
                  onClick={() => removeBlock(assignFor!)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 py-3 text-[12px] font-semibold text-red-600 active:scale-[0.98]"
                >
                  <Trash2 size={14} /> Quitar actividad del bloque
                </button>
              )}
            </div>
          </Sheet>
        )}
      </AnimatePresence>

      {/* LOG MODAL */}
      <AnimatePresence>
        {logFor && (
          <Sheet onClose={() => setLogFor(null)}>
            <LogForm
              hour={logFor}
              activityName={blocks[logFor]?.activityName ?? ""}
              onSave={(log) => saveLog(logFor!, log)}
            />
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function WeekHeatmap({
  agenda, onPick,
}: {
  agenda: BienestarDraft["agenda"];
  onPick: (day: string, hour: string) => void;
}) {
  return (
    <div className={cn("rounded-[24px] p-3", glass)}>
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
        Vista semanal · 7 días × 8 horarios
      </p>
      <div className="grid grid-cols-[42px_repeat(7,1fr)] gap-1">
        <div />
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[9px] font-bold uppercase tracking-wider text-[#101927]/55"
          >
            {d}
          </div>
        ))}
        {HOURS.map((h) => (
          <>
            <div
              key={h}
              className="text-right pr-1 text-[9px] font-semibold text-[#101927]/45 self-center"
            >
              {h}
            </div>
            {DAYS.map((d) => {
              const blk = agenda[d]?.[h];
              const state = !blk ? "empty" : blk.log ? "done" : "scheduled";
              return (
                <button
                  key={d + h}
                  onClick={() => onPick(d, h)}
                  className={cn(
                    "h-7 rounded-md transition-colors",
                    state === "empty" && "bg-[#101927]/5",
                    state === "scheduled" && "bg-[#7cc2c8]/60",
                    state === "done" && "bg-emerald-500/70"
                  )}
                  aria-label={`${d} ${h}`}
                />
              );
            })}
          </>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-[#101927]/55">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-[#101927]/5" /> Vacío
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-[#7cc2c8]/60" /> Agendado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-emerald-500/70" /> Completado
        </span>
      </div>
    </div>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#101927]/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        exit={{ y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[32px] bg-[#FDFCFB] p-5 pb-8 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#101927]/15" />
        {children}
      </motion.div>
    </motion.div>
  );
}

function LogForm({
  hour, activityName, onSave,
}: {
  hour: string;
  activityName: string;
  onSave: (l: BlockLog) => void;
}) {
  const [enjoyment, setEnjoyment] = useState(3);
  const [attention, setAttention] = useState(3);
  const [letgo, setLetgo] = useState(3);
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
          Registrar bloque · {hour}
        </p>
        <p className="font-display text-base font-bold text-[#101927]">{activityName}</p>
      </div>
      <Slider label="Nivel de agrado" value={enjoyment} onChange={setEnjoyment} />
      <Slider label="Atención plena" value={attention} onChange={setAttention} />
      <Slider label="Dejar ir preocupaciones" value={letgo} onChange={setLetgo} />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas breves…"
        rows={3}
        className="w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#101927] shadow-inner placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
      />
      <button
        onClick={() => onSave({ enjoyment, attention, letgo, notes })}
        className="w-full rounded-full bg-emerald-600 py-3 font-display text-sm font-bold text-white active:scale-[0.98]"
      >
        Guardar registro
      </button>
    </div>
  );
}

function Slider({
  label, value, onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#101927]">{label}</span>
        <span className="font-display text-sm font-bold text-[#7cc2c8]">{value}/5</span>
      </div>
      <input
        type="range"
        min={0}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-[#7cc2c8]"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FINISH
// ─────────────────────────────────────────────────────────────
function FinishScreen({ draft, onReset }: { draft: BienestarDraft; onReset: () => void }) {
  const navigate = useNavigate();
  const allValues = VALUE_CATEGORIES.flatMap((c) => c.items);
  const topValues = draft.selectedValues
    .slice(0, 3)
    .map((id) => allValues.find((v) => v.id === id)?.text)
    .filter(Boolean) as string[];

  const totalBlocks = DAYS.reduce(
    (n, d) => n + Object.values(draft.agenda[d] ?? {}).filter(Boolean).length,
    0
  );

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/30"
      >
        <CheckCircle2 size={56} className="text-white" strokeWidth={2.5} />
      </motion.div>
      <h1 className="font-serif text-2xl font-bold text-[#101927]">
        ¡Plan de Bienestar configurado!
      </h1>
      <p className="mt-2 text-sm text-[#101927]/65">
        Comprometete con los pequeños pasos. La consistencia crea bienestar.
      </p>

      <div className={cn("mt-5 w-full space-y-3 rounded-[32px] p-5 text-left", glass)}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
            Valores priorizados
          </p>
          <ul className="mt-1 space-y-1 text-[13px] text-[#101927]">
            {topValues.map((v, i) => (
              <li key={i}>· {v}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#101927]/55">
            Meta de hoy
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[#101927]">
            {draft.todayGoal || "—"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#7cc2c8]/15 p-3">
            <p className="text-[10px] font-semibold uppercase text-[#0c5b62]">Actividades</p>
            <p className="font-display text-xl font-bold text-[#101927]">
              {draft.selectedActivities.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#facb60]/20 p-3">
            <p className="text-[10px] font-semibold uppercase text-[#8a6a14]">Bloques semana</p>
            <p className="font-display text-xl font-bold text-[#101927]">{totalBlocks}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 w-full space-y-2">
        <button
          onClick={() => navigate("/")}
          className="w-full rounded-full bg-[#101927] py-3.5 font-display text-sm font-bold text-white active:scale-[0.98]"
        >
          Volver al inicio
        </button>
        <button
          onClick={onReset}
          className="w-full rounded-full bg-white/70 py-3 text-[12px] font-semibold text-[#101927]/70 active:scale-[0.98]"
        >
          Empezar un plan nuevo
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function ConstruirBienestar() {
  const navigate = useNavigate();
  const { draft, update, reset } = useBienestarDraft();
  const [confirmReset, setConfirmReset] = useState(false);

  // deep-link via querystring (?tab=seguimiento&day=hoy)
  const params = new URLSearchParams(window.location.search);
  const qsTab = (params.get("tab") as Tab | null) ?? undefined;
  const qsDayParam = params.get("day");
  const todayDay = (() => {
    const idx = (new Date().getDay() + 6) % 7;
    return DAYS[idx];
  })();
  const qsDay = qsDayParam === "hoy" ? todayDay : (qsDayParam as any) ?? undefined;

  // when arriving via deep-link with seguimiento, jump to step 4
  useEffect(() => {
    if (qsTab && draft.selectedActivities.length > 0 && draft.step < 4) {
      update({ step: 4 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canContinue = (() => {
    switch (draft.step) {
      case 1: return draft.selectedValues.length > 0;
      case 2: return draft.todayGoal.trim().length > 0 && draft.goals.some((g) => g.trim());
      case 3: return draft.selectedActivities.length >= 3;
      case 4: return true;
      default: return true;
    }
  })();

  const stepTitle =
    draft.step === 1 ? "1. Valores y Prioridades" :
    draft.step === 2 ? "2. Embudo de Acción" :
    draft.step === 3 ? "3. Actividades" :
    draft.step === 4 ? "4. Planificador Semanal" :
    "Plan completado";

  const goNext = () => {
    if (draft.step < 4) update({ step: (draft.step + 1) as any });
    else update({ step: 5, done: true });
  };

  return (
    <div className="relative min-h-screen bg-[#FDFCFB] pb-36">
      <AmbientBG />

      <div className="mx-auto max-w-md px-4 pt-10">
        <Header
          title={draft.step === 5 ? "Construir Bienestar" : stepTitle}
          onReset={() => setConfirmReset(true)}
        />

        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={draft.step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {draft.step === 1 && <Step1Values draft={draft} update={update} />}
              {draft.step === 2 && <Step2Goals draft={draft} update={update} />}
              {draft.step === 3 && <Step3Activities draft={draft} update={update} />}
              {draft.step === 4 && (
                <Step4Planner
                  draft={draft}
                  update={update}
                  initialDay={qsDay}
                  initialTab={qsTab}
                />
              )}
              {draft.step === 5 && <FinishScreen draft={draft} onReset={reset} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating selection counter (step 1) */}
      {draft.step === 1 && (
        <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-full bg-[#101927] px-5 py-2.5 text-[12px] font-semibold text-white shadow-xl">
            Seleccionados: <span className="text-[#7cc2c8]">{draft.selectedValues.length}</span> ítems
            {draft.selectedValues.length === 0 && (
              <span className="ml-2 text-white/60">· Elegí al menos uno</span>
            )}
          </div>
        </div>
      )}

      {/* Footer continue */}
      {draft.step < 5 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-md items-center gap-2">
            {draft.step > 1 && (
              <button
                onClick={() => update({ step: (draft.step - 1) as any })}
                className="rounded-full bg-white px-4 py-3 text-[12px] font-semibold text-[#101927]/70 shadow-sm active:scale-[0.98]"
              >
                Atrás
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canContinue}
              className="flex-1 rounded-full bg-[#101927] py-3.5 font-display text-sm font-bold text-white shadow-lg active:scale-[0.98] disabled:opacity-40"
            >
              {draft.step === 4 ? "Finalizar plan" : "Continuar"}
            </button>
          </div>
        </div>
      )}

      {/* RESET CONFIRM */}
      <AnimatePresence>
        {confirmReset && (
          <Sheet onClose={() => setConfirmReset(false)}>
            <div className="space-y-3 text-center">
              <p className="font-display text-base font-bold text-[#101927]">
                ¿Reiniciar tu plan?
              </p>
              <p className="text-[12px] text-[#101927]/65">
                Vas a perder los valores, metas, actividades y agenda guardados.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="rounded-full bg-white py-3 text-[12px] font-semibold text-[#101927]/70 shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { reset(); setConfirmReset(false); }}
                  className="rounded-full bg-red-600 py-3 text-[12px] font-semibold text-white"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}
