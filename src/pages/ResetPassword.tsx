import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 safe-area-top">
        <p className="mb-4 font-display text-sm font-medium text-success">Contraseña actualizada ✓</p>
        <button onClick={() => navigate("/")} className="rounded-2xl bg-primary px-6 py-2.5 font-display text-sm font-medium text-primary-foreground">
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 safe-area-top">
      <h1 className="mb-2 font-display text-xl font-semibold">Nueva contraseña</h1>
      <p className="mb-6 text-sm text-muted-foreground">Ingresá tu nueva contraseña.</p>
      <form onSubmit={handleReset} className="w-full max-w-xs space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nueva contraseña"
          required
          minLength={6}
          className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-2xl bg-primary py-3 font-display text-sm font-medium text-primary-foreground disabled:opacity-50">
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
