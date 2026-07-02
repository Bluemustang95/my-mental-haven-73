import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, AdminTabs, AdminToggle } from "@/components/admin/ui/AdminPrimitives";
import { Bot, Database, Type, Plus, Trash2 } from "lucide-react";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";

type Distortion = { id: string; emoji: string; name: string; description: string; active: boolean };
type EmoRow = { emotion: string; somatic: string };
type AiCfg = { prompt: string; model: string; costs: Record<string, string> };

const DEFAULT_PROMPT = `Sos "Reeni", acompañante cognitivo virtual de RESMA en TCC (Beck / Leahy).
Hablás en español rioplatense con voseo, tono empático, breve y socrático. NO reemplazás terapia.
Tenés acceso al REGISTRO del usuario. Léelo antes de responder.
- Si te pide "leé lo que escribí": devolvé un resumen empático de 3 líneas.
- Si te pide "ayudame a completar": generá 2–3 sugerencias adaptadas al paso actual.
- Nombrá distorsiones cuando aparezcan.
- Ante riesgo, sugerí líneas de ayuda.`;

const MODEL_OPTIONS: { id: string; label: string; cost: string }[] = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (default)", cost: "Bajo" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", cost: "Bajo" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", cost: "Alto" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", cost: "Medio" },
  { id: "openai/gpt-5", label: "GPT-5", cost: "Alto" },
];

const DEFAULT_AI: AiCfg = {
  prompt: DEFAULT_PROMPT,
  model: "google/gemini-3-flash-preview",
  costs: Object.fromEntries(MODEL_OPTIONS.map((m) => [m.id, m.cost])),
};

const DEFAULT_DISTORTIONS: Distortion[] = [
  { id: "tn", emoji: "⚫", name: "Todo o nada", description: "Pensamiento dicotómico, sin matices.", active: true },
  { id: "cat", emoji: "🌪", name: "Catastrofismo", description: "Anticipar el peor escenario posible.", active: true },
  { id: "per", emoji: "🪞", name: "Personalización", description: "Atribuirse responsabilidad por lo externo.", active: true },
  { id: "fil", emoji: "🔍", name: "Filtro mental", description: "Foco exclusivo en lo negativo.", active: true },
  { id: "lec", emoji: "🔮", name: "Lectura de mente", description: "Asumir lo que el otro piensa.", active: true },
  { id: "deb", emoji: "📜", name: "Debería", description: "Reglas rígidas sobre uno mismo.", active: true },
];
const DEFAULT_EMOS: EmoRow[] = [
  { emotion: "Ansiedad", somatic: "Pecho, garganta, respiración corta" },
  { emotion: "Tristeza", somatic: "Pesadez en el cuerpo, ojos cargados" },
  { emotion: "Ira", somatic: "Mandíbula tensa, calor facial" },
];

