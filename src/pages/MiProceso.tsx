import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, Sparkles,
} from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { PaywallModal } from "@/components/modals/PaywallModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { IOSToggle } from "@/components/ui/IOSToggle";
import { TherapySyncModal } from "@/components/modals/TherapySyncModal";
import { TherapyMiniTracker } from "@/components/proceso/TherapyMiniTracker";
import { SatisfactionSurveySheet } from "@/components/proceso/SatisfactionSurveySheet";
import { useSatisfactionSurveyTrigger } from "@/hooks/useSatisfactionSurveyTrigger";
import { PremiumLock } from "@/components/PremiumLock";
import { WellbeingCardV2 } from "@/components/proceso/WellbeingCardV2";
import { WellbeingAnalysisSheet } from "@/components/proceso/WellbeingAnalysisSheet";
import { PsychometryCarousel } from "@/components/proceso/PsychometryCarousel";
import { BigFiveCard } from "@/components/proceso/BigFiveCard";
import { BigFiveProfileModal } from "@/components/proceso/BigFiveProfileModal";
import { BeckTestRunner } from "@/components/proceso/BeckTestRunner";
import { SymptomsTestModal } from "@/components/modals/SymptomsTestModal";
import { useLocation } from "react-router-dom";
import { loadWellbeing, type WellbeingSnapshot } from "@/lib/wellbeingScore";



type Therapist = {
  name: string | null;
  phone: string | null;
  email: string | null;
  license: string | null;
};

