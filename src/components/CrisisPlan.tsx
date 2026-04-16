import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Check,
  Eye,
  Shield,
  Users,
  UserPlus,
  Lightbulb,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const STEP_TITLES = [
  "Tus señales de advertencia",
  "Estrategias de afrontamiento",
  "Personas de confianza",
  "Profesionales de contacto",
  "Ayuda profesional inmediata",
  "Tu ambiente seguro",
];

const STEP_ICONS = [Eye, Lightbulb, Users, UserPlus, Phone, Shield];

const RESMITA_MESSAGES = [
  "Este será tu plan de seguridad para seguir en un momento de crisis. Recordá confeccionarlo con tu terapeuta.",
  "Pensá en cosas que te ayuden a distraerte o calmarte. Pueden ser actividades simples que podás hacer solo/a.",
  "¿Quiénes son las personas en las que confiás? Pueden ayudarte a sentirte acompañado/a.",
  "Un profesional puede brindarte apoyo especializado. Anotá los datos de tu terapeuta o psiquiatra.",
  "Si sentís que estás en peligro, estas líneas están disponibles las 24 horas, los 7 días.",
  "Pensá en qué cosas podrías cambiar en tu entorno para sentirte más seguro/a.",
];

interface ContactRow {
  name: string;
  phone: string;
}

