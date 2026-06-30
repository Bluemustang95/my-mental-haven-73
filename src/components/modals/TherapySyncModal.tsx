import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ARGENTINA_PROVINCES, getLocalities } from "@/lib/argentinaLocalities";
import { callBridge } from "@/lib/bridgeRetry";

interface TherapySyncModalProps {
  open: boolean;
  onClose: () => void;
  onSynced: (data: { lastName: string; phone: string }) => void;
}

type View = "sync" | "intake";
type Gender = "masculino" | "femenino" | "otro" | "no_responde";
type TreatmentType = "psicologico" | "psiquiatrico" | "psicopedagogico";
type Modality = "Online" | "Presencial";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "otro", label: "Otro" },
  { value: "no_responde", label: "Prefiero no responder" },
];

const TREATMENTS: { value: TreatmentType; label: string }[] = [
  { value: "psicologico", label: "Psicológico" },
  { value: "psiquiatrico", label: "Psiquiátrico" },
  { value: "psicopedagogico", label: "Psicopedagógico" },
];

const E164_REGEX = /^\+\d{8,15}$/;

function normalizePhone(raw: string): string {
  const trimmed = raw.trim().replace(/\s|-/g, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  // assume Argentina if no country code
  const digits = trimmed.replace(/\D/g, "");
  return `+${digits}`;
}

export function TherapySyncModal({ open, onClose, onSynced }: TherapySyncModalProps) {
  const { user } = useAuth();
  const [view, setView] = useState<View>("sync");
  const [submitting, setSubmitting] = useState(false);

  // Sync
  const [syncLastName, setSyncLastName] = useState("");
  const [syncPhone, setSyncPhone] = useState("");

  // Intake wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [phone, setPhone] = useState("+54");
  const [email, setEmail] = useState("");
  const [treatmentType, setTreatmentType] = useState<TreatmentType | "">("");
  const [modality, setModality] = useState<Modality | "">("");
  const [province, setProvince] = useState("");
  const [locality, setLocality] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setView("sync");
    setStep(1);
    setSyncLastName(""); setSyncPhone("");
    setFirstName(""); setLastName(""); setBirthDate(""); setGender("");
    setPhone("+54"); setEmail("");
    setTreatmentType(""); setModality(""); setProvince(""); setLocality("");
    setDescription("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSync = async () => {
    if (!syncLastName.trim() || !syncPhone.trim()) {
      toast.error("Completá apellido y teléfono.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await callBridge("status", {
        phone: normalizePhone(syncPhone),
        last_name: syncLastName.trim(),
      });
      if (!result.ok) throw new Error(result.error ?? "status_failed");

      const data: any = result.data;
      if (user) {
        await supabase.from("patient_app_profiles").upsert(
          {
            user_id: user.id,
            linked_last_name: syncLastName.trim(),
            linked_phone: normalizePhone(syncPhone),
            in_therapy: true,
            bridge_last_state: data?.state ?? "searching",
          },
          { onConflict: "user_id" },
        );
      }

      if (data?.found) {
        toast.success("¡Te encontramos! Mirá el seguimiento.");
        onSynced({ lastName: syncLastName.trim(), phone: normalizePhone(syncPhone) });
        reset(); onClose();
      } else {
        toast.message("No encontramos una derivación con ese teléfono.", {
          description: "Iniciá una solicitud nueva.",
        });
        setPhone(normalizePhone(syncPhone) || "+54");
        setLastName(syncLastName.trim());
        setView("intake");
      }
    } catch {
      toast.error("No pudimos conectar. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const canNextStep1 =
    firstName.trim() && lastName.trim() && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && gender;
  const canNextStep2 = E164_REGEX.test(normalizePhone(phone));
  const canSubmit =
    treatmentType &&
    modality &&
    description.trim().length > 0 &&
    (modality === "Online" || (province && locality));

  const handleIntake = async () => {
    if (!canSubmit) {
      toast.error("Completá los campos requeridos.");
      return;
    }
    setSubmitting(true);
    const normPhone = normalizePhone(phone);
    const payload: Record<string, any> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birth_date: birthDate,
      gender,
      phone: normPhone,
      treatment_type: treatmentType,
      modality,
      consultation_description: description.trim().slice(0, 2000),
      country: "AR",
      consultation_reason: "Psicológica",
    };
    if (email.trim()) payload.email = email.trim();
    if (modality === "Presencial") {
      payload.province = province;
      payload.locality = locality;
    }

    try {
      const result = await callBridge("intake", payload);

      if (result.ok || (result.status === 200 && result.data?.deduplicated)) {
        if (user) {
          await supabase.from("patient_app_profiles").upsert(
            {
              user_id: user.id,
              linked_last_name: lastName.trim(),
              linked_phone: normPhone,
              in_therapy: true,
              bridge_last_state: "searching",
            },
            { onConflict: "user_id" },
          );
        }
        toast.success(
          result.data?.deduplicated
            ? "Ya teníamos tu solicitud registrada."
            : "Solicitud enviada. Estamos buscando un profesional para vos.",
        );
        onSynced({ lastName: lastName.trim(), phone: normPhone });
        reset(); onClose();
        return;
      }

      const errMap: Record<string, string> = {
        missing_name: "Faltan nombre o apellido.",
        invalid_phone: "El teléfono no tiene un formato válido (ej: +5491151627044).",
        country_not_supported: "Por ahora solo Argentina está disponible.",
        invalid_payload: "Hay datos faltantes o inválidos en el formulario.",
        unauthorized: "No pudimos validar la sesión. Volvé a entrar.",
        rate_limited: "Demasiados intentos. Probá en unos segundos.",
      };
      toast.error(errMap[result.error ?? ""] ?? "No pudimos enviar la solicitud.");
    } catch {
      toast.error("No pudimos enviar la solicitud. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const localities = province ? getLocalities(province) : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[32px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_60px_-20px_rgba(16,25,39,0.35)] backdrop-blur-2xl sm:rounded-[32px]"
          >
            <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#7cc2c8]/30 blur-3xl" />

            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-foreground/60 backdrop-blur"
            >
              <X size={18} />
            </button>

            {view === "sync" && (
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-foreground">Conectá con RESMA</h2>
                <p className="mt-1 text-sm text-foreground/65">
                  Te buscamos en el sistema de derivaciones.
                </p>

                <div className="mt-5 space-y-3">
                  <PillInput placeholder="Apellido" value={syncLastName} onChange={setSyncLastName} autoFocus />
                  <PillInput placeholder="Número de teléfono" value={syncPhone} onChange={setSyncPhone} type="tel" />
                </div>

                <button
                  onClick={handleSync}
                  disabled={submitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(16,25,39,0.4)] transition active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <>Verificar <ArrowRight size={18} /></>}
                </button>

                <button
                  onClick={() => setView("intake")}
                  className="mt-5 w-full rounded-2xl border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 px-4 py-4 text-left transition active:scale-[0.99]"
                >
                  <p className="font-display text-sm font-bold text-foreground">
                    ¿Aún no empezaste tratamiento con nosotros?
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#0e8a92]">
                    Empezar acá →
                  </p>
                </button>
              </div>
            )}

            {view === "intake" && (
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Solicitud de admisión
                </h2>
                <p className="mt-1 text-sm text-foreground/65">Paso {step} de 3</p>

                {/* progress */}
                <div className="mt-3 flex gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        s <= step ? "bg-[#0e8a92]" : "bg-foreground/10"
                      }`}
                    />
                  ))}
                </div>

                {step === 1 && (
                  <div className="mt-5 space-y-3">
                    <PillInput placeholder="Nombre" value={firstName} onChange={setFirstName} autoFocus />
                    <PillInput placeholder="Apellido" value={lastName} onChange={setLastName} />
                    <div>
                      <label className="ml-4 text-xs font-semibold text-foreground/55">Fecha de nacimiento</label>
                      <PillInput placeholder="YYYY-MM-DD" value={birthDate} onChange={setBirthDate} type="date" />
                    </div>
                    <div>
                      <p className="ml-1 mb-2 text-xs font-semibold text-foreground/55">Género</p>
                      <div className="grid grid-cols-2 gap-2">
                        {GENDERS.map((g) => (
                          <PillToggle
                            key={g.value}
                            active={gender === g.value}
                            onClick={() => setGender(g.value)}
                            label={g.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-5 space-y-3">
                    <div>
                      <label className="ml-4 text-xs font-semibold text-foreground/55">Teléfono (con código país)</label>
                      <PillInput placeholder="+5491151627044" value={phone} onChange={setPhone} type="tel" />
                      {!E164_REGEX.test(normalizePhone(phone)) && phone.length > 3 && (
                        <p className="ml-4 mt-1 text-xs text-rose-500">Formato: +54 9 11 5162 7044</p>
                      )}
                    </div>
                    <div>
                      <label className="ml-4 text-xs font-semibold text-foreground/55">Email (opcional)</label>
                      <PillInput placeholder="tu@email.com" value={email} onChange={setEmail} type="email" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="ml-1 mb-2 text-xs font-semibold text-foreground/55">Tipo de tratamiento</p>
                      <div className="grid grid-cols-2 gap-2">
                        {TREATMENTS.map((t) => (
                          <PillToggle
                            key={t.value}
                            active={treatmentType === t.value}
                            onClick={() => setTreatmentType(t.value)}
                            label={t.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="ml-1 mb-2 text-xs font-semibold text-foreground/55">Modalidad</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["Online", "Presencial"] as Modality[]).map((m) => (
                          <PillToggle
                            key={m}
                            active={modality === m}
                            onClick={() => { setModality(m); if (m === "Online") { setProvince(""); setLocality(""); } }}
                            label={m}
                          />
                        ))}
                      </div>
                    </div>
                    {modality === "Presencial" && (
                      <div className="space-y-3">
                        <div>
                          <label className="ml-4 text-xs font-semibold text-foreground/55">Provincia</label>
                          <PillSelect
                            value={province}
                            onChange={(v) => { setProvince(v); setLocality(""); }}
                            placeholder="Elegí provincia"
                            options={ARGENTINA_PROVINCES as readonly string[]}
                          />
                        </div>
                        {province && (
                          <div>
                            <label className="ml-4 text-xs font-semibold text-foreground/55">Localidad</label>
                            <PillSelect
                              value={locality}
                              onChange={setLocality}
                              placeholder="Elegí localidad"
                              options={localities}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="ml-4 text-xs font-semibold text-foreground/55">Motivo de consulta</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                        placeholder="Contanos qué te trae a consulta..."
                        rows={4}
                        className="w-full resize-none rounded-3xl border border-white/70 bg-white/70 px-5 py-4 text-[15px] text-foreground placeholder:text-foreground/40 shadow-[inset_0_2px_6px_rgba(16,25,39,0.06)] outline-none backdrop-blur transition focus:border-[#7cc2c8] focus:bg-white"
                      />
                      <p className="mr-4 text-right text-[10px] text-foreground/40">{description.length}/2000</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-2">
                  {step > 1 ? (
                    <button
                      onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                      className="flex items-center justify-center gap-1 rounded-2xl border border-foreground/15 bg-white/60 px-5 py-4 text-sm font-semibold text-foreground/70"
                    >
                      <ArrowLeft size={16} /> Volver
                    </button>
                  ) : (
                    <button
                      onClick={() => setView("sync")}
                      className="flex items-center justify-center gap-1 rounded-2xl border border-foreground/15 bg-white/60 px-5 py-4 text-sm font-semibold text-foreground/70"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                      disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#101927] py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(16,25,39,0.4)] transition active:scale-[0.98] disabled:opacity-50"
                    >
                      Continuar <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={handleIntake}
                      disabled={submitting || !canSubmit}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#101927] py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(16,25,39,0.4)] transition active:scale-[0.98] disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : "Enviar solicitud"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PillInput({
  placeholder, value, onChange, type = "text", autoFocus,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; autoFocus?: boolean;
}) {
  return (
    <input
      autoFocus={autoFocus}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-full border border-white/70 bg-white/70 px-5 py-4 text-[15px] text-foreground placeholder:text-foreground/40 shadow-[inset_0_2px_6px_rgba(16,25,39,0.06)] outline-none backdrop-blur transition focus:border-[#7cc2c8] focus:bg-white"
    />
  );
}

function PillToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-[#101927] text-white shadow-[0_6px_16px_-6px_rgba(16,25,39,0.5)]"
          : "border border-foreground/15 bg-white/60 text-foreground/70"
      }`}
    >
      {label}
    </button>
  );
}

function PillSelect({
  value, onChange, placeholder, options,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-full border border-white/70 bg-white/70 px-5 py-4 text-[15px] text-foreground shadow-[inset_0_2px_6px_rgba(16,25,39,0.06)] outline-none backdrop-blur transition focus:border-[#7cc2c8] focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
