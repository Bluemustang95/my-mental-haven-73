import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ClipboardList, FileText, NotebookPen, Pill, ChevronRight, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { IOSToggle } from "@/components/ui/IOSToggle";
import { SymptomsTestModal } from "@/components/modals/SymptomsTestModal";
import { WellbeingCard } from "@/components/proceso/WellbeingCard";

const dayLabels = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

export default function MiProceso() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bars, setBars] = useState<number[]>([35, 50, 28, 65, 72, 60, 80]);
  const [inTherapy, setInTherapy] = useState(false);
  const [openTest, setOpenTest] = useState<null | "symptom" | "personality">(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("in_therapy")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setInTherapy(!!data?.in_therapy));
  }, [user]);

  const updateTherapy = async (v: boolean) => {
    setInTherapy(v);
    if (!user) return;
    await supabase
      .from("patient_app_profiles")
      .upsert({ user_id: user.id, in_therapy: v }, { onConflict: "user_id" });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] pb-32 safe-area-top">
      <div className="mx-auto max-w-md px-5 pt-12">
        {/* Header */}
        <h1 className="font-serif text-4xl font-bold text-[#101927]">Mi Proceso</h1>
        <p className="mt-1 font-serif italic text-base text-muted-foreground">
          Tu evolución, paso a paso.
        </p>

        {/* Estadísticas */}
        <p className="mt-8 mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Activity size={14} /> Estadísticas de impacto
        </p>

        <WellbeingCard />

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-[0_2px_18px_-6px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-[#101927]">Calidad de Sueño</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Uso de estrategias nocturnas</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
              ↗ +12%
            </span>
          </div>
          <div className="flex h-32 items-end justify-between gap-2">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 80 }}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-200 to-indigo-400"
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {dayLabels.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <MiniBar label="Habilidades vs Síntomas" pct={66} status="Buen uso" color="#F97316" />
          <MiniBar label="Actividades vs Síntomas" pct={45} status="Regular" color="#3B82F6" />
        </div>

        {/* Evaluaciones */}
        <p className="mt-8 mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <ClipboardList size={14} /> Evaluaciones
        </p>

        <button
          onClick={() => setOpenTest("symptom")}
          className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-[0_2px_18px_-6px_rgba(15,23,42,0.06)] transition active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
            <Activity size={22} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="font-display text-base font-bold text-[#101927]">Test de Síntomas</p>
            <p className="text-xs text-muted-foreground">Completa tu evaluación semanal</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>

        <button
          onClick={() => setOpenTest("personality")}
          className="mt-3 flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-[0_2px_18px_-6px_rgba(15,23,42,0.06)] transition active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
            <Brain size={22} className="text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="font-display text-base font-bold text-[#101927]">Test de Personalidad</p>
            <p className="text-xs text-muted-foreground">Conócete a mayor profundidad</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>

        {/* Terapia */}
        <div className="my-8 h-px bg-black/[0.08]" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#101927]">Terapia y Seguimiento</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Conecta tu app con tu psicólogo/a</p>
          </div>
          <IOSToggle checked={inTherapy} onChange={updateTherapy} label="En terapia" />
        </div>

        {inTherapy ? (
          <div className="mt-4 space-y-3">
            <TherapyRow
              icon={<NotebookPen size={20} className="text-violet-600" />}
              bg="bg-violet-100"
              title="Notas para terapia"
              sub="Temas y preguntas para tu sesión"
              onClick={() => navigate("/mi-proceso/terapia")}
            />
            <TherapyRow
              icon={<FileText size={20} className="text-orange-500" />}
              bg="bg-orange-100"
              title="Resumen para mi Psico"
              sub="Reporte semanal de recursos, sueño, alimentación y registros."
              onClick={() => navigate("/mi-proceso/resumen")}
            />
            <TherapyRow
              icon={<Pill size={20} className="text-teal-600" />}
              bg="bg-teal-100"
              title="Medicación"
              sub="Registro y toma de fármacos"
              onClick={() => navigate("/mi-proceso/medicacion")}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border-2 border-dashed border-muted-foreground/30 bg-white/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Activá el seguimiento si estás en terapia para ver notas, resúmenes y medicación.
            </p>
          </div>
        )}
      </div>

      <SymptomsTestModal
        open={!!openTest}
        kind={openTest ?? "symptom"}
        onClose={() => setOpenTest(null)}
      />
    </div>
  );
}

function MiniBar({ label, pct, status, color }: { label: string; pct: number; status: string; color: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-[0_2px_18px_-6px_rgba(15,23,42,0.06)]">
      <p className="font-display text-sm font-bold leading-tight text-[#101927]">{label}</p>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <p className="mt-2 text-xs font-bold" style={{ color }}>{status}</p>
    </div>
  );
}

function TherapyRow({
  icon,
  bg,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-3xl bg-white p-4 text-left shadow-[0_2px_18px_-6px_rgba(15,23,42,0.06)] transition active:scale-[0.99]"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-display text-base font-bold text-[#101927]">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
    </button>
  );
}
