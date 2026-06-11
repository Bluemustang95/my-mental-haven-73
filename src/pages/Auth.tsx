import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ArrowRight, Envelope, GoogleLogo } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 safe-area-top">
      {/* Logo */}
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
        <span className="font-display text-2xl font-bold text-accent-foreground">R</span>
      </div>

      <h1 className="mb-2 font-display text-xl font-semibold">
        {mode === "login" ? "Bienvenido/a" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña"}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {mode === "login" ? "Ingresá a tu cuenta RESMA" : mode === "signup" ? "Empezá a cuidar tu salud mental" : "Te enviaremos un link por email"}
      </p>

      {/* Google */}
      {mode !== "forgot" && (
        <>
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mb-4 flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl border border-border bg-card py-3 font-display text-sm font-medium transition-all active:scale-[0.98]"
          >
            <GoogleLogo size={18} weight="bold" />
            Continuar con Google
          </button>

          <div className="mb-4 flex w-full max-w-xs items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">o con email</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      {/* Email form */}
      <form onSubmit={handleEmailAuth} className="w-full max-w-xs space-y-3">
        <div className="relative">
          <Envelope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
            className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        {message && <p className="text-xs text-success">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-display text-sm font-medium text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Enviar link"}
          {!loading && <ArrowRight size={14} />}
        </button>
      </form>

      {/* Mode switchers */}
      <div className="mt-6 space-y-2 text-center">
        {mode === "login" && (
          <>
            <button onClick={() => setMode("forgot")} className="block w-full font-display text-xs text-muted-foreground">
              ¿Olvidaste tu contraseña?
            </button>
            <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className="font-display text-xs text-accent-foreground">
              ¿No tenés cuenta? <span className="underline">Crear una</span>
            </button>
          </>
        )}
        {mode === "signup" && (
          <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="font-display text-xs text-accent-foreground">
            ¿Ya tenés cuenta? <span className="underline">Iniciar sesión</span>
          </button>
        )}
        {mode === "forgot" && (
          <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="font-display text-xs text-accent-foreground">
            Volver a <span className="underline">iniciar sesión</span>
          </button>
        )}
      </div>
    </div>
  );
}
