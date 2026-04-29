import { useState, useEffect } from "react";
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
  Download,
  Coffee,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import resmitaAvatar from "@/assets/resmita.png";

const STORAGE_KEY = "resma:safety-plan:v2";

const STEP_TITLES = [
  "Señales de advertencia",
  "Estrategias internas de afrontamiento",
  "Personas y entornos sociales para distracción",
  "Personas a quienes puedo pedir ayuda",
  "Profesionales o agencias a contactar",
  "Hacer el ambiente seguro",
];

const STEP_PLACEHOLDERS_HINT = [
  "Pensamientos, imágenes, estados de ánimo o situaciones que indican que se acerca una crisis.",
  "Cosas que podés hacer solo/a: respiración, hielos, ducha fría, caminar, música.",
  "Lugares o personas que te ayudan a distraerte (sin necesariamente hablar de la crisis).",
  "Familiares o amigos de confianza a los que podés pedirles ayuda directamente.",
  "Servicios de salud mental, terapeuta, psiquiatra y emergencias.",
  "Restringir el acceso a elementos peligrosos y crear un entorno más seguro.",
];

const STEP_ICONS = [Eye, Lightbulb, Coffee, Users, UserPlus, Shield];

const RESMITA_MESSAGES = [
  "Este será tu plan de seguridad para seguir en un momento de crisis. Recordá confeccionarlo con tu terapeuta.",
  "Pensá en cosas que podés hacer solo/a para calmarte antes de pedir ayuda.",
  "Anotá lugares o gente con quien podés pasar el rato para despejarte.",
  "¿Quiénes son las personas de confianza a las que podrías llamar si necesitás ayuda?",
  "Tu terapeuta, psiquiatra o servicios de emergencia. Tenelos siempre a mano.",
  "Pensá qué cosas podrías cambiar en tu entorno para sentirte más seguro/a.",
];

interface ContactRow {
  name: string;
  phone: string;
}

interface SafetyPlanData {
  signals: string;
  strategies: string;
  socialDistraction: ContactRow[];
  trustedContacts: ContactRow[];
  proContacts: ContactRow[];
  safeEnv: string;
}

const DEFAULT_DATA: SafetyPlanData = {
  signals: "",
  strategies: "",
  socialDistraction: [{ name: "", phone: "" }],
  trustedContacts: [{ name: "", phone: "" }],
  proContacts: [{ name: "", phone: "" }],
  safeEnv: "",
};

type ContactKey = "socialDistraction" | "trustedContacts" | "proContacts";

function loadPlan(): SafetyPlanData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...parsed };
  } catch {
    return DEFAULT_DATA;
  }
}

