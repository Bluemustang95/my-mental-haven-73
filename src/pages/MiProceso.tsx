import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { IOSToggle } from "@/components/ui/IOSToggle";
import { TherapySyncModal } from "@/components/modals/TherapySyncModal";
import { TherapyMiniTracker } from "@/components/proceso/TherapyMiniTracker";
import { SatisfactionSurveySheet } from "@/components/proceso/SatisfactionSurveySheet";
import { useSatisfactionSurveyTrigger } from "@/hooks/useSatisfactionSurveyTrigger";
import { WellbeingCardV2 } from "@/components/proceso/WellbeingCardV2";
import { WellbeingAnalysisSheet } from "@/components/proceso/WellbeingAnalysisSheet";
import { loadWellbeing, type WellbeingSnapshot } from "@/lib/wellbeingScore";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getCountryOverride, subscribeCountryOverride } from "@/lib/countryOverride";





export default function MiProceso() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isPremium, realPlan } = usePlan();
  const [inTherapy, setInTherapy] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [linkedLastName, setLinkedLastName] = useState<string | null>(null);
  const [linkedPhone, setLinkedPhone] = useState<string | null>(null);
  const [bridgeLastState, setBridgeLastState] = useState<string | null>(null);
  const [therapistName, setTherapistName] = useState<string | null>(null);
  const [realCountry, setRealCountry] = useState<string | null>(null);
  const [overrideCountry, setOverrideCountry] = useState<string | null>(getCountryOverride());
  const { isAdmin } = useAdminRole();
  const country = isAdmin && overrideCountry ? overrideCountry : realCountry;
  const [paywallOpen, setPaywallOpen] = useState(false);

  const [surveyOpen, setSurveyOpen] = useState(false);
  const { shouldShow: surveyAvailable, dismiss: dismissSurvey, recheck: recheckSurvey } = useSatisfactionSurveyTrigger();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [bigFiveOpen, setBigFiveOpen] = useState(false);
  
  const [genericTest, setGenericTest] = useState<null | "symptom">(null);
  const [directTestCode, setDirectTestCode] = useState<string | null>(null);

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
      .select("in_therapy, linked_last_name, linked_phone, bridge_last_state, therapist_name, country")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setInTherapy(!!data?.in_therapy);
        setLinkedLastName(data?.linked_last_name ?? null);
        setLinkedPhone(data?.linked_phone ?? null);
        setBridgeLastState(data?.bridge_last_state ?? null);
        setTherapistName(data?.therapist_name ?? null);
        setRealCountry((data?.country ?? "").toUpperCase() || null);
      });
    loadWellbeing().then(setSnap);
  }, [user]);

  useEffect(() => {
    return subscribeCountryOverride(() => setOverrideCountry(getCountryOverride()));
  }, []);

  useEffect(() => {
    const h = () => setSheetOpen(true);
    window.addEventListener("open-wellbeing-sheet", h);
    return () => window.removeEventListener("open-wellbeing-sheet", h);
  }, []);

  const updateTherapy = async (v: boolean) => {
    if (v) return setSyncOpen(true);
    setInTherapy(false);
    setLinkedPhone(null);
    if (!user) return;
    await supabase
      .from("patient_app_profiles")
      .upsert({ user_id: user.id, in_therapy: false }, { onConflict: "user_id" });
  };

  const handleSynced = (data: { lastName: string; phone: string }) => {
    setInTherapy(true);
    setLinkedLastName(data.lastName);
    setLinkedPhone(data.phone);
    setBridgeLastState("searching");
  };

  const handleSelectTest = (code: "BDI" | "BAI" | "PSWQ") => {
    setDirectTestCode(code);
  };


  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9fb]">
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-[#7cc2c8]/20 blur-3xl animate-blob-a" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#facb60]/15 blur-3xl animate-blob-b" />

      <div className="relative mx-auto w-full max-w-md flex-1 px-5 pt-4 pb-24">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-serif text-[17px] font-medium leading-tight text-[#0f172a]">Mi Proceso</h1>
          <p className="text-[11px] italic text-[#64748b]">Tu evolución, paso a paso.</p>
        </div>
        {isAdmin && overrideCountry && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
            👁 Vista admin · país simulado: {overrideCountry}
          </div>
        )}

        <PremiumLock featureName="Estadísticas de impacto" variant="section">
          <div className="mt-3">
            <WellbeingCardV2
              score={snap?.score ?? 0}
              delta={snap?.delta ?? 0}
              message={snap?.message ?? "Cargando tu evolución…"}
              trend={snap?.trend ?? [0,0,0,0,0,0,0]}
              onOpen={() => setSheetOpen(true)}
            />
          </div>

          <div className="mt-5">
            <PsychometryCarousel onSelect={handleSelectTest} />
          </div>

          <div className="mt-5">
            <BigFiveCard onOpen={() => setBigFiveOpen(true)} />
          </div>

        </PremiumLock>

        <div className="my-6 h-px bg-black/[0.06]" />


        {(!country || country === "AR") ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="font-[Montserrat] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0f172a]">
                Terapia y sincronización {inTherapy && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />}
              </p>
              <IOSToggle checked={inTherapy} onChange={updateTherapy} label="En terapia" />
            </div>

            {surveyAvailable && (
              <button
                onClick={() => setSurveyOpen(true)}
                className="mt-3 flex w-full items-center justify-between gap-3 rounded-[18px] border border-[#facb60]/40 bg-[#facb60]/15 px-4 py-3 text-left transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#b45309]" />
                  <div>
                    <p className="font-display text-[12.5px] font-bold text-[#0f172a]">Contanos cómo fue tu experiencia</p>
                    <p className="text-[10.5px] text-[#64748b]">2 minutos · ayuda a otros pacientes</p>
                  </div>
                </div>
                <span className="text-[18px] text-[#b45309]">→</span>
              </button>
            )}

            {inTherapy && linkedPhone ? (
              <div className="mt-3">
                <TherapyMiniTracker
                  phone={linkedPhone}
                  initialState={(bridgeLastState as any) ?? "searching"}
                  initialProName={therapistName}
                  linkedLastName={linkedLastName}
                />
              </div>
            ) : inTherapy ? (
              <div className="mt-3 rounded-[20px] border border-white/70 bg-white/85 p-4 text-center text-[12px] text-[#64748b]">
                Sincronizando…
              </div>
            ) : (
              <div className="mt-3 rounded-[20px] border-2 border-dashed border-[#e2e8f0] bg-white/40 p-5 text-center">
                <p className="text-[12px] leading-relaxed text-[#64748b]">
                  Activá el seguimiento si estás en terapia para ver notas, resúmenes y medicación.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[20px] border border-white/70 bg-white/70 p-5 text-center backdrop-blur-xl">
            <p className="font-display text-[13px] font-semibold text-[#0f172a]">Terapia y derivación</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#64748b]">
              Por ahora la red de profesionales y el seguimiento de tratamiento están disponibles solo para Argentina.
              Estamos trabajando para sumar tu país pronto.
            </p>
          </div>
        )}
      </div>


      <WellbeingAnalysisSheet open={sheetOpen} onClose={() => setSheetOpen(false)} snapshot={snap} />
      <BigFiveProfileModal open={bigFiveOpen} onClose={() => setBigFiveOpen(false)} />
      
      <SymptomsTestModal open={!!genericTest} kind={genericTest ?? "symptom"} onClose={() => setGenericTest(null)} />
      {directTestCode && <TestRunner testCode={directTestCode} onClose={() => setDirectTestCode(null)} />}
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} featureName="Premium" />
      <TherapySyncModal open={syncOpen} onClose={() => setSyncOpen(false)} onSynced={handleSynced} />
      <SatisfactionSurveySheet
        open={surveyOpen}
        onClose={() => { setSurveyOpen(false); recheckSurvey(); }}
        onCompleted={() => { dismissSurvey(); }}
        onDismiss={() => { dismissSurvey(); }}
      />
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