export default function CrisisPlan() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  // Step data
  const [signals, setSignals] = useState("");
  const [strategies, setStrategies] = useState("");
  const [trustedContacts, setTrustedContacts] = useState<ContactRow[]>([{ name: "", phone: "" }]);
  const [proContacts, setProContacts] = useState<ContactRow[]>([{ name: "", phone: "" }]);
  const [safeEnv, setSafeEnv] = useState("");

  const addTrusted = () => setTrustedContacts((c) => [...c, { name: "", phone: "" }]);
  const removeTrusted = (i: number) => setTrustedContacts((c) => c.filter((_, idx) => idx !== i));
  const updateTrusted = (i: number, field: keyof ContactRow, val: string) =>
    setTrustedContacts((c) => c.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  const addPro = () => setProContacts((c) => [...c, { name: "", phone: "" }]);
  const removePro = (i: number) => setProContacts((c) => c.filter((_, idx) => idx !== i));
  const updatePro = (i: number, field: keyof ContactRow, val: string) =>
    setProContacts((c) => c.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setStep(0);
    }, 1800);
  };

  const StepIcon = STEP_ICONS[step];

  const inputClass =
    "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 font-body";

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center gap-4 rounded-[2.5rem] border border-destructive/15 bg-destructive/5 p-5 text-left shadow-sm"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle size={22} className="text-destructive" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold text-foreground">Plan de Crisis</p>
          <p className="text-[11px] text-muted-foreground">Protocolo de seguridad personalizado</p>
        </div>
      </motion.button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-border p-0 sm:max-w-md">
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 p-10"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Check size={32} className="text-emerald-600" />
                </div>
                <p className="font-display text-lg font-semibold text-foreground">¡Plan guardado!</p>
                <p className="text-sm text-muted-foreground">Podés editarlo cuando quieras.</p>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                {/* Header */}
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                      <StepIcon size={16} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      Paso {step + 1} de 6
                    </span>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground">
                    <X size={18} />
                  </button>
                </div>

                <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
                  {STEP_TITLES[step]}
                </h3>

                {/* Resmita guide */}
                <div className="mt-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-muted/60 px-4 py-3">
                    <p className="text-[12px] leading-relaxed text-muted-foreground font-body">
                      {RESMITA_MESSAGES[step]}
                    </p>
                  </div>
                </div>

                {/* Step content */}
                <div className="mt-5 space-y-3">
                  {step === 0 && (
                    <textarea
                      value={signals}
                      onChange={(e) => setSignals(e.target.value)}
                      placeholder="Ej: Pensamientos negativos recurrentes, aislamiento, dificultad para dormir…"
                      rows={4}
                      className={inputClass + " min-h-[100px] resize-none"}
                    />
                  )}

                  {step === 1 && (
                    <>
                      <p className="text-[11px] text-muted-foreground">
                        Sugerencias: Técnicas de respiración, agarrar hielos, ducharte con agua fría, escuchar música.
                      </p>
                      <textarea
                        value={strategies}
                        onChange={(e) => setStrategies(e.target.value)}
                        placeholder="Escribí tus estrategias personales…"
                        rows={4}
                        className={inputClass + " min-h-[100px] resize-none"}
                      />
                    </>
                  )}

                  {step === 2 && (
                    <>
                      {trustedContacts.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            placeholder="Nombre"
                            value={c.name}
                            onChange={(e) => updateTrusted(i, "name", e.target.value)}
                            className={inputClass + " flex-1"}
                          />
                          <input
                            placeholder="Teléfono"
                            value={c.phone}
                            onChange={(e) => updateTrusted(i, "phone", e.target.value)}
                            className={inputClass + " w-[130px]"}
                          />
                          {trustedContacts.length > 1 && (
                            <button onClick={() => removeTrusted(i)} className="text-muted-foreground/60">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addTrusted}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-primary"
                      >
                        <Plus size={14} /> Agregar contacto
                      </button>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      {proContacts.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            placeholder="Nombre / Profesión"
                            value={c.name}
                            onChange={(e) => updatePro(i, "name", e.target.value)}
                            className={inputClass + " flex-1"}
                          />
                          <input
                            placeholder="Teléfono"
                            value={c.phone}
                            onChange={(e) => updatePro(i, "phone", e.target.value)}
                            className={inputClass + " w-[130px]"}
                          />
                          {proContacts.length > 1 && (
                            <button onClick={() => removePro(i)} className="text-muted-foreground/60">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addPro}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-primary"
                      >
                        <Plus size={14} /> Agregar profesional
                      </button>
                    </>
                  )}

                  {step === 4 && (
                    <div className="space-y-3">
                      <a
                        href="tel:911"
                        className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 transition-colors active:bg-destructive/10"
                      >
                        <Phone size={20} className="text-destructive" />
                        <div>
                          <p className="font-display text-sm font-semibold">911</p>
                          <p className="text-[11px] text-muted-foreground">Emergencias</p>
                        </div>
                      </a>
                      <a
                        href="tel:08002225462"
                        className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-colors active:bg-primary/10"
                      >
                        <Phone size={20} className="text-primary" />
                        <div>
                          <p className="font-display text-sm font-semibold">0800 222 5462</p>
                          <p className="text-[11px] text-muted-foreground">Salud Mental Responde (24 hs)</p>
                        </div>
                      </a>
                      <a
                        href="https://www.google.com/maps/search/hospital+p%C3%BAblico+guardia+salud+mental"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-muted"
                      >
                        <MapPin size={20} className="text-muted-foreground" />
                        <div>
                          <p className="font-display text-sm font-semibold">Hospital Público</p>
                          <p className="text-[11px] text-muted-foreground">Buscar guardia de salud mental cercana</p>
                        </div>
                      </a>
                    </div>
                  )}

                  {step === 5 && (
                    <textarea
                      value={safeEnv}
                      onChange={(e) => setSafeEnv(e.target.value)}
                      placeholder="Ej: Guardar objetos peligrosos, ir a casa de alguien de confianza, alejarme de situaciones de riesgo…"
                      rows={4}
                      className={inputClass + " min-h-[100px] resize-none"}
                    />
                  )}
                </div>

                {/* Progress dots */}
                <div className="mt-6 flex justify-center gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="mt-5 flex gap-2">
                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-border py-3 font-display text-sm text-muted-foreground active:bg-muted"
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>
                  )}
                  {step < 5 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-primary py-3 font-display text-sm text-primary-foreground active:opacity-90"
                    >
                      Siguiente <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-primary py-3 font-display text-sm text-primary-foreground active:opacity-90"
                    >
                      <Check size={16} /> Guardar plan
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
