import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, AdminTabs, AdminToggle } from "@/components/admin/ui/AdminPrimitives";
import { Bot, Database, Type } from "lucide-react";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";

type Distortion = { id: string; emoji: string; name: string; description: string; active: boolean };
type EmoRow = { emotion: string; somatic: string };

const DEFAULT_PROMPT = "Eres RESMITA, asistente en TCC. Ayuda al paciente a identificar sus pensamientos automáticos sin juzgar.";
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
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [distortions, setDistortions] = useState<Distortion[]>(DEFAULT_DISTORTIONS);
  const [emos, setEmos] = useState<EmoRow[]>(DEFAULT_EMOS);

  useEffect(() => {
    loadSetting("pensamientos_prompt", { text: DEFAULT_PROMPT }).then((v: any) => setPrompt(v.text || DEFAULT_PROMPT));
    loadSetting<Distortion[]>("pensamientos_distortions", DEFAULT_DISTORTIONS).then(setDistortions);
    loadSetting<EmoRow[]>("pensamientos_emotions", DEFAULT_EMOS).then(setEmos);
  }, []);

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
          <AdminCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={18} className="text-resma-purple" />
              <h2 className="text-base font-semibold text-resma-navy">Prompt del Sistema (RESMITA)</h2>
            </div>
            <textarea
              value={prompt} onChange={(e) => setPrompt(e.target.value)}
              rows={10}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-resma-navy focus:outline-none focus:border-resma-teal focus:bg-white admin-scroll resize-none"
            />
            <div className="flex justify-end mt-4">
              <AdminButton onClick={async () => { await saveSetting("pensamientos_prompt", { text: prompt }); toast.success("Instrucciones guardadas"); }}>
                Guardar Instrucciones
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
