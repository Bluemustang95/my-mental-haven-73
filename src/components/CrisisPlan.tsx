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
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import resmitaAvatar from "@/assets/resmita.png";

const STORAGE_KEY = "resma:safety-plan:v1";

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

interface SafetyPlanData {
  signals: string;
  strategies: string;
  trustedContacts: ContactRow[];
  proContacts: ContactRow[];
  safeEnv: string;
}

const DEFAULT_DATA: SafetyPlanData = {
  signals: "",
  strategies: "",
  trustedContacts: [{ name: "", phone: "" }],
  proContacts: [{ name: "", phone: "" }],
  safeEnv: "",
};

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

  // Load from localStorage on mount
  useEffect(() => {
    setData(loadPlan());
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const update = <K extends keyof SafetyPlanData>(key: K, value: SafetyPlanData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const addRow = (key: "trustedContacts" | "proContacts") =>
    setData((d) => ({ ...d, [key]: [...d[key], { name: "", phone: "" }] }));
  const removeRow = (key: "trustedContacts" | "proContacts", i: number) =>
    setData((d) => ({ ...d, [key]: d[key].filter((_, idx) => idx !== i) }));
  const updateRow = (
    key: "trustedContacts" | "proContacts",
    i: number,
    field: keyof ContactRow,
    val: string,
  ) =>
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
      doc.setFontSize(16);
      doc.setTextColor(20, 20, 30);
      doc.text(text, margin, y);
      y += 22;
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
      const lines = doc.splitTextToSize(text || "—", width - margin * 2);
      lines.forEach((ln: string) => {
        ensureSpace(14);
        doc.text(ln, margin, y);
        y += 14;
      });
      y += 6;
    };

    const writeContacts = (rows: ContactRow[]) => {
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
        doc.text(`• ${r.name || "Sin nombre"} — ${r.phone || "Sin teléfono"}`, margin, y);
        y += 14;
      });
      y += 6;
    };

    writeTitle("Mi Plan de Seguridad");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 130);
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-AR")} • RESMA`,
      margin,
      y,
    );
    y += 24;

    writeSection("1. Mis señales de advertencia");
    writeBody(data.signals);

    writeSection("2. Estrategias de afrontamiento");
    writeBody(data.strategies);

    writeSection("3. Personas de confianza");
    writeContacts(data.trustedContacts);

    writeSection("4. Profesionales de contacto");
    writeContacts(data.proContacts);

    writeSection("5. Ayuda profesional inmediata");
    writeBody(
      "• 911 — Emergencias\n• 0800 222 5462 — Salud Mental Responde (24 hs)\n• Hospital público más cercano: buscar guardia de salud mental",
    );

    writeSection("6. Mi ambiente seguro");
    writeBody(data.safeEnv);

    doc.save("plan-de-seguridad.pdf");
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
          <p className="font-display text-sm font-semibold text-foreground">Plan de Seguridad</p>
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-50 ring-2 ring-sky-100">
                    <img
                      src={resmitaAvatar}
                      alt="Resmita"
                      className="h-full w-full object-cover"
                    />
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
                      value={data.signals}
                      onChange={(e) => update("signals", e.target.value)}
                      placeholder="Ej: Pensamientos negativos recurrentes, aislamiento, dificultad para dormir…"
                      rows={4}
                      className={inputClass + " min-h-[100px] resize-none"}
                    />
                  )}

                  {step === 1 && (
                    <>
                      <p className="text-[11px] text-muted-foreground">
                        Sugerencias: Respiración, agarrar hielos, ducha fría, escuchar música.
                      </p>
                      <textarea
                        value={data.strategies}
                        onChange={(e) => update("strategies", e.target.value)}
                        placeholder="Escribí tus estrategias personales…"
                        rows={4}
                        className={inputClass + " min-h-[100px] resize-none"}
                      />
                    </>
                  )}

                  {step === 2 && (
                    <>
                      {data.trustedContacts.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            placeholder="Nombre"
                            value={c.name}
                            onChange={(e) => updateRow("trustedContacts", i, "name", e.target.value)}
                            className={inputClass + " flex-1"}
                          />
                          <input
                            placeholder="Teléfono"
                            value={c.phone}
                            onChange={(e) => updateRow("trustedContacts", i, "phone", e.target.value)}
                            className={inputClass + " w-[130px]"}
                          />
                          {data.trustedContacts.length > 1 && (
                            <button
                              onClick={() => removeRow("trustedContacts", i)}
                              className="text-muted-foreground/60"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addRow("trustedContacts")}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-primary"
                      >
                        <Plus size={14} /> Agregar contacto
                      </button>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      {data.proContacts.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            placeholder="Nombre / Profesión"
                            value={c.name}
                            onChange={(e) => updateRow("proContacts", i, "name", e.target.value)}
                            className={inputClass + " flex-1"}
                          />
                          <input
                            placeholder="Teléfono"
                            value={c.phone}
                            onChange={(e) => updateRow("proContacts", i, "phone", e.target.value)}
                            className={inputClass + " w-[130px]"}
                          />
                          {data.proContacts.length > 1 && (
                            <button
                              onClick={() => removeRow("proContacts", i)}
                              className="text-muted-foreground/60"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addRow("proContacts")}
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
                    <>
                      <textarea
                        value={data.safeEnv}
                        onChange={(e) => update("safeEnv", e.target.value)}
                        placeholder="Ej: Guardar objetos peligrosos, ir a casa de alguien de confianza, alejarme de situaciones de riesgo…"
                        rows={4}
                        className={inputClass + " min-h-[100px] resize-none"}
                      />
                      <button
                        onClick={handleDownload}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 py-3 font-display text-sm text-foreground transition-colors active:bg-muted"
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
