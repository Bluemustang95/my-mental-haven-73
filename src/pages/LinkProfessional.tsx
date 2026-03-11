import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link as LinkIcon, Check } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function LinkProfessional() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState("");

  const handleLink = async () => {
    if (!code.trim() || !user) return;
    setLoading(true);
    setError("");

    const { error: err } = await supabase
      .from("patient_app_profiles")
      .update({
        linked_professional_code: code.trim(),
        treatment_status: "linked",
      })
      .eq("user_id", user.id);

    if (err) {
      setError("No se pudo vincular. Intentá de nuevo.");
    } else {
      setLinked(true);
    }
    setLoading(false);
  };

  if (linked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 safe-area-top">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Check size={28} className="text-success" weight="bold" />
        </div>
        <h2 className="mb-2 font-display text-lg font-semibold">Vinculación exitosa</h2>
        <p className="mb-6 text-sm text-muted-foreground text-center">Tu profesional podrá ver tu progreso en la plataforma RESMA.</p>
        <button onClick={() => navigate("/perfil")} className="rounded-2xl bg-primary px-6 py-2.5 font-display text-sm font-medium text-primary-foreground">
          Volver al perfil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Vincular profesional</h1>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <LinkIcon size={22} weight="duotone" className="text-secondary-foreground" />
        </div>
        <h2 className="mb-2 font-display text-sm font-medium">¿Cómo funciona?</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tu profesional te dará un código de vinculación desde el portal RESMA. 
          Al ingresarlo acá, tu progreso (check-ins, tests, diario) será visible 
          para tu terapeuta de forma segura.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block font-display text-xs text-muted-foreground uppercase tracking-wider">
            Código de vinculación
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej: RESMA-XXXX-XXXX"
            className="w-full rounded-xl border border-border bg-background py-3 px-4 text-center font-display text-lg tracking-widest placeholder:text-muted-foreground placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}

        <button
          onClick={handleLink}
          disabled={!code.trim() || loading}
          className="w-full rounded-2xl bg-primary py-3 font-display text-sm font-medium text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Vinculando..." : "Vincular"}
        </button>
      </div>
    </div>
  );
}
