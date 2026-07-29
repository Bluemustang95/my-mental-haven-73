import { useEffect, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader, AdminTabs, AdminToggle } from "@/components/admin/ui/AdminPrimitives";
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { toast } from "sonner";
import { Sliders, ClipboardList, User, ShieldAlert, SearchCheck, FlaskConical, Eye, Settings2 } from "lucide-react";
import { TestsCrudPanel } from "@/components/admin/tests/TestsCrudPanel";
import WellbeingSchema from "@/components/admin/wellbeing/WellbeingSchema";
import WellbeingAudit from "@/components/admin/wellbeing/WellbeingAudit";
import WellbeingSeeder from "@/components/admin/wellbeing/WellbeingSeeder";
import WellbeingPreview from "@/components/admin/wellbeing/WellbeingPreview";
import WellbeingConfigPanel from "@/components/admin/wellbeing/WellbeingConfigPanel";

type Protocol = { id: string; name: string; description: string; enabled: boolean };

const DEFAULT_PROTOCOLS: Protocol[] = [
  { id: "sos_call", name: "Llamada SOS automática", description: "Disparar contacto de emergencia al detectar ideación.", enabled: true },
  { id: "grounding", name: "Sesión de Grounding 5-4-3-2-1", description: "Forzar pantalla de grounding ante crisis.", enabled: true },
  { id: "breathing", name: "Respiración 4-7-8 forzada", description: "Abrir el ejercicio anti-pánico inmediatamente.", enabled: false },
  { id: "therapist", name: "Aviso al terapeuta", description: "Enviar notificación al profesional vinculado.", enabled: true },
];

type Tab = "index" | "config" | "vista" | "auditoria" | "prueba" | "evaluaciones" | "personalidad" | "risk";

export default function ProgresoAdmin() {
  const [tab, setTab] = useState<Tab>("index");
  const [prot, setProt] = useState<Protocol[]>(DEFAULT_PROTOCOLS);

  useEffect(() => {
    loadSetting<Protocol[]>("risk_protocols", DEFAULT_PROTOCOLS).then(setProt);
  }, []);

  return (
    <>
      <AdminPageHeader title="Progreso y Psicometría" subtitle="Configuración del Índice de Bienestar, tests y protocolos de riesgo" />
      <div className="px-8 pt-4">
        <AdminTabs<Tab>
          tabs={[
            { id: "index", label: "Índice de Bienestar", icon: <Sliders size={14} /> },
            { id: "config", label: "Configuración del algoritmo", icon: <Settings2 size={14} /> },
            { id: "vista", label: "Ver índice de un paciente", icon: <Eye size={14} /> },
            { id: "auditoria", label: "Auditoría de datos", icon: <SearchCheck size={14} /> },
            { id: "prueba", label: "Datos de prueba", icon: <FlaskConical size={14} /> },
            { id: "evaluaciones", label: "Evaluaciones y Psicometría", icon: <ClipboardList size={14} /> },
            { id: "personalidad", label: "Personalidad", icon: <User size={14} /> },
            { id: "risk", label: "Protocolos de Riesgo", icon: <ShieldAlert size={14} /> },
          ]}
          value={tab} onChange={setTab}
        />
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        {tab === "index" && <WellbeingSchema />}
        {tab === "config" && <WellbeingConfigPanel />}
        {tab === "vista" && <WellbeingPreview />}
        {tab === "auditoria" && <WellbeingAudit />}
        {tab === "prueba" && <WellbeingSeeder />}

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
