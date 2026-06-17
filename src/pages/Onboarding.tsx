import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Sparkles, Check, Crown } from "lucide-react";
import { GoogleLogo } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { PaywallModal } from "@/components/modals/PaywallModal";
import {
  OnboardingShell,
  GlassInput,
  GlassSelect,
  GlassChoice,
  GlassPrimaryButton,
  StickyFooter,
} from "@/components/onboarding/OnboardingShell";
import { SplashIntro, ValueSlides } from "@/components/onboarding/IntroScreens";
import { CountryPicker } from "@/components/onboarding/CountryPicker";
import { AlgorithmTransition } from "@/components/onboarding/AlgorithmTransition";
import {
  computePriority,
  saveLocalProfile,
  type SleepQuality,
  type LearningFormat,
} from "@/lib/clinicalAlgorithm";
import { enrollBiometric, isBiometricSupported } from "@/lib/biometricAuth";

const TEAL = "#7cc2c8";
const INK = "#101927";

const BRUJULA = [
  "Hacer las paces con mi almohada",
  "Aprender a soltar el control",
  "Apagar el ruido mental",
  "Reconectar con mi chispa (Alegría)",
  "Construir un refugio interno (Autoestima)",
  "Navegar la tristeza sin ahogarme",
  "Enfocar mi mente dispersa",
  "Despertar mi lado creativo",
];

const MALETA = [
  "Abrazar a mi niño/a interior",
  "Despedirme de un hábito caduco",
  "Pausar y mirarme por dentro",
  "Hacer las paces con la comida",
  'Aprender a decir "no" sin culpa',
  "Perdonarme por el pasado",
];

const SLEEP_OPTIONS: { value: SleepQuality; label: string; hint: string }[] = [
  { value: "reparador", label: "Reparador", hint: "Me levanto descansado/a" },
  { value: "interrumpido", label: "Interrumpido", hint: "Me despierto varias veces" },
  { value: "insomnio", label: "Cuesta dormirme", hint: "Tardo mucho en conciliar" },
  { value: "pesadillas", label: "Pesadillas", hint: "Sueños intensos o angustia" },
];

const FORMAT_OPTIONS: { value: LearningFormat; label: string; hint: string }[] = [
  { value: "lecturas", label: "Lecturas y teoría", hint: "Aprendo leyendo" },
  { value: "audios", label: "Audios y meditaciones", hint: "Prefiero escuchar" },
  { value: "practicas", label: "Ejercicios prácticos", hint: "Aprendo haciendo" },
];

const PENDING_KEY = "resma:onboarding_pending";

type Pending = {
  name: string;
  age: string;
  country: string;
  brujula: string[];
  maleta: string[];
  sleep: SleepQuality | "";
  format: LearningFormat | "";
  priority: string;
  scores: Record<string, number>;
};

