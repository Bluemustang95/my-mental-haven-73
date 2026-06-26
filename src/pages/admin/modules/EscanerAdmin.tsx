import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, AdminTabs } from "@/components/admin/ui/AdminPrimitives";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";
import { Folder, Palette } from "lucide-react";

type Node = { id: string; name: string; script: string };
type Colors = { tension: string; relaxation: string };
const DEFAULT_NODES: Node[] = [
  { id: "head", name: "Cabeza y frente", script: "Llevá la atención a tu frente. Notá si hay tensión…" },
  { id: "neck", name: "Cuello y mandíbula", script: "Soltá la lengua del paladar. Aflojá la mandíbula…" },
  { id: "chest", name: "Pecho y corazón", script: "Sentí el latido. Permití que el aire abra el pecho…" },
  { id: "belly", name: "Abdomen", script: "Apoyá una mano en el vientre. Observá la respiración baja…" },
  { id: "legs", name: "Piernas y pies", script: "Recorré la temperatura desde la cadera hasta los pies…" },
];
const DEFAULT_COLORS: Colors = { tension: "#dc2626", relaxation: "#7cc2c8" };

export default function EscanerAdmin() {
  const [tab, setTab] = useState<"nodos" | "color">("nodos");
  const [nodes, setNodes] = useState<Node[]>(DEFAULT_NODES);
  const [activeId, setActiveId] = useState("head");
  const [colors, setColors] = useState<Colors>(DEFAULT_COLORS);
  const current = nodes.find((n) => n.id === activeId) ?? nodes[0];

  useEffect(() => {
    loadSetting<Node[]>("bodyscan_nodes", DEFAULT_NODES).then(setNodes);
    loadSetting<Colors>("bodyscan_colors", DEFAULT_COLORS).then(setColors);
  }, []);

  return (
    <>
      <AdminPageHeader title="Escáner Corporal" subtitle="Nodos somáticos y cromoterapia" />
      <div className="px-8 pt-4">
        <AdminTabs<"nodos" | "color">
          tabs={[{ id: "nodos", label: "Nodos Somáticos", icon: <Folder size={14} /> }, { id: "color", label: "Cromoterapia", icon: <Palette size={14} /> }]}
          value={tab} onChange={setTab}
        />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        {tab === "nodos" && (
          <div className="grid grid-cols-[280px_1fr] gap-5">
            <AdminCard className="p-3 h-fit">
              <div className="font-admin-label text-[10px] text-slate-500 px-2 py-2">Nodos</div>
              {nodes.map((n) => {
                const active = n.id === activeId;
                return (
                  <button key={n.id} onClick={() => setActiveId(n.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                            active ? "bg-resma-teal/10 text-resma-teal font-semibold" : "text-slate-600 hover:bg-slate-50"
                          }`}>
                    <Folder size={14} />{n.name}
                  </button>
                );
              })}
            </AdminCard>
            <AdminCard className="p-6">
              <h2 className="text-base font-semibold text-resma-navy mb-4">{current.name}</h2>
              <textarea
                value={current.script}
                onChange={(e) => setNodes(nodes.map((n) => n.id === activeId ? { ...n, script: e.target.value } : n))}
                rows={16}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-resma-navy font-serifElegant focus:outline-none focus:border-resma-teal focus:bg-white admin-scroll resize-none"
              />
              <div className="flex justify-end mt-4">
                <AdminButton onClick={async () => { await saveSetting("bodyscan_nodes", nodes); toast.success("Nodo guardado"); }}>
                  Guardar
                </AdminButton>
              </div>
            </AdminCard>
          </div>
        )}
        {tab === "color" && (
          <AdminCard className="p-6">
            <h2 className="text-base font-semibold text-resma-navy mb-5">Paleta de Cromoterapia</h2>
            <div className="grid grid-cols-2 gap-4">
              <ColorPick label="Color de Tensión" value={colors.tension} onChange={(v) => setColors({ ...colors, tension: v })} />
              <ColorPick label="Color de Relajación" value={colors.relaxation} onChange={(v) => setColors({ ...colors, relaxation: v })} />
            </div>
            <div className="mt-6 h-16 rounded-2xl" style={{ background: `linear-gradient(90deg, ${colors.tension}, ${colors.relaxation})` }} />
            <div className="flex justify-end mt-4">
              <AdminButton onClick={async () => { await saveSetting("bodyscan_colors", colors); toast.success("Paleta guardada"); }}>
                Guardar Paleta
              </AdminButton>
            </div>
          </AdminCard>
        )}
      </div>
    </>
  );
}

function ColorPick({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
      <div className="font-admin-label text-[10px] text-slate-500">{label}</div>
      <div className="flex items-center gap-3 mt-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-16 rounded-lg cursor-pointer border border-slate-200" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-mono" />
      </div>
    </div>
  );
}
