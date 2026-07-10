import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ArrowRight, Envelope, GoogleLogo, Fingerprint } from "@phosphor-icons/react";
import { isBiometricEnabled, isBiometricSupported, verifyBiometric } from "@/lib/biometricAuth";
import { BiometricSetupModal } from "@/components/modals/BiometricSetupModal";

const TEAL = "#7cc2c8";
const INK = "#101927";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get("prefill") || "";
  const fromOnboarding = searchParams.get("fromOnboarding") === "1";
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(
    prefillEmail || fromOnboarding ? "login" : "login"
  );
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [bioReady, setBioReady] = useState(false);
  const [bioPromptUser, setBioPromptUser] = useState<{ id: string; name: string } | null>(null);
  const hasPendingOnboarding = useMemo(
    () => typeof window !== "undefined" && !!sessionStorage.getItem("resma:onboarding_pending"),
    []
  );

  const BIO_PROMPTED_KEY = "resma:bio_prompted";

  const postLoginTarget = () =>
    typeof window !== "undefined" && sessionStorage.getItem("resma:onboarding_pending")
      ? "/onboarding"
      : "/";

  const maybePromptBiometric = async () => {
    const dest = postLoginTarget();
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(display-mode: standalone)").matches ||
        // iOS Safari
        // @ts-ignore
        window.navigator.standalone === true);
    if (!isStandalone) return navigate(dest, { replace: true });
    if (!isBiometricSupported() || isBiometricEnabled()) return navigate(dest, { replace: true });
    if (localStorage.getItem(BIO_PROMPTED_KEY) === "never") return navigate(dest, { replace: true });
    const { data } = await supabase.auth.getUser();
    if (!data.user) return navigate(dest, { replace: true });
    setBioPromptUser({ id: data.user.id, name: data.user.email?.split("@")[0] || "RESMA" });
  };


  useEffect(() => {
    setBioReady(isBiometricSupported() && isBiometricEnabled());
  }, []);

  // Auto-prompt biometric on mount if enabled and a Supabase session already exists
  useEffect(() => {
    (async () => {
      if (!isBiometricSupported() || !isBiometricEnabled()) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const ok = await verifyBiometric();
        if (ok) navigate(postLoginTarget(), { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBiometric = async () => {
    setError("");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setError("Iniciá sesión con tu email una vez para activar el acceso biométrico.");
      return;
    }
    const ok = await verifyBiometric();
    if (ok) navigate(postLoginTarget(), { replace: true });
    else setError("No pudimos verificar tu identidad biométrica.");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage("Te enviamos un email para restablecer tu contraseña.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else if (data.session) await maybePromptBiometric();
      else setMessage("Cuenta creada. Ya podés iniciar sesión.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else await maybePromptBiometric();
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if ("error" in result && result.error) {
      setError(result.error instanceof Error ? result.error.message : "Error con Google");
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 safe-area-top"
      style={{ background: "#FFFFFF", color: INK }}
    >
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full"
        style={{ background: TEAL, opacity: 0.12, filter: "blur(120px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -bottom-48 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full"
        style={{ background: "#facb60", opacity: 0.14, filter: "blur(140px)" }}
      />

      <div className="relative z-10 flex w-full max-w-xs flex-col items-center">
        {/* Monograma R */}
        <div
          className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#101927]/8 bg-white shadow-[0_18px_48px_-18px_rgba(16,25,39,0.18)]"
        >
          <span className="font-mindful text-[28px] leading-none" style={{ color: INK }}>R</span>
        </div>

        <h1 className="mb-2 font-display text-[24px] font-bold" style={{ color: INK }}>
          {mode === "login" ? "Bienvenido/a" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña"}
        </h1>
        <p className="mb-6 text-center text-[13px] font-light text-[#101927]/55">
          {mode === "login"
            ? "Ingresá a tu cuenta RESMA"
            : mode === "signup"
              ? "Empezá a cuidar tu salud mental"
              : "Te enviaremos un link por email"}
        </p>

        {(fromOnboarding || hasPendingOnboarding) && mode === "login" && (
          <div
            className="mb-6 w-full rounded-2xl border px-4 py-3 text-center text-[12px] font-medium"
            style={{
              borderColor: "rgba(124,194,200,0.35)",
              background: "rgba(124,194,200,0.10)",
              color: INK,
            }}
          >
            Confirmá tu correo y volvé acá para entrar. <br />
            <span className="text-[#101927]/70">Tu plan personalizado te está esperando.</span>
          </div>
        )}


        {mode !== "forgot" && (
          <>
            {bioReady && (
              <button
                onClick={handleBiometric}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 py-3.5 font-display text-[14px] font-bold transition active:scale-[0.98]"
                style={{ color: INK }}
              >
                <Fingerprint size={18} weight="bold" />
                Entrar con Face / Touch ID
              </button>
            )}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-full border border-[#101927]/8 bg-white py-3.5 font-display text-[14px] font-bold text-[#101927] shadow-glass transition active:scale-[0.98] disabled:opacity-50"
            >
              <GoogleLogo size={18} weight="bold" />
              Continuar con Google
            </button>

            <div className="mb-4 flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-[#101927]/8" />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/40">o con email</span>
              <div className="h-px flex-1 bg-[#101927]/8" />
            </div>
          </>
        )}

        <form onSubmit={handleEmailAuth} className="w-full space-y-3">
          <div className="relative">
            <Envelope size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#101927]/35" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-full border border-[#101927]/6 bg-white/80 py-3.5 pl-10 pr-4 text-[14px] font-medium text-[#101927] placeholder:font-light placeholder:text-[#101927]/35 shadow-glass backdrop-blur-xl focus:border-[#7cc2c8]/60 focus:outline-none"
            />
          </div>

          {mode !== "forgot" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              minLength={6}
              className="w-full rounded-full border border-[#101927]/6 bg-white/80 py-3.5 px-5 text-[14px] font-medium text-[#101927] placeholder:font-light placeholder:text-[#101927]/35 shadow-glass backdrop-blur-xl focus:border-[#7cc2c8]/60 focus:outline-none"
            />
          )}

          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-display text-[14px] font-bold transition active:scale-[0.98] disabled:opacity-50"
            style={{
              background: INK,
              color: "#FFFFFF",
              boxShadow: "0 14px 30px -12px rgba(16,25,39,0.35)",
            }}
          >
            {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Enviar link"}
            {!loading && <ArrowRight size={14} weight="bold" />}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          {mode === "login" && (
            <>
              <button
                onClick={() => setMode("forgot")}
                className="block w-full font-display text-[12px] font-medium text-[#101927]/45 hover:text-[#101927]/75"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                className="font-display text-[12px] font-medium text-[#101927]/65 hover:text-[#101927]"
              >
                ¿No tenés cuenta? <span className="font-bold underline" style={{ color: TEAL }}>Crear una</span>
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              className="font-display text-[12px] font-medium text-[#101927]/65 hover:text-[#101927]"
            >
              ¿Ya tenés cuenta? <span className="font-bold underline" style={{ color: TEAL }}>Iniciar sesión</span>
            </button>
          )}
          {mode === "forgot" && (
            <button
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              className="font-display text-[12px] font-medium text-[#101927]/65 hover:text-[#101927]"
            >
              Volver a <span className="font-bold underline" style={{ color: TEAL }}>iniciar sesión</span>
            </button>
          )}
        </div>
      </div>

      <BiometricSetupModal
        open={!!bioPromptUser}
        userId={bioPromptUser?.id ?? ""}
        displayName={bioPromptUser?.name ?? ""}
        onClose={(result) => {
          if (result === "never") localStorage.setItem(BIO_PROMPTED_KEY, "never");
          setBioPromptUser(null);
          navigate(postLoginTarget(), { replace: true });
        }}
      />
    </div>
  );
}
