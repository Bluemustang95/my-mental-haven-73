import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, AdminTabs } from "@/components/admin/ui/AdminPrimitives";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";
import { X, Plus, Bot, Tag, Layout, Lightbulb, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHabitSuggestions, type HabitSuggestion } from "@/hooks/useHabitSuggestions";

type Template = { id: string; name: string; icon: string; color: string };
const DEFAULT_TEMPLATES: Template[] = [
  { id: "water", name: "Hidratarme", icon: "💧", color: "#7cc2c8" },
  { id: "walk", name: "Caminar 15 min", icon: "🚶", color: "#22c55e" },
  { id: "med", name: "Tomar medicación", icon: "💊", color: "#facb60" },
];
const DEFAULT_CATEGORIES = ["Acumular Positivo", "Construir Maestría", "Cuidar el Cuerpo", "Vínculos"];
const DEFAULT_COACH = "Eres el Coach DBT de RESMA. Cuando el paciente falle un hábito, valida sin juzgar y proponé un 1% accionable.";

type TabId = "sug" | "tpl" | "cat" | "coach";

export default function HabitosAdmin() {
  const [tab, setTab] = useState<TabId>("sug");
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [cats, setCats] = useState<string[]>(DEFAULT_CATEGORIES);
  const [coach, setCoach] = useState(DEFAULT_COACH);
  const [newCat, setNewCat] = useState("");

  const { suggestions, refresh } = useHabitSuggestions({ includeInactive: true });
  const [draft, setDraft] = useState<Record<string, Partial<HabitSuggestion>>>({});

  useEffect(() => {
    loadSetting<Template[]>("habits_templates", DEFAULT_TEMPLATES).then(setTemplates);
    loadSetting<string[]>("habits_categories", DEFAULT_CATEGORIES).then(setCats);
    loadSetting<{ text: string }>("habits_coach_prompt", { text: DEFAULT_COACH }).then((v) => setCoach(v.text));
  }, []);

  const patch = (id: string, p: Partial<HabitSuggestion>) => setDraft(d => ({ ...d, [id]: { ...d[id], ...p } }));
  const merged = (s: HabitSuggestion): HabitSuggestion => ({ ...s, ...(draft[s.id] ?? {}) });

  const saveSuggestion = async (s: HabitSuggestion) => {
    const m = merged(s);
    const { error } = await supabase
      .from("habit_suggestions" as never)
      .update({
        category_key: m.category_key, title: m.title, description: m.description,
        icon: m.icon, color: m.color, sort_order: m.sort_order, active: m.active,
      } as never)
      .eq("id", s.id);
    if (error) { toast.error("No se pudo guardar"); return; }
    toast.success("Sugerencia guardada");
    setDraft(d => { const n = { ...d }; delete n[s.id]; return n; });
    refresh();
  };

  const addSuggestion = async () => {
    const { error } = await supabase
      .from("habit_suggestions" as never)
      .insert({ category_key: "salud", title: "Nueva sugerencia", icon: "✨", color: "#7cc2c8" } as never);
    if (error) { toast.error("No se pudo crear"); return; }
    refresh();
  };

  const deleteSuggestion = async (id: string) => {
    if (!confirm("¿Eliminar esta sugerencia?")) return;
    await supabase.from("habit_suggestions" as never).delete().eq("id", id);
    refresh();
  };

  const byCategory = suggestions.reduce<Record<string, HabitSuggestion[]>>((acc, s) => {
    (acc[s.category_key] ||= []).push(s);
    return acc;
  }, {});

  return (
    <>
      <AdminPageHeader title="Gestión de Hábitos" subtitle="DBT · Acumular Afecto Positivo" />
      <div className="px-8 pt-4">
        <AdminTabs<TabId>
          tabs={[
            { id: "sug", label: "Sugerencias", icon: <Lightbulb size={14} /> },
            { id: "tpl", label: "Plantillas Clínicas", icon: <Layout size={14} /> },
            { id: "cat", label: "Categorías DBT", icon: <Tag size={14} /> },
            { id: "coach", label: "Coach IA", icon: <Bot size={14} /> },
          ]}
          value={tab} onChange={setTab}
        />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        {tab === "sug" && (
          <div className="space-y-6">
            <AdminCard className="p-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Sugerencias que verán los usuarios al crear un hábito, agrupadas por categoría.
              </p>
              <AdminButton onClick={addSuggestion}><Plus size={14}/> Nueva sugerencia</AdminButton>
            </AdminCard>
            {Object.keys(byCategory).length === 0 && (
              <AdminCard className="p-6 text-center text-slate-400 text-sm">Sin sugerencias todavía.</AdminCard>
            )}
            {Object.entries(byCategory).map(([cat, items]) => (
              <AdminCard key={cat} className="p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-resma-navy">{cat}</h3>
                <div className="space-y-2">
                  {items.map(raw => {
                    const s = merged(raw);
                    const dirty = !!draft[raw.id];
                    return (
                      <div key={raw.id} className={`flex items-center gap-2 rounded-xl border p-2 ${dirty ? "border-resma-teal bg-resma-teal/5" : "border-slate-200 bg-slate-50"}`}>
                        <input value={s.icon} onChange={(e)=>patch(raw.id,{icon:e.target.value})} maxLength={2}
                          className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-center text-lg"/>
                        <input value={s.title} onChange={(e)=>patch(raw.id,{title:e.target.value})}
                          className="flex-1 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold"/>
                        <input value={s.category_key} onChange={(e)=>patch(raw.id,{category_key:e.target.value})}
                          className="h-10 w-28 rounded-lg border border-slate-200 bg-white px-2 text-xs"/>
                        <input type="color" value={s.color} onChange={(e)=>patch(raw.id,{color:e.target.value})}
                          className="h-10 w-10 rounded-lg cursor-pointer"/>
                        <input type="number" value={s.sort_order} onChange={(e)=>patch(raw.id,{sort_order:Number(e.target.value)||0})}
                          className="h-10 w-14 rounded-lg border border-slate-200 bg-white px-2 text-xs" title="Orden"/>
                        <label className="flex items-center gap-1 text-xs text-slate-500">
                          <input type="checkbox" checked={s.active} onChange={(e)=>patch(raw.id,{active:e.target.checked})}/>
                          Activa
                        </label>
                        {dirty && (
                          <button onClick={()=>saveSuggestion(raw)} className="rounded-lg bg-resma-teal p-2 text-white hover:opacity-90" title="Guardar">
                            <Save size={14}/>
                          </button>
                        )}
                        <button onClick={()=>deleteSuggestion(raw.id)} className="text-rose-400 hover:text-rose-600" title="Eliminar">
                          <X size={14}/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </AdminCard>
            ))}
          </div>
        )}
        {tab === "tpl" && (
          <div className="grid grid-cols-3 gap-3">
            {templates.map((t, i) => (
              <AdminCard key={t.id} className="p-4">
                <div className="flex items-center gap-3">
                  <input value={t.icon} onChange={(e) => { const n = [...templates]; n[i] = { ...t, icon: e.target.value }; setTemplates(n); }}
                         className="h-12 w-12 rounded-xl border border-slate-200 text-2xl text-center bg-slate-50" maxLength={2} />
                  <div className="flex-1 space-y-1.5">
                    <input value={t.name} onChange={(e) => { const n = [...templates]; n[i] = { ...t, name: e.target.value }; setTemplates(n); }}
                           className="w-full h-8 px-2 rounded-lg border border-slate-200 text-sm font-semibold text-resma-navy bg-slate-50 focus:outline-none focus:border-resma-teal focus:bg-white" />
                    <input type="color" value={t.color} onChange={(e) => { const n = [...templates]; n[i] = { ...t, color: e.target.value }; setTemplates(n); }}
                           className="w-full h-7 rounded-lg cursor-pointer" />
                  </div>
                  <button onClick={() => setTemplates(templates.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-600"><X size={14} /></button>
                </div>
              </AdminCard>
            ))}
            <button onClick={() => setTemplates([...templates, { id: `t${Date.now()}`, name: "Nuevo hábito", icon: "✨", color: "#7cc2c8" }])}
                    className="rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-semibold hover:bg-slate-50 hover:text-resma-teal hover:border-resma-teal transition flex items-center justify-center gap-2 min-h-[88px]">
              <Plus size={16} /> Agregar plantilla
            </button>
            <div className="col-span-3 flex justify-end">
              <AdminButton onClick={async () => { await saveSetting("habits_templates", templates); toast.success("Plantillas guardadas"); }}>Guardar Plantillas</AdminButton>
            </div>
          </div>
        )}
        {tab === "cat" && (
          <AdminCard className="p-6">
            <h2 className="text-base font-semibold text-resma-navy mb-4">Categorías / Etiquetas DBT</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {cats.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-resma-teal/10 text-resma-teal text-xs font-semibold">
                  {c}
                  <button onClick={() => setCats(cats.filter((_, j) => j !== i))} className="hover:text-rose-600"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
                     onKeyDown={(e) => { if (e.key === "Enter" && newCat.trim()) { setCats([...cats, newCat.trim()]); setNewCat(""); } }}
                     placeholder="Nueva categoría…"
                     className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-resma-teal focus:bg-white" />
              <AdminButton variant="secondary" onClick={() => { if (newCat.trim()) { setCats([...cats, newCat.trim()]); setNewCat(""); } }}>
                <Plus size={14} /> Agregar
              </AdminButton>
              <AdminButton onClick={async () => { await saveSetting("habits_categories", cats); toast.success("Categorías guardadas"); }}>Guardar</AdminButton>
            </div>
          </AdminCard>
        )}
        {tab === "coach" && (
          <AdminCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={18} className="text-resma-purple" />
              <h2 className="text-base font-semibold text-resma-navy">Prompt del Coach IA</h2>
            </div>
            <textarea value={coach} onChange={(e) => setCoach(e.target.value)} rows={10}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-resma-teal focus:bg-white admin-scroll resize-none" />
            <div className="flex justify-end mt-4">
              <AdminButton variant="purple" onClick={async () => { await saveSetting("habits_coach_prompt", { text: coach }); toast.success("Coach actualizado"); }}>Guardar Coach</AdminButton>
            </div>
          </AdminCard>
        )}
      </div>
    </>
  );
}