export default function MiProceso() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isPremium, realPlan } = usePlan();
  const [inTherapy, setInTherapy] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [linkedLastName, setLinkedLastName] = useState<string | null>(null);
  const [therapist, setTherapist] = useState<Therapist>({ name: null, phone: null, email: null, license: null });
  const [paywallOpen, setPaywallOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [bigFiveOpen, setBigFiveOpen] = useState(false);
  const [beckOpen, setBeckOpen] = useState(false);
  const [genericTest, setGenericTest] = useState<null | "symptom">(null);

  const [snap, setSnap] = useState<WellbeingSnapshot | null>(null);

  useEffect(() => {
    if (location.hash === "#suscripcion") {
      setTimeout(() => document.getElementById("suscripcion")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("in_therapy, linked_last_name, therapist_name, therapist_phone, therapist_email, therapist_license")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setInTherapy(!!data?.in_therapy);
        setLinkedLastName(data?.linked_last_name ?? null);
        setTherapist({
          name: data?.therapist_name ?? null,
          phone: data?.therapist_phone ?? null,
          email: data?.therapist_email ?? null,
          license: data?.therapist_license ?? null,
        });
      });
    loadWellbeing().then(setSnap);
  }, [user]);

  const updateTherapy = async (v: boolean) => {
    if (v) return setSyncOpen(true);
    setInTherapy(false);
    if (!user) return;
    await supabase
      .from("patient_app_profiles")
      .upsert({ user_id: user.id, in_therapy: false }, { onConflict: "user_id" });
  };

  const handleSynced = (data: { lastName: string }) => {
    setInTherapy(true);
    setLinkedLastName(data.lastName);
  };

  const handleSelectTest = (code: "BDI" | "BAI" | "PSWQ") => {
    if (code === "BDI") setBeckOpen(true);
    else setGenericTest("symptom");
  };

  const therapistInitials = therapist.name
    ? therapist.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "TX";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9fb]">
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-[#7cc2c8]/20 blur-3xl animate-blob-a" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#facb60]/15 blur-3xl animate-blob-b" />

      <div className="relative mx-auto w-full max-w-md flex-1 px-5 pt-7 pb-24">
        <h1 className="font-serif text-[20px] font-medium text-[#0f172a]">Mi Proceso</h1>
        <p className="mt-0.5 text-[12px] italic text-[#64748b]">Tu evolución, paso a paso.</p>

        <p className="mt-5 mb-2.5 flex items-center gap-1.5 font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-[#94a3b8]">
          <Activity size={11} /> Estadísticas de impacto
        </p>

        <PremiumLock featureName="Estadísticas de impacto" variant="section">
          <WellbeingCardV2
            score={snap?.score ?? 0}
            delta={snap?.delta ?? 0}
            message={snap?.message ?? "Cargando tu evolución…"}
            trend={snap?.trend ?? [0,0,0,0,0,0,0]}
            onOpen={() => setSheetOpen(true)}
          />

          <div className="mt-5">
            <PsychometryCarousel onSelect={handleSelectTest} />
          </div>

          <div className="mt-5">
            <BigFiveCard onOpen={() => setBigFiveOpen(true)} />
          </div>

        </PremiumLock>

        <div className="my-6 h-px bg-black/[0.06]" />

        <div className="flex items-center justify-between gap-4">
          <p className="font-[Montserrat] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0f172a]">
            Terapia y sincronización {inTherapy && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />}
          </p>
          <IOSToggle checked={inTherapy} onChange={updateTherapy} label="En terapia" />
        </div>

        {inTherapy ? (
          <div className="mt-3 space-y-2.5">
            <div className="rounded-[20px] border border-white/70 bg-white/85 p-3.5 shadow-[0_8px_24px_-18px_rgba(16,25,39,0.22)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#101927] to-[#0e8a92] font-display text-[13px] font-bold text-white">
                  {therapistInitials}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-[13px] font-bold text-[#0f172a]">
                      {therapist.name ?? "Profesional vinculado"}
                    </p>
                    <BadgeCheck size={13} className="shrink-0 text-[#7cc2c8]" />
                  </div>
                  <p className="text-[10.5px] text-[#64748b]">
                    {therapist.license ? `M.N. ${therapist.license} · ` : ""}Especialista Clínico
                  </p>
                </div>
                {therapist.phone ? (
                  <a
                    href={`tel:${therapist.phone}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101927] text-white"
                    aria-label="Llamar"
                  >
                    <Phone size={14} />
                  </a>
                ) : (
                  <button
                    onClick={() => navigate("/configuracion")}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101927]/10 text-[#101927]/70"
                    aria-label="Agregar contacto"
                  >
                    <UserPlus size={14} />
                  </button>
                )}
              </div>
              {linkedLastName && (
                <p className="mt-2.5 border-t border-[#e2e8f0] pt-2 text-[10.5px] text-[#64748b]">
                  Vinculado a paciente <span className="font-semibold text-[#0f172a]">{linkedLastName}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <BentoCard
                icon={<Mail size={15} className="text-[#0e8a92]" />}
                iconBg="bg-[#7cc2c8]/15"
                title="Soporte RESMA"
                sub="Asistencia técnica y clínica."
                onClick={() => (window.location.href = "mailto:support@resma.com.ar")}
              />
              <BentoCard
                icon={<FileText size={15} className="text-[#b45309]" />}
                iconBg="bg-[#facb60]/20"
                title="Resumen Psico"
                sub="Reportes y hábitos."
                onClick={() => navigate("/mi-proceso/resumen")}
              />
              <BentoCard
                icon={<NotebookPen size={15} className="text-[#7c3aed]" />}
                iconBg="bg-[#7c3aed]/12"
                title="Notas de Sesión"
                sub="Temas y dudas."
                onClick={() => navigate("/mi-proceso/terapia")}
              />
              <BentoCard
                icon={<Pill size={15} className="text-[#0e8a92]" />}
                iconBg="bg-[#7cc2c8]/15"
                title="Medicación"
                sub="Próxima toma: Al día"
                onClick={() => navigate("/mi-proceso/medicacion")}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-[20px] border-2 border-dashed border-[#e2e8f0] bg-white/40 p-5 text-center">
            <p className="text-[12px] leading-relaxed text-[#64748b]">
              Activá el seguimiento si estás en terapia para ver notas, resúmenes y medicación.
            </p>
          </div>
        )}
      </div>


      <WellbeingAnalysisSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <BigFiveProfileModal open={bigFiveOpen} onClose={() => setBigFiveOpen(false)} />
      <BeckTestRunner open={beckOpen} onClose={() => setBeckOpen(false)} />
      <SymptomsTestModal open={!!genericTest} kind={genericTest ?? "symptom"} onClose={() => setGenericTest(null)} />
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} featureName="Premium" />
      <TherapySyncModal open={syncOpen} onClose={() => setSyncOpen(false)} onSynced={handleSynced} />
    </div>
  );
}

function BentoCard({
  icon, iconBg, title, sub, onClick,
}: {
  icon: React.ReactNode; iconBg: string; title: string; sub: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-[18px] border border-white/70 bg-white/80 p-3 text-left shadow-[0_6px_20px_-16px_rgba(16,25,39,0.22)] backdrop-blur-xl"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
      <div>
        <p className="font-display text-[12.5px] font-bold leading-tight text-[#0f172a]">{title}</p>
        <p className="mt-0.5 text-[10.5px] leading-snug text-[#64748b]">{sub}</p>
      </div>
    </motion.button>
  );
}
