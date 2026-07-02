import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, AdminTabs, AdminToggle } from "@/components/admin/ui/AdminPrimitives";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";
import { AlertTriangle, Sliders, ClipboardList, User, ShieldAlert } from "lucide-react";
import { TestsCrudPanel } from "@/components/admin/tests/TestsCrudPanel";

type Weights = { checkin: number; tests: number; habits: number; resources: number };
type Protocol = { id: string; name: string; description: string; enabled: boolean };

const DEFAULT_WEIGHTS: Weights = { checkin: 40, tests: 25, habits: 20, resources: 15 };
const DEFAULT_PROTOCOLS: Protocol[] = [
  { id: "sos_call", name: "Llamada SOS automática", description: "Disparar contacto de emergencia al detectar ideación.", enabled: true },
  { id: "grounding", name: "Sesión de Grounding 5-4-3-2-1", description: "Forzar pantalla de grounding ante crisis.", enabled: true },
  { id: "breathing", name: "Respiración 4-7-8 forzada", description: "Abrir el ejercicio anti-pánico inmediatamente.", enabled: false },
  { id: "therapist", name: "Aviso al terapeuta", description: "Enviar notificación al profesional vinculado.", enabled: true },
];

type Tab = "index" | "evaluaciones" | "personalidad" | "risk";

export default function ProgresoAdmin() {
  const [tab, setTab] = useState<Tab>("index");
  const [w, setW] = useState<Weights>(DEFAULT_WEIGHTS);
  const [prot, setProt] = useState<Protocol[]>(DEFAULT_PROTOCOLS);

  useEffect(() => {
    loadSetting<Weights>("wellbeing_weights", DEFAULT_WEIGHTS).then(setW);
    loadSetting<Protocol[]>("risk_protocols", DEFAULT_PROTOCOLS).then(setProt);
  }, []);

  const total = w.checkin + w.tests + w.habits + w.resources;
  const valid = total === 100;

  return (
    <>
      <AdminPageHeader title="Progreso y Psicometría" subtitle="Configuración del Índice de Bienestar, tests y protocolos de riesgo" />
      <div className="px-8 pt-4">
        <AdminTabs<Tab>
          tabs={[
            { id: "index", label: "Índice de Bienestar", icon: <Sliders size={14} /> },
            { id: "evaluaciones", label: "Evaluaciones y Psicometría", icon: <ClipboardList size={14} /> },
            { id: "personalidad", label: "Personalidad", icon: <User size={14} /> },
            { id: "risk", label: "Protocolos de Riesgo", icon: <ShieldAlert size={14} /> },
          ]}
          value={tab} onChange={setTab}
        />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        {tab === "index" && (
          <AdminCard className="p-6">
            <h2 className="text-base font-semibold text-resma-navy mb-1">Ponderación matemática del Índice</h2>
            <p className="text-xs text-slate-500 mb-6">Los pesos deben sumar exactamente 100%.</p>

            <div className="space-y-5">
              <Slider label="Check-in diario" value={w.checkin} color="#7cc2c8" onChange={(v) => setW({ ...w, checkin: v })} />
              <Slider label="Tests psicométricos" value={w.tests} color="#facb60" onChange={(v) => setW({ ...w, tests: v })} />
              <Slider label="Hábitos" value={w.habits} color="#6366f1" onChange={(v) => setW({ ...w, habits: v })} />
              <Slider label="Recursos usados" value={w.resources} color="#22c55e" onChange={(v) => setW({ ...w, resources: v })} />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="font-admin-label text-[10px] text-slate-500">Total</div>
                <div className={`text-sm font-bold tabular-nums ${valid ? "text-emerald-600" : "text-rose-600"}`}>{total}%</div>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                <div style={{ width: `${w.checkin}%`, background: "#7cc2c8" }} />
                <div style={{ width: `${w.tests}%`, background: "#facb60" }} />
                <div style={{ width: `${w.habits}%`, background: "#6366f1" }} />
                <div style={{ width: `${w.resources}%`, background: "#22c55e" }} />
              </div>
            </div>

            {!valid && (
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2 text-amber-800 text-sm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                Los pesos deben sumar 100% para guardar.
              </div>
            )}

            <div className="flex justify-end mt-5">
              <AdminButton disabled={!valid} onClick={async () => { await saveSetting("wellbeing_weights", w); toast.success("Ponderación guardada"); }}>
                Guardar Ponderación
              </AdminButton>
            </div>
          </AdminCard>
        )}

        {tab === "evaluaciones" && <TestsCrudPanel kind="symptom" />}
        {tab === "personalidad" && <TestsCrudPanel kind="personality" />}

        {tab === "risk" && (
          <div className="space-y-3">
            {prot.map((p, i) => (
              <AdminCard key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-resma-navy text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.description}</div>
                </div>
                <AdminToggle value={p.enabled} onChange={(v) => { const n = [...prot]; n[i] = { ...p, enabled: v }; setProt(n); }} />
              </AdminCard>
            ))}
            <div className="flex justify-end">
              <AdminButton onClick={async () => { await saveSetting("risk_protocols", prot); toast.success("Protocolos actualizados"); }}>Guardar Protocolos</AdminButton>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Slider({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-resma-navy">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))}
             className="w-full" style={{ accentColor: color }} />
    </div>
  );
}
