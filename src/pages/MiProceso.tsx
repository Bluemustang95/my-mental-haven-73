import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ClipboardList,
  FileText,
  NotebookPen,
  Pill,
  Mail,
  BadgeCheck,
  Sparkles,
  Crown,
  Phone,
} from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { PaywallModal } from "@/components/modals/PaywallModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { IOSToggle } from "@/components/ui/IOSToggle";
import { TherapySyncModal } from "@/components/modals/TherapySyncModal";
import { PremiumLock } from "@/components/PremiumLock";
import { WellbeingCardV2 } from "@/components/proceso/WellbeingCardV2";
import { WellbeingAnalysisSheet } from "@/components/proceso/WellbeingAnalysisSheet";
import { PsychometryCarousel } from "@/components/proceso/PsychometryCarousel";
import { BigFiveCard } from "@/components/proceso/BigFiveCard";
import { BigFiveProfileModal } from "@/components/proceso/BigFiveProfileModal";
import { BeckTestRunner } from "@/components/proceso/BeckTestRunner";
import { SymptomsTestModal } from "@/components/modals/SymptomsTestModal";

const SCORE = 47;
const DELTA = -16;
const TREND = [63, 58, 55, 52, 48, 47, 47];

export default function MiProceso() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isPremium, realPlan } = usePlan();
  const [inTherapy, setInTherapy] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [linkedLastName, setLinkedLastName] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [bigFiveOpen, setBigFiveOpen] = useState(false);
  const [beckOpen, setBeckOpen] = useState(false);
  const [genericTest, setGenericTest] = useState<null | "symptom">(null);

  useEffect(() => {
    if (location.hash === "#suscripcion") {
      setTimeout(() => document.getElementById("suscripcion")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("in_therapy, linked_last_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setInTherapy(!!data?.in_therapy);
        setLinkedLastName(data?.linked_last_name ?? null);
      });
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

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9fb]">
      {/* Orbs */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-[#7cc2c8]/20 blur-3xl animate-blob-a" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#facb60]/15 blur-3xl animate-blob-b" />

      <div className="relative mx-auto w-full max-w-md flex-1 px-5 pt-12 pb-32">
        {/* Header */}
        <h1 className="font-serif text-[26px] font-medium text-[#0f172a]">Mi Proceso</h1>
        <p className="mt-0.5 text-[14px] italic text-[#64748b]">Tu evolución, paso a paso.</p>

        <p className="mt-7 mb-3 flex items-center gap-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.18em] text-[#94a3b8]">
          <Activity size={14} /> Estadísticas de impacto
        </p>

        <PremiumLock featureName="Estadísticas de impacto" variant="section">
          <WellbeingCardV2
            score={SCORE}
            delta={DELTA}
            message="Bajaste 16% vs semana anterior. Empezá de a poco."
            trend={TREND}
            onOpen={() => setSheetOpen(true)}
          />

          {/* Psychometry */}
          <div className="mt-7">
            <PsychometryCarousel onSelect={handleSelectTest} />
          </div>

          {/* Big Five */}
          <div className="mt-7">
            <BigFiveCard onOpen={() => setBigFiveOpen(true)} />
          </div>
        </PremiumLock>

        {/* Terapia */}
        <div className="my-8 h-px bg-black/[0.06]" />

        <div className="flex items-center justify-between gap-4">
          <p className="font-[Montserrat] text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0f172a]">
            Terapia y sincronización <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
          </p>
          <IOSToggle checked={inTherapy} onChange={updateTherapy} label="En terapia" />
        </div>

        {inTherapy ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-[0_10px_30px_-18px_rgba(16,25,39,0.25)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#101927] to-[#0e8a92] font-display text-[15px] font-bold text-white">
                  CP
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display text-[15px] font-bold text-[#0f172a]">Lic. Claudio Pereyra</p>
                    <BadgeCheck size={14} className="text-[#7cc2c8]" />
                  </div>
                  <p className="text-[11px] text-[#64748b]">M.N. 48.293 · Especialista Clínico</p>
                </div>
                <a
                  href="tel:+5491100000000"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101927] text-white"
                >
                  <Phone size={16} />
                </a>
              </div>
              {linkedLastName && (
                <p className="mt-3 border-t border-[#e2e8f0] pt-2.5 text-[11px] text-[#64748b]">
                  Vinculado a paciente <span className="font-semibold text-[#0f172a]">{linkedLastName}</span>
                </p>
              )}
            </div>

            {/* Bento 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <BentoCard
                icon={<Mail size={18} className="text-[#0e8a92]" />}
                iconBg="bg-[#7cc2c8]/15"
                title="Soporte RESMA"
                sub="Asistencia técnica y clínica directa."
                onClick={() => (window.location.href = "mailto:support@resma.com.ar")}
              />
              <BentoCard
                icon={<FileText size={18} className="text-[#b45309]" />}
                iconBg="bg-[#facb60]/20"
                title="Resumen Psico"
                sub="Sincroniza tus reportes y hábitos de la semana."
                onClick={() => navigate("/mi-proceso/resumen")}
              />
              <BentoCard
                icon={<NotebookPen size={18} className="text-[#7c3aed]" />}
                iconBg="bg-[#7c3aed]/12"
                title="Notas de Sesión"
                sub="Apuntá temas y dudas antes de entrar."
                onClick={() => navigate("/mi-proceso/terapia")}
              />
              <BentoCard
                icon={<Pill size={18} className="text-[#0e8a92]" />}
                iconBg="bg-[#7cc2c8]/15"
                title="Medicación"
                sub="Próxima toma: Al día"
                onClick={() => navigate("/mi-proceso/medicacion")}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] border-2 border-dashed border-[#e2e8f0] bg-white/40 p-6 text-center">
            <p className="text-[13px] leading-relaxed text-[#64748b]">
              Activá el seguimiento si estás en terapia para ver notas, resúmenes y medicación.
            </p>
          </div>
        )}

        {/* Subscription */}
        <section id="suscripcion" className="mt-10 scroll-mt-24">
          <h2 className="font-serif text-[22px] font-medium text-[#0f172a]">Tu membresía</h2>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Gestioná tu plan y desbloqueá todo el catálogo cuando quieras.
          </p>

          {isPremium ? (
            <div className="mt-4 rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-white">
                  <Crown size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-display text-[15px] font-bold text-[#0f172a]">Plan Premium activo</p>
                  <p className="text-[12px] text-[#64748b]">
                    {realPlan === "premium" ? "Acceso ilimitado a todos los recursos." : "Acceso completo de admin."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/configuracion")}
                className="mt-4 w-full rounded-2xl border border-[#e2e8f0] bg-white py-3 text-[13px] font-semibold text-[#0f172a]"
              >
                Gestionar suscripción
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-white/60 bg-gradient-to-br from-[#facb60]/20 via-white to-[#7cc2c8]/20 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-white">
                  <Sparkles size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-display text-[15px] font-bold text-[#0f172a]">Estás en el plan Gratuito</p>
                  <p className="text-[12px] text-[#64748b]">Pasate a Premium para desbloquear todo.</p>
                </div>
              </div>
              <button
                onClick={() => setPaywallOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-3.5 text-[13px] font-bold text-white"
              >
                <Sparkles size={16} className="text-amber-300" />
                Hazte Premium — USD 0.99/sem
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modales */}
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
  icon,
  iconBg,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-[20px] border border-white/70 bg-white/80 p-4 text-left shadow-[0_8px_24px_-16px_rgba(16,25,39,0.25)] backdrop-blur-xl"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
      <div>
        <p className="font-display text-[14px] font-bold leading-tight text-[#0f172a]">{title}</p>
        <p className="mt-1 text-[11px] leading-snug text-[#64748b]">{sub}</p>
      </div>
    </motion.button>
  );
}
