import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, AdminTabs } from "@/components/admin/ui/AdminPrimitives";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";
import { X, Plus, Bot, Tag, Layout } from "lucide-react";

type Template = { id: string; name: string; icon: string; color: string };
const DEFAULT_TEMPLATES: Template[] = [
  { id: "water", name: "Hidratarme", icon: "💧", color: "#7cc2c8" },
  { id: "walk", name: "Caminar 15 min", icon: "🚶", color: "#22c55e" },
  { id: "med", name: "Tomar medicación", icon: "💊", color: "#facb60" },
];
const DEFAULT_CATEGORIES = ["Acumular Positivo", "Construir Maestría", "Cuidar el Cuerpo", "Vínculos"];
const DEFAULT_COACH = "Eres el Coach DBT de RESMA. Cuando el paciente falle un hábito, valida sin juzgar y proponé un 1% accionable.";

export default function HabitosAdmin() {
  const [tab, setTab] = useState<"tpl" | "cat" | "coach">("tpl");
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [cats, setCats] = useState<string[]>(DEFAULT_CATEGORIES);
  const [coach, setCoach] = useState(DEFAULT_COACH);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    loadSetting<Template[]>("habits_templates", DEFAULT_TEMPLATES).then(setTemplates);
    loadSetting<string[]>("habits_categories", DEFAULT_CATEGORIES).then(setCats);
    loadSetting<{ text: string }>("habits_coach_prompt", { text: DEFAULT_COACH }).then((v) => setCoach(v.text));
  }, []);

  return (
    <>
      <AdminPageHeader title="Gestión de Hábitos" subtitle="DBT · Acumular Afecto Positivo" />
      <div className="px-8 pt-4">
        <AdminTabs<"tpl" | "cat" | "coach">
          tabs={[
            { id: "tpl", label: "Plantillas Clínicas", icon: <Layout size={14} /> },
            { id: "cat", label: "Categorías DBT", icon: <Tag size={14} /> },
            { id: "coach", label: "Coach IA", icon: <Bot size={14} /> },
          ]}
          value={tab} onChange={setTab}
        />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
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