export default function PensamientosAdmin() {
  const [tab, setTab] = useState<"prompt" | "dist" | "emo">("prompt");
  const [ai, setAi] = useState<AiCfg>(DEFAULT_AI);
  const [distortions, setDistortions] = useState<Distortion[]>(DEFAULT_DISTORTIONS);
  const [emos, setEmos] = useState<EmoRow[]>(DEFAULT_EMOS);

  useEffect(() => {
    loadSetting<AiCfg>("pensamientos_ai", DEFAULT_AI).then((v) => setAi({ ...DEFAULT_AI, ...v, costs: { ...DEFAULT_AI.costs, ...(v?.costs ?? {}) } }));
    loadSetting<Distortion[]>("pensamientos_distortions", DEFAULT_DISTORTIONS).then(setDistortions);
    loadSetting<EmoRow[]>("pensamientos_emotions", DEFAULT_EMOS).then(setEmos);
  }, []);

  const addDistortion = () => setDistortions([...distortions, { id: `d${Date.now()}`, emoji: "✨", name: "Nueva distorsión", description: "", active: true }]);
  const removeDistortion = (i: number) => setDistortions(distortions.filter((_, j) => j !== i));

  return (
    <>
      <AdminPageHeader title="Pensamientos Automáticos" subtitle="Configuración del módulo CBT" />
      <div className="px-8 pt-4">
        <AdminTabs<"prompt" | "dist" | "emo">
          tabs={[
            { id: "prompt", label: "Instrucciones IA", icon: <Bot size={14} /> },
            { id: "dist", label: "Distorsiones", icon: <Database size={14} /> },
            { id: "emo", label: "Emociones & Somatización", icon: <Type size={14} /> },
          ]}
          value={tab} onChange={setTab}
        />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        {tab === "prompt" && (
          <AdminCard className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-resma-purple" />
              <h2 className="text-base font-semibold text-resma-navy">Prompt del Sistema (Reeni)</h2>
            </div>
            <textarea
              value={ai.prompt} onChange={(e) => setAi({ ...ai, prompt: e.target.value })}
              rows={10}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-resma-navy focus:outline-none focus:border-resma-teal focus:bg-white admin-scroll resize-none"
            />
            <div>
              <label className="text-xs font-semibold text-slate-600">Modelo IA</label>
              <div className="mt-2 grid gap-2">
                {MODEL_OPTIONS.map((m) => (
                  <label key={m.id} className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer ${ai.model === m.id ? "border-resma-teal bg-resma-teal/5" : "border-slate-200"}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" checked={ai.model === m.id} onChange={() => setAi({ ...ai, model: m.id })} />
                      <span className="font-medium text-resma-navy">{m.label}</span>
                    </div>
                    <input
                      value={ai.costs[m.id] ?? ""}
                      onChange={(e) => setAi({ ...ai, costs: { ...ai.costs, [m.id]: e.target.value } })}
                      className="w-24 rounded-md border border-slate-200 px-2 py-1 text-xs text-right"
                      placeholder="Costo"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <AdminButton onClick={async () => { await saveSetting("pensamientos_ai", ai); toast.success("Configuración IA guardada"); }}>
                Guardar
              </AdminButton>
            </div>
          </AdminCard>
        )}
        {tab === "dist" && (
          <div className="grid grid-cols-2 gap-3">
            {distortions.map((d, i) => (
              <AdminCard key={d.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{d.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-resma-navy text-sm">{d.name}</div>
                      <AdminToggle value={d.active} onChange={(v) => {
                        const next = [...distortions]; next[i] = { ...d, active: v }; setDistortions(next);
                      }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{d.description}</p>
                  </div>
                </div>
              </AdminCard>
            ))}
            <div className="col-span-2 flex justify-end">
              <AdminButton onClick={async () => { await saveSetting("pensamientos_distortions", distortions); toast.success("Distorsiones actualizadas"); }}>
                Guardar Distorsiones
              </AdminButton>
            </div>
          </div>
        )}
        {tab === "emo" && (
          <AdminCard className="p-6">
            <h2 className="text-base font-semibold text-resma-navy mb-4">Matriz Emoción → Somatización</h2>
            <div className="space-y-2">
              {emos.map((row, i) => (
                <div key={i} className="grid grid-cols-[200px_1fr_auto] gap-2 items-center">
                  <input
                    value={row.emotion}
                    onChange={(e) => { const next = [...emos]; next[i] = { ...row, emotion: e.target.value }; setEmos(next); }}
                    className="h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-resma-navy bg-slate-50 focus:outline-none focus:border-resma-teal focus:bg-white"
                  />
                  <input
                    value={row.somatic}
                    onChange={(e) => { const next = [...emos]; next[i] = { ...row, somatic: e.target.value }; setEmos(next); }}
                    className="h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-resma-teal focus:bg-white"
                  />
                  <button onClick={() => setEmos(emos.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-600 text-xs font-semibold">Quitar</button>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <AdminButton variant="secondary" onClick={() => setEmos([...emos, { emotion: "", somatic: "" }])}>+ Agregar fila</AdminButton>
              <AdminButton onClick={async () => { await saveSetting("pensamientos_emotions", emos); toast.success("Matriz guardada"); }}>Guardar matriz</AdminButton>
            </div>
          </AdminCard>
        )}
      </div>
    </>
  );
}
