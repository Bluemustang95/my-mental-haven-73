import { useState } from "react";
import { X, ChevronDown, ChevronUp, Plus, Settings, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  EMOJI_ICONS, LINE_ICONS, STREAK_COLORS, DBT_CATEGORIES,
  TIME_SLOTS, FREQUENCY_OPTIONS, CADENCE_OPTIONS,
} from "@/lib/habitsIcons";
import type { HabitInput, HabitCategory, Habit } from "@/hooks/useHabits";
import { useHabitSuggestions } from "@/hooks/useHabitSuggestions";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: HabitInput) => Promise<void>;
  customCategories: HabitCategory[];
  onAddCategory: (label: string) => Promise<string | undefined>;
  existingHabits?: Habit[];
}

export function NewHabitSheet({ open, onClose, onCreate, customCategories, onAddCategory, existingHabits = [] }: Props) {
  const [iconTab, setIconTab] = useState<"emoji" | "line">("emoji");
  const [icon, setIcon] = useState<string>(EMOJI_ICONS[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorIdx, setColorIdx] = useState(0);

  const [expanded, setExpanded] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [frequencyCount, setFrequencyCount] = useState(1);
  const [timeSlot, setTimeSlot] = useState("all");
  const [categoryKey, setCategoryKey] = useState("salud");
  const [cadence, setCadence] = useState("every_day");
  const [reminders, setReminders] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [stackAfter, setStackAfter] = useState<string>("");
  const [newCatInput, setNewCatInput] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { suggestions } = useHabitSuggestions();

  const applySuggestion = (s: typeof suggestions[number]) => {
    setName(s.title);
    if (s.description) setDescription(s.description);
    setIcon(s.icon);
    setIconTab(s.icon_type === "line" ? "line" : "emoji");
    const idx = STREAK_COLORS.findIndex(c => c.color.toLowerCase() === s.color.toLowerCase());
    if (idx >= 0) setColorIdx(idx);
    if (DBT_CATEGORIES.some(c => c.key === s.category_key)) setCategoryKey(s.category_key);
  };

  const allCategories = [
    ...DBT_CATEGORIES,
    ...customCategories.map(c => ({ key: c.key, label: c.label })),
  ];

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Anotá un nombre para el hábito");
      return;
    }
    setSaving(true);
    try {
      const c = STREAK_COLORS[colorIdx];
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        icon_type: iconTab === "line" ? "line" : "emoji",
        color: c.color,
        text_color: c.textColor,
        category_key: categoryKey,
        frequency, frequency_count: frequencyCount,
        time_slot: timeSlot, cadence,
        reminders_enabled: reminders,
        reminder_time: reminders ? reminderTime : null,
        reminder_days: reminders ? reminderDays : [0, 1, 2, 3, 4, 5, 6],
        stack_after_habit_id: stackAfter || null,
      });
      toast.success("Hábito registrado ✓");
      setName(""); setDescription(""); setIcon(EMOJI_ICONS[0]); setColorIdx(0);
      setStackAfter("");
      setExpanded(false);
      onClose();
    } catch {
      toast.error("No pudimos guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const toggleReminders = () => {
    const next = !reminders;
    setReminders(next);
    if (next) toast.info("RESMA solicita permiso para enviarte recordatorios diarios");
  };

  const submitNewCat = async () => {
    const label = (newCatInput ?? "").trim();
    if (!label) { setNewCatInput(null); return; }
    const key = await onAddCategory(label);
    if (key) setCategoryKey(key);
    setNewCatInput(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-[#101927]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[100] mx-auto flex max-h-[88vh] w-full max-w-md flex-col rounded-t-[32px] border border-white/60 bg-white/95 shadow-[0_-20px_50px_-10px_rgba(16,25,39,0.18)] backdrop-blur-[28px]"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
          >
            <div className="shrink-0 px-6 pt-4">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#101927]/15" />
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[22px] font-bold text-[#101927]">Nuevo Hábito</h2>
                <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101927]/5">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+7rem)]">
              {suggestions.length > 0 && (
                <div className="mb-5">
                  <p className="flex items-center gap-1.5 font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">
                    <Lightbulb size={12} /> Sugeridos por Resma
                  </p>
                  <div className="mt-2 -mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
                    {suggestions.slice(0, 12).map(s => (
                      <button
                        key={s.id}
                        onClick={() => applySuggestion(s)}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#101927]/10 bg-white px-3 py-2 text-[12px] font-semibold text-[#101927] hover:border-[#7cc2c8] hover:bg-[#7cc2c8]/10"
                      >
                        <span>{s.icon}</span>
                        <span className="whitespace-nowrap">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Icon tabs */}
              <p className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Iconografía del hábito</p>
              <div className="mt-2 grid grid-cols-2 rounded-full bg-[#101927]/5 p-1">
                {(["emoji", "line"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setIconTab(t); setIcon(t === "emoji" ? EMOJI_ICONS[0] : LINE_ICONS[0].id); }}
                    className={`rounded-full py-2 text-[12.5px] font-bold transition ${iconTab === t ? "bg-white shadow-sm text-[#101927]" : "text-[#101927]/55"}`}
                  >
                    {t === "emoji" ? "Emojis" : "Iconos finos"}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto rounded-2xl border border-[#101927]/10 bg-white p-2">
                {iconTab === "emoji"
                  ? EMOJI_ICONS.map(em => (
                      <button
                        key={em}
                        onClick={() => setIcon(em)}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl transition ${
                          icon === em ? "bg-white shadow-[0_4px_12px_-4px_rgba(16,25,39,0.18)] ring-2 ring-[#7cc2c8]" : "opacity-65"
                        }`}
                      >{em}</button>
                    ))
                  : LINE_ICONS.map(({ id, Icon: Ic }) => (
                      <button
                        key={id}
                        onClick={() => setIcon(id)}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
                          icon === id ? "bg-white shadow-[0_4px_12px_-4px_rgba(16,25,39,0.18)] ring-2 ring-[#7cc2c8]" : "opacity-65"
                        }`}
                      ><Ic size={20} strokeWidth={1.6} /></button>
                    ))
                }
              </div>

              {/* Name + Desc */}
              <p className="mt-5 font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Nombre del hábito</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Tomar agua"
                className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-[#f7f8fa] px-4 py-3 text-sm text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
              />

              <p className="mt-4 font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Descripción (opcional)</p>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Para cuidar mi piel…"
                className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-[#f7f8fa] px-4 py-3 text-sm text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
              />

              {/* Color */}
              <p className="mt-5 font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Color de racha</p>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#101927]/10 bg-[#f7f8fa] p-3">
                {STREAK_COLORS.map((c, i) => (
                  <button
                    key={c.color}
                    onClick={() => setColorIdx(i)}
                    aria-label={c.label}
                    className={`h-9 w-9 rounded-full transition ${colorIdx === i ? "ring-2 ring-[#101927] ring-offset-2" : ""}`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>

              {/* Accordion */}
              <button
                onClick={() => setExpanded(v => !v)}
                className="mt-5 flex w-full items-center justify-between rounded-2xl border border-[#101927]/10 bg-white px-4 py-4 text-left"
              >
                <span className="flex items-center gap-2 font-[Montserrat] text-[12px] font-bold uppercase tracking-[0.14em] text-[#101927]">
                  <Settings size={14} /> Configurar objetivos y frecuencia
                </span>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-5 rounded-2xl border border-[#101927]/10 bg-white p-4">
                      {/* Frecuencia */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.14em] text-[#101927]/55">Frecuencia</p>
                          <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="mt-1.5 w-full appearance-none rounded-xl border border-[#101927]/10 bg-[#f7f8fa] px-3 py-2.5 text-sm font-semibold text-[#101927]"
                          >
                            {FREQUENCY_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.14em] text-[#101927]/55">Cantidad de veces</p>
                          <input
                            type="number" min={1} max={30}
                            value={frequencyCount}
                            onChange={(e) => setFrequencyCount(Math.max(1, Number(e.target.value) || 1))}
                            className="mt-1.5 w-full rounded-xl border border-[#101927]/10 bg-[#f7f8fa] px-3 py-2.5 text-sm font-semibold text-[#101927]"
                          />
                        </div>
                      </div>

                      {/* Horario */}
                      <div>
                        <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.14em] text-[#101927]/55">Horario de registro</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {TIME_SLOTS.map(s => (
                            <button
                              key={s.key}
                              onClick={() => setTimeSlot(s.key)}
                              className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
                                timeSlot === s.key ? "bg-[#101927] text-white" : "bg-[#f7f8fa] text-[#101927]/65"
                              }`}
                            >{s.label}</button>
                          ))}
                        </div>
                      </div>

                      {/* Categoría */}
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.14em] text-[#101927]/55">Categoría DBT</p>
                          <button
                            onClick={() => setNewCatInput("")}
                            className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.14em] text-[#7cc2c8]"
                          >Crear propia</button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {allCategories.map(c => (
                            <button
                              key={c.key}
                              onClick={() => setCategoryKey(c.key)}
                              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                                categoryKey === c.key
                                  ? "border-[#7cc2c8] bg-[#7cc2c8]/20 text-[#3d8a90]"
                                  : "border-[#101927]/10 bg-white text-[#101927]/65"
                              }`}
                            >{c.label}</button>
                          ))}
                        </div>
                        {newCatInput !== null && (
                          <div className="mt-2 flex gap-2">
                            <input
                              autoFocus
                              value={newCatInput}
                              onChange={(e) => setNewCatInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && submitNewCat()}
                              placeholder="Nueva categoría"
                              className="flex-1 rounded-xl border border-[#101927]/10 bg-[#f7f8fa] px-3 py-2 text-sm"
                            />
                            <button onClick={submitNewCat} className="flex items-center justify-center rounded-xl bg-[#101927] px-3 text-white">
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Cadencia */}
                      <div>
                        <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.14em] text-[#101927]/55">Frecuencia de registro</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {CADENCE_OPTIONS.map(c => (
                            <button
                              key={c.key}
                              onClick={() => setCadence(c.key)}
                              className={`rounded-xl py-2 text-[12px] font-bold transition ${
                                cadence === c.key ? "bg-[#101927] text-white" : "bg-[#f7f8fa] text-[#101927]/65"
                              }`}
                            >{c.label}</button>
                          ))}
                        </div>
                      </div>

                      {/* Habit stacking */}
                      {existingHabits.length > 0 && (
                        <div>
                          <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.14em] text-[#101927]/55">
                            Encadenar (opcional)
                          </p>
                          <p className="mt-1 text-[11px] text-[#101927]/50">
                            "Después de X, hacer este hábito" — James Clear
                          </p>
                          <select
                            value={stackAfter}
                            onChange={(e) => setStackAfter(e.target.value)}
                            className="mt-2 w-full appearance-none rounded-xl border border-[#101927]/10 bg-[#f7f8fa] px-3 py-2.5 text-sm font-semibold text-[#101927]"
                          >
                            <option value="">Sin encadenar</option>
                            {existingHabits.map((h) => (
                              <option key={h.id} value={h.id}>Después de: {h.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Reminders toggle + config */}
                      <div className="rounded-xl bg-[#f7f8fa] p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-bold text-[#101927]">Recordatorios diarios</p>
                            <p className="text-[11px] text-[#101927]/55">Notificaciones suaves para no olvidarlo</p>
                          </div>
                          <button
                            onClick={toggleReminders}
                            className={`relative h-7 w-12 rounded-full transition ${reminders ? "bg-[#7cc2c8]" : "bg-[#101927]/15"}`}
                          >
                            <span
                              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
                              style={{ left: reminders ? "22px" : "2px" }}
                            />
                          </button>
                        </div>

                        {reminders && (
                          <div className="mt-3 space-y-3 border-t border-[#101927]/8 pt-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12px] font-semibold text-[#101927]/70">Horario</p>
                              <input
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="rounded-xl border border-[#101927]/10 bg-white px-3 py-1.5 text-sm font-semibold text-[#101927]"
                              />
                            </div>
                            <div>
                              <p className="mb-1.5 text-[12px] font-semibold text-[#101927]/70">Días de la semana</p>
                              <div className="flex gap-1.5">
                                {[
                                  { i: 1, l: "L" }, { i: 2, l: "M" }, { i: 3, l: "M" }, { i: 4, l: "J" },
                                  { i: 5, l: "V" }, { i: 6, l: "S" }, { i: 0, l: "D" },
                                ].map(({ i, l }) => {
                                  const active = reminderDays.includes(i);
                                  return (
                                    <button
                                      key={i}
                                      onClick={() =>
                                        setReminderDays(prev =>
                                          prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort()
                                        )
                                      }
                                      className={`h-9 w-9 rounded-full text-[12px] font-bold transition ${
                                        active ? "bg-[#101927] text-white" : "bg-white text-[#101927]/55 border border-[#101927]/10"
                                      }`}
                                    >{l}</button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={submit}
                disabled={saving}
                className="mt-6 w-full rounded-full bg-[#101927] py-4 font-[Montserrat] text-[12px] font-bold uppercase tracking-[0.18em] text-white disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Registrar hábito"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
