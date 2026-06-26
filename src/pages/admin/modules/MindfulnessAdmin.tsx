import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui/AdminPrimitives";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";
import { Folder, FileAudio, Volume2 } from "lucide-react";

type Script = { id: string; name: string; minutes: number; script: string };
const DEFAULT: Script[] = [
  { id: "478", name: "4-7-8 (Sueño)", minutes: 5, script: "Inhalá durante cuatro segundos por la nariz…\nSostené el aire siete segundos…\nExhalá ocho segundos por la boca con sonido de hojas secas…" },
  { id: "sigh", name: "Suspiro fisiológico", minutes: 3, script: "Doble inhalación por la nariz, exhalación larga por la boca…" },
  { id: "box", name: "Respiración cuadrada", minutes: 5, script: "Inhalá cuatro, sostené cuatro, exhalá cuatro, pausa cuatro…" },
  { id: "coh", name: "Coherencia cardíaca", minutes: 5, script: "Inhalá cinco segundos, exhalá cinco segundos. Sintonizá el ritmo del corazón…" },
];

export default function MindfulnessAdmin() {
  const [scripts, setScripts] = useState<Script[]>(DEFAULT);
  const [activeId, setActiveId] = useState("478");
  const current = scripts.find((s) => s.id === activeId) ?? scripts[0];

  useEffect(() => { loadSetting<Script[]>("mindfulness_scripts", DEFAULT).then(setScripts); }, []);

  const update = (patch: Partial<Script>) => {
    setScripts(scripts.map((s) => (s.id === activeId ? { ...s, ...patch } : s)));
  };

  return (
    <>
      <AdminPageHeader title="Mindfulness & Respiración" subtitle="Guiones para ElevenLabs" />
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        <div className="grid grid-cols-[280px_1fr] gap-5">
          <AdminCard className="p-3 h-fit">
            <div className="font-admin-label text-[10px] text-slate-500 px-2 py-2">Ejercicios</div>
            <div className="space-y-0.5">
              {scripts.map((s) => {
                const active = s.id === activeId;
                return (
                  <button key={s.id} onClick={() => setActiveId(s.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                            active ? "bg-resma-teal/10 text-resma-teal font-semibold" : "text-slate-600 hover:bg-slate-50"
                          }`}>
                    <Folder size={14} />
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.minutes}m</span>
                  </button>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileAudio size={18} className="text-resma-purple" />
                <h2 className="text-base font-semibold text-resma-navy">{current.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="font-admin-label text-[10px] text-slate-500">Minutos</label>
                <input type="number" min={1} max={60} value={current.minutes}
                       onChange={(e) => update({ minutes: Math.max(1, parseInt(e.target.value || "1", 10)) })}
                       className="w-16 h-9 px-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-center" />
              </div>
            </div>

            <textarea
              value={current.script} onChange={(e) => update({ script: e.target.value })}
              rows={18}
              placeholder="Redactá aquí el guion que leerá ElevenLabs…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-resma-navy font-serifElegant focus:outline-none focus:border-resma-teal focus:bg-white admin-scroll resize-none"
            />

            <div className="flex justify-end gap-2 mt-4">
              <AdminButton variant="secondary" onClick={() => toast.info("Reproducción de voz disponible al integrar ElevenLabs TTS")}>
                <Volume2 size={14} /> Probar Voz
              </AdminButton>
              <AdminButton variant="purple" onClick={async () => { await saveSetting("mindfulness_scripts", scripts); toast.success("Guion guardado"); }}>
                Guardar Guion
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
