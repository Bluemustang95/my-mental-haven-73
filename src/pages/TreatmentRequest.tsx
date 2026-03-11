import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function TreatmentRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    age: "",
    phone: "",
    email: user?.email || "",
    reason: "",
    modality: "",
    insurance: "",
    zone: "",
  });

  const update = (key: string, val: string) => setForm({ ...form, [key]: val });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("patients_intake").insert({
      user_id: user.id,
      first_name: form.first_name,
      last_name: form.last_name,
      age: form.age ? parseInt(form.age) : null,
      phone: form.phone || null,
      email: form.email,
      reason: form.reason || null,
      modality: form.modality || null,
      insurance: form.insurance || null,
      zone: form.zone || null,
    });

    if (!error) setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 safe-area-top">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <span className="text-2xl text-success">✓</span>
          </div>
          <h2 className="mb-2 font-display text-lg font-semibold">Solicitud enviada</h2>
          <p className="mb-6 text-sm text-muted-foreground">Nos vamos a comunicar con vos lo antes posible.</p>
          <button onClick={() => navigate("/")} className="rounded-2xl bg-primary px-6 py-2.5 font-display text-sm font-medium text-primary-foreground">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-14 pb-8 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Solicitar tratamiento</h1>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Completá el formulario y un profesional de RESMA se va a comunicar con vos.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-display text-xs text-muted-foreground">Nombre *</label>
            <input
              type="text" required value={form.first_name} onChange={(e) => update("first_name", e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block font-display text-xs text-muted-foreground">Apellido *</label>
            <input
              type="text" required value={form.last_name} onChange={(e) => update("last_name", e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-display text-xs text-muted-foreground">Edad</label>
            <input
              type="number" value={form.age} onChange={(e) => update("age", e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block font-display text-xs text-muted-foreground">Teléfono</label>
            <input
              type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-display text-xs text-muted-foreground">Email *</label>
          <input
            type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-xs text-muted-foreground">Motivo de consulta</label>
          <textarea
            value={form.reason} onChange={(e) => update("reason", e.target.value)}
            placeholder="Contanos brevemente por qué buscás tratamiento..."
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-card py-2.5 px-3 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-xs text-muted-foreground">Modalidad preferida</label>
          <div className="flex gap-2">
            {["Online", "Presencial", "Sin preferencia"].map((opt) => (
              <button
                key={opt} type="button"
                onClick={() => update("modality", opt)}
                className={cn(
                  "flex-1 rounded-xl border py-2 font-display text-xs font-medium transition-all",
                  form.modality === opt ? "border-accent bg-accent/10" : "border-border text-muted-foreground"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block font-display text-xs text-muted-foreground">Obra social (opcional)</label>
          <input
            type="text" value={form.insurance} onChange={(e) => update("insurance", e.target.value)}
            placeholder="Ej: OSDE, Swiss Medical, etc."
            className="w-full rounded-xl border border-border bg-card py-2.5 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-xs text-muted-foreground">Zona (si presencial)</label>
          <input
            type="text" value={form.zone} onChange={(e) => update("zone", e.target.value)}
            placeholder="Ej: CABA, Zona Norte, etc."
            className="w-full rounded-xl border border-border bg-card py-2.5 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-display text-sm font-medium text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar solicitud"}
          {!loading && <ArrowRight size={14} />}
        </button>
      </form>
    </div>
  );
}
