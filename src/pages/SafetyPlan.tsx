import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Phone, Plus, Shield, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { saveLog } from "@/lib/resourceLogs";

const warningSigns = [
  "Pensamientos intrusivos y persistentes",
  "Aislamiento de personas queridas",
  "Cambios bruscos de ánimo",
  "Dificultad para dormir o comer",
  "Sensación de desesperanza",
  "Aumento del consumo",
];

const emergency = [
  { label: "Emergencias 911", phone: "911" },
  { label: "Centro de Asistencia al Suicida (135)", phone: "135" },
  { label: "SAME / Salud Mental (107)", phone: "107" },
];

const ambiental = [
  "Guardá objetos peligrosos fuera de tu alcance.",
  "Pedile a alguien de confianza que te acompañe.",
  "Encendé luces, abrí ventanas y bajá la música fuerte.",
  "Salí del lugar donde te sentís peor: caminá una cuadra.",
];

const STORAGE_KEY = "resma:safety:contacts";
type Contact = { name: string; phone: string };

export default function SafetyPlan() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [draft, setDraft] = useState<Contact>({ name: "", phone: "" });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setContacts(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const addContact = () => {
    if (!draft.name.trim() || !draft.phone.trim()) return;
    setContacts((c) => [...c, draft]);
    setDraft({ name: "", phone: "" });
  };

  const removeContact = (i: number) => setContacts((c) => c.filter((_, idx) => idx !== i));

  const downloadReport = () => {
    const lines = [
      "PLAN DE SEGURIDAD — RESMA",
      `Fecha: ${new Date().toLocaleDateString("es-AR")}`,
      "",
      "Señales de alerta detectadas:",
      ...[...checked].map((i) => `  - ${warningSigns[i]}`),
      "",
      "Red de apoyo personal:",
      ...contacts.map((c) => `  - ${c.name}: ${c.phone}`),
      "",
      "Líneas de emergencia:",
      ...emergency.map((e) => `  - ${e.label}: ${e.phone}`),
      "",
      "Modificación del entorno:",
      ...ambiental.map((tip) => `  - ${tip}`),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-seguridad-resma-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    saveLog("safety", { meta: { signs: checked.size, contacts: contacts.length } });
  };

  return (
    <div className="min-h-screen bg-resource-safety-bg px-5 pb-28 pt-12 text-resource-safety-accent safe-area-top">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate("/herramientas")} aria-label="Volver"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-resource-safety-accent/15 bg-card/80 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <span className="rounded-full bg-card/80 px-4 py-2 font-mindful text-xs font-semibold shadow-sm">Plan de Seguridad</span>
      </header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-card/85 shadow-sm shadow-resource-safety-accent/20">
          <Shield size={32} strokeWidth={2.1} />
        </div>
        <div>
          <h1 className="font-mindful text-3xl leading-tight">Tu red de contención</h1>
          <p className="font-sans text-xs leading-5 text-resource-safety-accent/70">Tenelo a mano antes de que lo necesites.</p>
        </div>
      </motion.div>

      <section className="mb-5 rounded-[2.5rem] border border-resource-safety-accent/15 bg-card/85 p-5 shadow-sm">
        <p className="mb-3 font-mindful text-base font-semibold">Señales de alerta</p>
        <div className="space-y-2">
          {warningSigns.map((sign, i) => (
            <button key={sign} onClick={() => toggle(i)}
              className={cn("flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                checked.has(i) ? "border-resource-safety-accent bg-resource-safety-accent/10" : "border-resource-safety-accent/15 bg-resource-safety-bg/60")}>
              <span className={cn("h-4 w-4 shrink-0 rounded border-2", checked.has(i) ? "border-resource-safety-accent bg-resource-safety-accent" : "border-resource-safety-accent/40")} />
              <span className="font-sans text-sm font-semibold leading-5">{sign}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-5 rounded-[2.5rem] border border-resource-safety-accent/15 bg-card/85 p-5 shadow-sm">
        <p className="mb-3 font-mindful text-base font-semibold">Líneas de emergencia</p>
        <div className="space-y-2">
          {emergency.map((e) => (
            <a key={e.label} href={`tel:${e.phone}`}
              className="flex items-center gap-3 rounded-2xl bg-resource-safety-accent px-4 py-4 font-mindful text-base font-bold text-primary-foreground shadow-lg shadow-resource-safety-accent/25 active:scale-[0.98]">
              <Phone size={20} /> <span className="flex-1">{e.label}</span><span className="font-sans text-sm opacity-85">{e.phone}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mb-5 rounded-[2.5rem] border border-resource-safety-accent/15 bg-card/85 p-5 shadow-sm">
        <p className="mb-3 font-mindful text-base font-semibold">Red de apoyo personal</p>
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div key={`${c.name}-${i}`} className="flex items-center gap-3 rounded-2xl border border-resource-safety-accent/15 bg-resource-safety-bg/60 px-4 py-3">
              <a href={`tel:${c.phone}`} className="flex flex-1 items-center gap-3">
                <Phone size={18} />
                <div><p className="font-mindful text-sm font-semibold">{c.name}</p><p className="text-xs opacity-65">{c.phone}</p></div>
              </a>
              <button onClick={() => removeContact(i)} aria-label="Eliminar" className="p-2 text-resource-safety-accent/55">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nombre"
              className="flex-1 rounded-2xl border border-resource-safety-accent/15 bg-resource-safety-bg/60 px-3 py-2.5 text-sm outline-none" />
            <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Teléfono" inputMode="tel"
              className="w-32 rounded-2xl border border-resource-safety-accent/15 bg-resource-safety-bg/60 px-3 py-2.5 text-sm outline-none" />
            <button onClick={addContact} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-resource-safety-accent text-primary-foreground active:scale-95">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-[2.5rem] border border-resource-safety-accent/15 bg-card/85 p-5 shadow-sm">
        <p className="mb-3 font-mindful text-base font-semibold">Modificá el entorno</p>
        <ul className="space-y-2 font-sans text-sm leading-6 text-resource-safety-accent/85">
          {ambiental.map((tip) => (
            <li key={tip} className="rounded-2xl bg-resource-safety-bg/60 px-4 py-3">{tip}</li>
          ))}
        </ul>
      </section>

      <button onClick={downloadReport}
        className="flex w-full items-center justify-center gap-2 rounded-[3rem] border border-resource-safety-accent/20 bg-card/85 py-4 font-mindful text-base font-semibold shadow-sm active:scale-[0.98]">
        <Download size={20} /> Descargar reporte para mi psicólogo
      </button>
    </div>
  );
}
