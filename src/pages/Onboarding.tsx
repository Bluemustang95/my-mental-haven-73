import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { GoogleLogo } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import {
  OnboardingShell,
  GlassInput,
  GlassChoice,
  GlassPrimaryButton,
} from "@/components/onboarding/OnboardingShell";

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

const PAISES = [
  { code: "AR", label: "Argentina", flag: "🇦🇷" },
  { code: "MX", label: "México", flag: "🇲🇽" },
  { code: "ES", label: "España", flag: "🇪🇸" },
  { code: "CO", label: "Colombia", flag: "🇨🇴" },
  { code: "CL", label: "Chile", flag: "🇨🇱" },
  { code: "UY", label: "Uruguay", flag: "🇺🇾" },
  { code: "PE", label: "Perú", flag: "🇵🇪" },
  { code: "OT", label: "Otro", flag: "🌎" },
];

const PENDING_KEY = "resma:onboarding_pending";

type Pending = {
  name: string;
  age: string;
  country: string;
  brujula: string[];
  maleta: string[];
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
      onboarding_completed: true,
    } as any,
    { onConflict: "user_id" }
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [brujula, setBrujula] = useState<string[]>([]);
  const [maleta, setMaleta] = useState<string[]>([]);

  const [authMode, setAuthMode] = useState<"email" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // If user is already authed when they reach onboarding, just save & go home
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    // Flush any pending answers from sessionStorage (post-OAuth)
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (raw) {
      try {
        const pending = JSON.parse(raw) as Pending;
        persistProfile(user.id, pending).finally(() => {
          sessionStorage.removeItem(PENDING_KEY);
          navigate("/", { replace: true });
        });
        return;
      } catch {
        sessionStorage.removeItem(PENDING_KEY);
      }
    }
    // No pending data → check profile completion
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

  const collectPending = (): Pending => ({ name, age, brujula, maleta });

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
        data: {
          display_name: pending.name,
          age: pending.age,
        },
      },
    });
    if (error) {
      setAuthError(error.message);
      setSubmitting(false);
      return;
    }
    // With instant start enabled, a session is returned right away.
    if (data.session?.user) {
      await persistProfile(data.session.user.id, pending);
      navigate("/", { replace: true });
    } else {
      // Fallback for rare delayed-session cases.
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      setAuthMessage("Cuenta creada. Iniciá sesión para entrar y guardar tus respuestas.");
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

  const totalSteps = 4;
  const canNext =
    (step === 0 && name.trim().length > 0 && Number(age) > 0) ||
    (step === 1 && brujula.length > 0) ||
    (step === 2 && maleta.length > 0);

  // ─────────── Splash (step -1 not used; we go straight to step 0) ───────────
  return (
    <OnboardingShell
      step={step + 1}
      totalSteps={totalSteps}
      onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
    >
      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-center font-display text-4xl font-semibold leading-tight">
            Rompiendo el hielo
          </h1>
          <p className="mt-3 text-center text-sm text-white/65">
            Nos encantaría saber un poco más de vos para personalizar este rincón a tu medida.
          </p>

          <div className="mt-10 space-y-4">
            <GlassInput
              label="¿Cómo preferís que te llamemos?"
              placeholder="Tu nombre, apodo o alter ego"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <GlassInput
              label="Un número que represente tu edad"
              type="number"
              placeholder="Años en este planeta"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div className="mt-auto pt-10">
            <GlassPrimaryButton
              disabled={!canNext}
              onClick={() => setStep(1)}
            >
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-center font-display text-3xl font-semibold leading-tight">
            ¿Qué brújula guía tu viaje hoy?
          </h1>
          <div className="mt-8 space-y-3">
            {BRUJULA.map((opt) => (
              <GlassChoice
                key={opt}
                label={opt}
                selected={brujula.includes(opt)}
                onClick={() => toggle(brujula, setBrujula, opt)}
              />
            ))}
          </div>
          <div className="mt-8 pt-2">
            <GlassPrimaryButton
              disabled={!canNext}
              onClick={() => setStep(2)}
            >
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-center font-display text-3xl font-semibold leading-tight">
            ¿Qué maleta te gustaría aligerar?
          </h1>
          <div className="mt-8 space-y-3">
            {MALETA.map((opt) => (
              <GlassChoice
                key={opt}
                label={opt}
                selected={maleta.includes(opt)}
                onClick={() => toggle(maleta, setMaleta, opt)}
              />
            ))}
          </div>
          <div className="mt-8 pt-2">
            <GlassPrimaryButton disabled={!canNext} onClick={() => setStep(3)}>
              Comenzar mi viaje <ArrowRight className="h-4 w-4" />
            </GlassPrimaryButton>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-center font-display text-3xl font-semibold leading-tight">
            Creá tu rincón
          </h1>
          <p className="mt-3 text-center text-sm text-white/65">
            Guardamos tus respuestas para que tu espacio te espere cada día.
          </p>

          {authMode !== "email" && (
            <div className="mt-10 space-y-3">
              <button
                onClick={handleGoogle}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/95 py-4 text-sm font-semibold text-slate-900 transition active:scale-[0.98] disabled:opacity-60"
              >
                <GoogleLogo size={18} weight="bold" />
                Continuar con Google
              </button>
              <button
                onClick={() => setAuthMode("email")}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 py-4 text-sm font-semibold text-white backdrop-blur-md transition active:scale-[0.98]"
              >
                <Mail className="h-4 w-4" />
                Continuar con email
              </button>
            </div>
          )}

          {authMode === "email" && (
            <form onSubmit={handleEmailSignup} className="mt-10 space-y-3">
              <GlassInput
                label="Email"
                type="email"
                required
                placeholder="vos@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <GlassInput
                label="Contraseña"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {authError && <p className="text-xs text-rose-300">{authError}</p>}
              {authMessage && <p className="text-xs text-emerald-300">{authMessage}</p>}
              <GlassPrimaryButton type="submit" disabled={submitting}>
                {submitting ? "Creando…" : "Crear cuenta"}
              </GlassPrimaryButton>
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="block w-full text-center text-xs font-semibold text-white/75 underline underline-offset-4"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setAuthMode(null)}
                className="block w-full text-center text-xs text-white/60"
              >
                Volver a las opciones
              </button>
            </form>
          )}

          <div className="mt-auto pt-8 text-center">
            <button
              onClick={() => navigate("/auth")}
              className="text-xs text-white/55 underline"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