async function persistProfile(userId: string, data: Pending) {
  await supabase.from("patient_app_profiles").upsert(
    {
      user_id: userId,
      display_name: data.name,
      life_stage: data.age,
      country: data.country,
      areas_of_interest: data.brujula,
      recent_feelings: data.maleta,
      sleep_quality: data.sleep || null,
      learning_format: data.format || null,
      priority_module: data.priority || null,
      module_scores: data.scores ?? null,
      onboarding_completed: true,
    } as any,
    { onConflict: "user_id" }
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  // -2: splash, -1: value slides, 0..5: wizard, 6: algorithm, 7: account, 8: plan picker
  const [step, setStep] = useState(-2);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [brujula, setBrujula] = useState<string[]>([]);
  const [maleta, setMaleta] = useState<string[]>([]);
  const [sleep, setSleep] = useState<SleepQuality | "">("");
  const [format, setFormat] = useState<LearningFormat | "">("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const ageOptions = useMemo(
    () =>
      Array.from({ length: 78 }, (_, i) => {
        const v = String(i + 13);
        return { value: v, label: v };
      }).concat([{ value: "90+", label: "90+" }]),
    []
  );

  // If user is already authed when they reach onboarding, just save & go home
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (raw) {
      try {
        const pending = JSON.parse(raw) as Pending;
        persistProfile(user.id, pending).finally(() => {
          sessionStorage.removeItem(PENDING_KEY);
          saveLocalProfile({
            priority: pending.priority as any,
            scores: pending.scores as any,
            sleep: pending.sleep,
            format: pending.format,
          });
          setStep(8);
        });
        return;
      } catch {
        sessionStorage.removeItem(PENDING_KEY);
      }
    }
    supabase
      .from("patient_app_profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_completed) navigate("/", { replace: true });
      });
  }, [user, loading, navigate]);

  const toggle = (list: string[], setter: (v: string[]) => void, item: string) =>
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);

  const collectPending = (): Pending => {
    const algo = computePriority({ brujula, maleta, sleep, format });
    return {
      name,
      age,
      country,
      brujula,
      maleta,
      sleep,
      format,
      priority: algo.priority,
      scores: algo.scores,
    };
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError("");
    setAuthMessage("");
    const pending = collectPending();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: pending.name, age: pending.age },
      },
    });
    if (error) {
      setAuthError(error.message);
      setSubmitting(false);
      return;
    }
    if (data.session?.user) {
      await persistProfile(data.session.user.id, pending);
      saveLocalProfile({
        priority: pending.priority as any,
        scores: pending.scores as any,
        sleep: pending.sleep,
        format: pending.format,
      });
      if (isBiometricSupported()) {
        await enrollBiometric(data.session.user.id, pending.name);
      }
      setStep(8);
    } else {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      setAuthMessage("Cuenta creada. Iniciá sesión para entrar.");
    }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setAuthError("");
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(collectPending()));
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/onboarding`,
    });
    if ("error" in result && result.error) {
      setAuthError(result.error instanceof Error ? result.error.message : "Error con Google");
      setSubmitting(false);
    }
  };

  const totalSteps = 6;
  const canNext =
    (step === 0 && name.trim().length > 0 && age.length > 0) ||
    (step === 1 && country.length > 0) ||
    (step === 2 && brujula.length > 0) ||
    (step === 3 && maleta.length > 0) ||
    (step === 4 && sleep.length > 0) ||
    (step === 5 && format.length > 0);

  const wizardStep = step < 0 ? 0 : Math.min(step, 5) + 1;

  return (
    <OnboardingShell
      step={wizardStep}
      totalSteps={step < 0 || step === 6 ? 0 : totalSteps}
      onBack={step > -2 && step !== 6 ? () => setStep((s) => s - 1) : undefined}
    >
      {step === -2 && <SplashIntro onContinue={() => setStep(-1)} />}
      {step === -1 && <ValueSlides onContinue={() => setStep(0)} />}

      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <h1
            className="text-center font-display text-[26px] font-semibold leading-tight"
            style={{ color: INK }}
          >
            Rompiendo el hielo
          </h1>
          <p
            className="mt-2 text-center text-[12.5px]"
            style={{ color: "rgba(16,25,39,0.6)" }}
          >
            Contanos un poco de vos para personalizar tu rincón.
          </p>

          <div className="mt-6 space-y-3">
            <GlassInput
              label="¿Cómo preferís que te llamemos?"
              placeholder="Tu nombre o apodo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <GlassSelect
              label="Tu edad"
              value={age}
              onChange={setAge}
              placeholder="Elegí tu edad"
              options={ageOptions}
            />
          </div>

          <StickyFooter>
            <GlassPrimaryButton disabled={!canNext} onClick={() => setStep(1)}>
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </StickyFooter>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <h1
            className="text-center font-display text-[24px] font-semibold leading-tight"
            style={{ color: INK }}
          >
            ¿Desde dónde nos acompañás?
          </h1>
          <p
            className="mt-2 text-center text-[12.5px]"
            style={{ color: "rgba(16,25,39,0.6)" }}
          >
            Adaptamos el lenguaje y los recursos a tu región.
          </p>
          <div className="mt-5">
            <CountryPicker value={country} onChange={setCountry} />
          </div>
          <StickyFooter>
            <GlassPrimaryButton disabled={!canNext} onClick={() => setStep(2)}>
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </StickyFooter>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <h1
            className="text-center font-display text-[24px] font-semibold leading-tight"
            style={{ color: INK }}
          >
            ¿Qué brújula guía tu viaje?
          </h1>
          <p
            className="mt-2 text-center text-[12.5px]"
            style={{ color: "rgba(16,25,39,0.6)" }}
          >
            Podés elegir más de una.
          </p>
          <div className="mt-4 space-y-2">
            {BRUJULA.map((opt) => (
              <GlassChoice
                key={opt}
                label={opt}
                selected={brujula.includes(opt)}
                onClick={() => toggle(brujula, setBrujula, opt)}
                compact
              />
            ))}
          </div>
          <StickyFooter>
            <GlassPrimaryButton disabled={!canNext} onClick={() => setStep(3)}>
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </StickyFooter>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <h1
            className="text-center font-display text-[24px] font-semibold leading-tight"
            style={{ color: INK }}
          >
            ¿Qué maleta querés aligerar?
          </h1>
          <p
            className="mt-2 text-center text-[12.5px]"
            style={{ color: "rgba(16,25,39,0.6)" }}
          >
            Lo que más pesa hoy en tu mochila.
          </p>
          <div className="mt-4 space-y-2">
            {MALETA.map((opt) => (
              <GlassChoice
                key={opt}
                label={opt}
                selected={maleta.includes(opt)}
                onClick={() => toggle(maleta, setMaleta, opt)}
                compact
              />
            ))}
          </div>
          <StickyFooter>
            <GlassPrimaryButton disabled={!canNext} onClick={() => setStep(4)}>
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </StickyFooter>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-1 flex-col">
          <h1
            className="text-center font-display text-[24px] font-semibold leading-tight"
            style={{ color: INK }}
          >
            ¿Cómo dormís últimamente?
          </h1>
          <p
            className="mt-2 text-center text-[12.5px]"
            style={{ color: "rgba(16,25,39,0.6)" }}
          >
            El sueño marca la base de tu bienestar.
          </p>
          <div className="mt-5 space-y-2.5">
            {SLEEP_OPTIONS.map((o) => {
              const selected = sleep === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSleep(o.value)}
                  className="flex w-full items-center justify-between rounded-2xl border bg-white/75 px-4 py-3 text-left shadow-glass backdrop-blur-xl transition active:scale-[0.99]"
                  style={{
                    borderColor: selected ? TEAL : "rgba(16,25,39,0.06)",
                    color: INK,
                  }}
                >
                  <div>
                    <p className="text-[14px] font-semibold">{o.label}</p>
                    <p className="text-[11.5px]" style={{ color: "rgba(16,25,39,0.55)" }}>
                      {o.hint}
                    </p>
                  </div>
                  <span
                    className="h-4.5 w-4.5 rounded-full border-[1.5px]"
                    style={{
                      width: 18,
                      height: 18,
                      borderColor: selected ? TEAL : "rgba(16,25,39,0.2)",
                      background: selected ? TEAL : "#fff",
                    }}
                  />
                </button>
              );
            })}
          </div>
          <StickyFooter>
            <GlassPrimaryButton disabled={!canNext} onClick={() => setStep(5)}>
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </StickyFooter>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-1 flex-col">
          <h1
            className="text-center font-display text-[24px] font-semibold leading-tight"
            style={{ color: INK }}
          >
            ¿Cómo te gusta aprender?
          </h1>
          <p
            className="mt-2 text-center text-[12.5px]"
            style={{ color: "rgba(16,25,39,0.6)" }}
          >
            Para servirte el contenido en el formato que más resuena con vos.
          </p>
          <div className="mt-5 space-y-2.5">
            {FORMAT_OPTIONS.map((o) => {
              const selected = format === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setFormat(o.value)}
                  className="flex w-full items-center justify-between rounded-2xl border bg-white/75 px-4 py-3 text-left shadow-glass backdrop-blur-xl transition active:scale-[0.99]"
                  style={{
                    borderColor: selected ? TEAL : "rgba(16,25,39,0.06)",
                    color: INK,
                  }}
                >
                  <div>
                    <p className="text-[14px] font-semibold">{o.label}</p>
                    <p className="text-[11.5px]" style={{ color: "rgba(16,25,39,0.55)" }}>
                      {o.hint}
                    </p>
                  </div>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9999,
                      borderWidth: 1.5,
                      borderStyle: "solid",
                      borderColor: selected ? TEAL : "rgba(16,25,39,0.2)",
                      background: selected ? TEAL : "#fff",
                    }}
                  />
                </button>
              );
            })}
          </div>
          <StickyFooter>
            <GlassPrimaryButton disabled={!canNext} onClick={() => setStep(6)}>
              Calcular mi plan <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </StickyFooter>
        </div>
      )}

      {step === 6 && <AlgorithmTransition onDone={() => setStep(7)} />}

      {step === 7 && (
        <div className="flex flex-1 flex-col">
          <h1
            className="text-center font-display text-[28px] font-semibold leading-tight"
            style={{ color: INK }}
          >
            Creá tu rincón
          </h1>
          <p
            className="mt-2 text-center text-[12.5px]"
            style={{ color: "rgba(16,25,39,0.6)" }}
          >
            Guardamos tu plan personalizado para que te espere cada día.
          </p>

          <form onSubmit={handleEmailSignup} className="mt-6 space-y-3">
            <GlassInput
              label="Email"
              type="email"
              required
              placeholder="vos@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <GlassInput
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-[#101927]/55 transition hover:bg-[#101927]/5"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {authError && <p className="text-xs text-rose-500">{authError}</p>}
            {authMessage && <p className="text-xs text-emerald-600">{authMessage}</p>}
            <GlassPrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Creando…" : "Crear mi cuenta"}
            </GlassPrimaryButton>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#101927]/8" />
            <span className="text-[11px] font-medium" style={{ color: "rgba(16,25,39,0.45)" }}>
              o
            </span>
            <div className="h-px flex-1 bg-[#101927]/8" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#101927]/8 bg-white/90 py-3.5 text-[13.5px] font-semibold backdrop-blur-xl transition active:scale-[0.98] disabled:opacity-60"
            style={{ color: INK }}
          >
            <GoogleLogo size={18} weight="bold" />
            Continuar con Google
          </button>

          {isBiometricSupported() && (
            <p className="mt-3 text-center text-[11px]" style={{ color: "rgba(16,25,39,0.5)" }}>
              Después podrás entrar con Face ID / Touch ID.
            </p>
          )}

          <div className="mt-auto pt-6 text-center">
            <button
              onClick={() => navigate("/auth")}
              className="text-xs font-semibold underline underline-offset-4"
              style={{ color: TEAL }}
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
