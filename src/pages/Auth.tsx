import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ArrowRight, Envelope, GoogleLogo } from "@phosphor-icons/react";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      else if (data.session) navigate("/");
      else setMessage("Cuenta creada. Ya podés iniciar sesión.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigate("/");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError(error instanceof Error ? error.message : "Error con Google");
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-white safe-area-top"
      style={{
        background: "linear-gradient(135deg, #0b2326 0%, #103a3f 50%, #16585f 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full opacity-45"
        style={{ background: "#7cc2c8", filter: "blur(120px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full opacity-35"
        style={{ background: "#a8dde1", filter: "blur(120px)" }}
      />

      <div className="relative z-10 flex w-full max-w-xs flex-col items-center">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/15 bg-white/10 shadow-inner backdrop-blur-xl">
          <span className="font-display text-2xl font-bold text-white">R</span>
        </div>

        <h1 className="mb-2 font-display text-2xl font-bold text-white">
          {mode === "login" ? "Bienvenido/a" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña"}
        </h1>
        <p className="mb-8 text-center text-sm font-medium text-white/60">
          {mode === "login"
            ? "Ingresá a tu cuenta RESMA"
            : mode === "signup"
              ? "Empezá a cuidar tu salud mental"
              : "Te enviaremos un link por email"}
        </p>

        {mode !== "forgot" && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-full bg-white py-3.5 font-display text-sm font-bold text-[#101927] transition active:scale-[0.98] disabled:opacity-50"
            >
              <GoogleLogo size={18} weight="bold" />
              Continuar con Google
            </button>

            <div className="mb-4 flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="font-display text-[10px] uppercase tracking-wider text-white/40">o con email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}

        <form onSubmit={handleEmailAuth} className="w-full space-y-3">
          <div className="relative">
            <Envelope size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-[24px] border border-white/10 bg-[#0b2326]/40 py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 shadow-inner backdrop-blur-xl focus:border-[#7cc2c8]/70 focus:outline-none"
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
              className="w-full rounded-[24px] border border-white/10 bg-[#101927]/40 py-3.5 px-4 text-sm text-white placeholder:text-white/40 shadow-inner backdrop-blur-xl focus:border-[#8b79f2]/60 focus:outline-none"
            />
          )}

          {error && (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-200">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-200">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#8b79f2] py-3.5 font-display text-sm font-bold text-white shadow-violet-glow transition hover:bg-[#9d8df5] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Enviar link"}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          {mode === "login" && (
            <>
              <button
                onClick={() => setMode("forgot")}
                className="block w-full font-display text-xs font-medium text-white/50 hover:text-white/80"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                className="font-display text-xs font-medium text-white/70 hover:text-white"
              >
                ¿No tenés cuenta? <span className="font-bold text-[#b5a7ff] underline">Crear una</span>
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              className="font-display text-xs font-medium text-white/70 hover:text-white"
            >
              ¿Ya tenés cuenta? <span className="font-bold text-[#b5a7ff] underline">Iniciar sesión</span>
            </button>
          )}
          {mode === "forgot" && (
            <button
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              className="font-display text-xs font-medium text-white/70 hover:text-white"
            >
              Volver a <span className="font-bold text-[#b5a7ff] underline">iniciar sesión</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