export default function CrisisPlan() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState<SafetyPlanData>(DEFAULT_DATA);

  useEffect(() => {
    setData(loadPlan());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const update = <K extends keyof SafetyPlanData>(key: K, value: SafetyPlanData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const addRow = (key: ContactKey) =>
    setData((d) => ({ ...d, [key]: [...d[key], { name: "", phone: "" }] }));
  const removeRow = (key: ContactKey, i: number) =>
    setData((d) => ({ ...d, [key]: d[key].filter((_, idx) => idx !== i) }));
  const updateRow = (key: ContactKey, i: number, field: keyof ContactRow, val: string) =>
    setData((d) => ({
      ...d,
      [key]: d[key].map((r, idx) => (idx === i ? { ...r, [field]: val } : r)),
    }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setStep(0);
    }, 1800);
  };

  const openHospitalMaps = () => {
    const url = "https://www.google.com/maps/search/hospital+publico+guardia+salud+mental/";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeTitle = (text: string) => {
      ensureSpace(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 30);
      doc.text(text, margin, y);
      y += 24;
    };

    const writeSection = (label: string) => {
      ensureSpace(22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 50);
      doc.text(label, margin, y);
      y += 16;
    };

    const writeBody = (text: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 70);
      const lines = doc.splitTextToSize(text?.trim() || "—", width - margin * 2);
      lines.forEach((ln: string) => {
        ensureSpace(14);
        doc.text(ln, margin, y);
        y += 14;
      });
      y += 6;
    };

    const writeContacts = (rows: ContactRow[], phoneLabel = "Teléfono") => {
      const filled = rows.filter((r) => r.name.trim() || r.phone.trim());
      if (filled.length === 0) {
        writeBody("—");
        return;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 70);
      filled.forEach((r) => {
        ensureSpace(14);
        const name = r.name.trim() || "Sin nombre";
        const phone = r.phone.trim() || `Sin ${phoneLabel.toLowerCase()}`;
        doc.text(`• ${name} — ${phone}`, margin, y);
        y += 14;
      });
      y += 6;
    };

    writeTitle("Mi Plan de Seguridad");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 130);
    doc.text(`Generado el ${new Date().toLocaleDateString("es-AR")} • RESMA`, margin, y);
    y += 24;

    writeSection("1. Señales de advertencia");
    writeBody(data.signals);

    writeSection("2. Estrategias internas de afrontamiento");
    writeBody(data.strategies);

    writeSection("3. Personas y entornos sociales para distracción");
    writeContacts(data.socialDistraction, "Lugar/Teléfono");

    writeSection("4. Personas a quienes puedo pedir ayuda");
    writeContacts(data.trustedContacts);

    writeSection("5. Profesionales o agencias a contactar");
    writeContacts(data.proContacts);
    writeBody(
      "• 911 — Emergencias\n• 0800 222 5462 — Salud Mental Responde (24 hs)\n• Hospital público con guardia de salud mental más cercano",
    );

    writeSection("6. Hacer el ambiente seguro");
    writeBody(data.safeEnv);

    doc.save("plan-de-seguridad.pdf");
  };

  const StepIcon = STEP_ICONS[step];

  const inputClass =
    "w-full rounded-2xl border border-resource-safety-accent/20 bg-card/75 px-4 py-3 text-sm placeholder:text-resource-safety-accent/35 focus:outline-none focus:ring-2 focus:ring-resource-safety-accent/20 font-body";

  const renderContactList = (
    key: ContactKey,
    namePlaceholder: string,
    phonePlaceholder: string,
    addLabel: string,
  ) => (
    <>
      {data[key].map((c, i) => (
        <div key={i} className="space-y-2 rounded-2xl border border-resource-safety-accent/15 bg-card/45 p-3">
          <div className="flex items-center gap-2">
            <input
              placeholder={namePlaceholder}
              value={c.name}
              onChange={(e) => updateRow(key, i, "name", e.target.value)}
              className={inputClass + " flex-1"}
            />
            {data[key].length > 1 && (
              <button
                onClick={() => removeRow(key, i)}
                className="text-resource-safety-accent/60"
                aria-label="Quitar"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <input
            placeholder={phonePlaceholder}
            value={c.phone}
            inputMode="tel"
            onChange={(e) => updateRow(key, i, "phone", e.target.value)}
            className={inputClass}
          />
        </div>
      ))}
      <button
        onClick={() => addRow(key)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-resource-safety-accent"
      >
        <Plus size={14} /> {addLabel}
      </button>
    </>
  );

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center gap-4 rounded-[2.5rem] border border-resource-safety-accent/15 bg-resource-safety-bg p-5 text-left text-resource-safety-accent shadow-sm"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-resource-safety-accent/10">
          <AlertTriangle size={22} />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold">Plan de Seguridad</p>
          <p className="text-[11px] opacity-70">Protocolo de seguridad personalizado</p>
        </div>
      </motion.button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-resource-safety-accent/15 bg-resource-safety-bg p-0 sm:max-w-md">
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
                <p className="text-sm text-resource-safety-accent/65">Podés editarlo cuando quieras.</p>
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-resource-safety-accent/10">
                      <StepIcon size={16} className="text-resource-safety-accent" />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-resource-safety-accent/65">
                      Paso {step + 1} de 6
                    </span>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-resource-safety-accent/65">
                    <X size={18} />
                  </button>
                </div>

                <h3 className="mt-3 font-display text-lg font-semibold leading-tight text-resource-safety-accent">
                  {STEP_TITLES[step]}
                </h3>
                <p className="mt-1 text-[12px] text-resource-safety-accent/65 font-body">
                  {STEP_PLACEHOLDERS_HINT[step]}
                </p>

                {/* Resmita guide */}
                <div className="mt-4 flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-card/65 ring-1 ring-resource-safety-accent/10 p-1">
                    <img
                      src={resmitaAvatar}
                      alt="Resmita"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-card/65 px-4 py-3">
                    <p className="text-[12px] leading-relaxed text-resource-safety-accent/70 font-body">
                      {RESMITA_MESSAGES[step]}
                    </p>
                  </div>
                </div>

                {/* Step content */}
                <div className="mt-5 space-y-3">
                  {step === 0 && (
                    <textarea
                      value={data.signals}
                      onChange={(e) => update("signals", e.target.value)}
                      placeholder="Ej: Pensamientos negativos recurrentes, imágenes intrusivas, irritabilidad, aislamiento, no poder dormir…"
                      rows={4}
                      className={inputClass + " min-h-[110px] resize-none"}
                    />
                  )}

                  {step === 1 && (
                    <>
                      <p className="text-[11px] text-resource-safety-accent/65">
                        Sugerencias: respiración, agarrar hielos, ducharte con agua fría, escuchar música, caminar.
                      </p>
                      <textarea
                        value={data.strategies}
                        onChange={(e) => update("strategies", e.target.value)}
                        placeholder="Escribí las estrategias que te funcionan a vos…"
                        rows={4}
                        className={inputClass + " min-h-[110px] resize-none"}
                      />
                    </>
                  )}

                  {step === 2 &&
                    renderContactList(
                      "socialDistraction",
                      "Lugar o persona (ej: plaza, café, mi hermano)",
                      "Teléfono o dirección (opcional)",
                      "Agregar lugar o persona",
                    )}

                  {step === 3 &&
                    renderContactList(
                      "trustedContacts",
                      "Nombre del familiar o amigo/a",
                      "Teléfono",
                      "Agregar contacto",
                    )}

                  {step === 4 && (
                    <div className="space-y-3">
                      {renderContactList(
                        "proContacts",
                        "Profesional o clínica (ej: Dra. López)",
                        "Teléfono",
                        "Agregar profesional",
                      )}

                      <div className="pt-2 space-y-2">
                        <a
                          href="tel:911"
                          className="flex items-center gap-3 rounded-2xl border border-resource-safety-accent/20 bg-card/60 p-4 text-resource-safety-accent transition-colors active:bg-resource-safety-accent/10"
                        >
                          <Phone size={20} />
                          <div>
                            <p className="font-display text-sm font-semibold">911</p>
                            <p className="text-[11px] opacity-65">Emergencias</p>
                          </div>
                        </a>
                        <a
                          href="tel:08002225462"
                          className="flex items-center gap-3 rounded-2xl border border-resource-safety-accent/20 bg-card/60 p-4 text-resource-safety-accent transition-colors active:bg-resource-safety-accent/10"
                        >
                          <Phone size={20} />
                          <div>
                            <p className="font-display text-sm font-semibold">0800 222 5462</p>
                            <p className="text-[11px] opacity-65">Salud Mental Responde (24 hs)</p>
                          </div>
                        </a>
                        <button
                          type="button"
                          onClick={openHospitalMaps}
                          className="flex w-full items-center gap-3 rounded-2xl border border-resource-safety-accent/20 bg-card/60 p-4 text-left text-resource-safety-accent transition-colors active:bg-resource-safety-accent/10"
                        >
                          <MapPin size={20} />
                          <div>
                            <p className="font-display text-sm font-semibold">Hospital Público</p>
                            <p className="text-[11px] opacity-65">Buscar guardia de salud mental cercana</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <>
                      <textarea
                        value={data.safeEnv}
                        onChange={(e) => update("safeEnv", e.target.value)}
                        placeholder="Ej: Guardar medicamentos bajo llave, alejar objetos peligrosos, ir a casa de alguien de confianza…"
                        rows={4}
                        className={inputClass + " min-h-[110px] resize-none"}
                      />
                      <button
                        onClick={handleDownload}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-resource-safety-accent/20 bg-card/60 py-3 font-display text-sm text-resource-safety-accent transition-colors active:bg-resource-safety-accent/10"
                      >
                        <Download size={16} /> Descargar mi Plan (PDF)
                      </button>
                    </>
                  )}
                </div>

                {/* Progress dots */}
                <div className="mt-6 flex justify-center gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === step ? "w-6 bg-resource-safety-accent" : i < step ? "w-1.5 bg-resource-safety-accent/40" : "w-1.5 bg-card/80"
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="mt-5 flex gap-2">
                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-resource-safety-accent/20 bg-card/60 py-3 font-display text-sm text-resource-safety-accent/70 active:bg-resource-safety-accent/10"
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>
                  )}
                  {step < 5 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-resource-safety-accent py-3 font-display text-sm text-primary-foreground active:opacity-90"
                    >
                      Siguiente <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-resource-safety-accent py-3 font-display text-sm text-primary-foreground active:opacity-90"
                    >
                      <Check size={16} /> Finalizar
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
