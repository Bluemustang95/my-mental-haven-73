import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Phone, Plus, Shield, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { saveLog } from "@/lib/resourceLogs";
import { supabase } from "@/integrations/supabase/client";
import { loadHotlines, detectUserCountry, type Hotline } from "@/lib/crisisHotlines";
import { toast } from "sonner";

const suggestedSigns = [
  "Pensamientos intrusivos y persistentes",
  "Aislamiento de personas queridas",
  "Cambios bruscos de ánimo",
  "Dificultad para dormir o comer",
  "Sensación de desesperanza",
  "Aumento del consumo",
];

const suggestedCoping = [
  "Salir a caminar 10 minutos",
  "Escuchar una canción que me calma",
  "Ejercicio de respiración 4-7-8",
  "Llamar a alguien de confianza",
  "Escribir en el diario",
];

const ambiental = [
  "Guardá objetos peligrosos fuera de tu alcance.",
  "Pedile a alguien de confianza que te acompañe.",
  "Encendé luces, abrí ventanas y bajá la música fuerte.",
  "Salí del lugar donde te sentís peor: caminá una cuadra.",
];

type Contact = { name: string; phone: string };

export default function SafetyPlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signs, setSigns] = useState<string[]>([]);
  const [coping, setCoping] = useState<string[]>([]);
  const [signDraft, setSignDraft] = useState("");
  const [copingDraft, setCopingDraft] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [draft, setDraft] = useState<Contact>({ name: "", phone: "" });
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [country, setCountry] = useState<string>("AR");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const c = (await detectUserCountry()) ?? "AR";
      setCountry(c);
      setHotlines(await loadHotlines(c));
      if (user) {
        const { data } = await supabase.from("safety_plans").select("*").eq("user_id", user.id).maybeSingle();
        if (data) {
          setSigns((data.warning_signs as unknown as string[]) ?? []);
          setCoping((data.coping_strategies as unknown as string[]) ?? []);
          setContacts(((data.contacts as unknown as Contact[]) ?? []));
        }
      }
      setLoading(false);
    })();
  }, []);

  // Cloud autosave (debounced)
  useEffect(() => {
    if (loading) return;
    const id = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setSaving(true);
      await supabase.from("safety_plans").upsert({
        user_id: user.id,
        warning_signs: signs as unknown as never,
        coping_strategies: coping as unknown as never,
        contacts: contacts as unknown as never,
      }, { onConflict: "user_id" });
      setSaving(false);
    }, 800);
    return () => clearTimeout(id);
  }, [signs, coping, contacts, loading]);

  const addSign = (v: string) => {
    const t = v.trim();
    if (!t || signs.includes(t) || signs.length >= 8) return;
    setSigns((s) => [...s, t]);
    setSignDraft("");
  };
  const removeSign = (i: number) => setSigns((s) => s.filter((_, idx) => idx !== i));

  const addCoping = (v: string) => {
    const t = v.trim();
    if (!t || coping.includes(t) || coping.length >= 8) return;
    setCoping((s) => [...s, t]);
    setCopingDraft("");
  };
  const removeCoping = (i: number) => setCoping((s) => s.filter((_, idx) => idx !== i));

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
      `País: ${country}`,
      "",
      "Señales de alerta detectadas:",
      ...signs.map((s) => `  - ${s}`),
      "",
      "Estrategias para calmarme:",
      ...coping.map((s) => `  - ${s}`),
      "",
      "Red de apoyo personal:",
      ...contacts.map((c) => `  - ${c.name}: ${c.phone}`),
      "",
      "Líneas de emergencia:",
      ...hotlines.map((e) => `  - ${e.label}: ${e.phone}`),
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
    toast.success("Reporte descargado");
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-resource-safety-accent">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-resource-safety-bg px-5 pb-28 pt-12 text-resource-safety-accent safe-area-top">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate("/herramientas")} aria-label="Volver"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-resource-safety-accent/15 bg-card/80 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[10px] text-resource-safety-accent/60">Guardando…</span>}
          <span className="rounded-full bg-card/80 px-4 py-2 font-mindful text-xs font-semibold shadow-sm">Plan de Seguridad</span>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-card/85 shadow-sm shadow-resource-safety-accent/20">
          <Shield size={32} strokeWidth={2.1} />
        </div>
        <div>
          <h1 className="font-mindful text-3xl leading-tight">Tu red de contención</h1>
          <p className="font-sans text-xs leading-5 text-resource-safety-accent/70">Se guarda en la nube · líneas para {country}.</p>
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
        <p className="mb-3 font-mindful text-base font-semibold">Líneas de emergencia ({country})</p>
        <div className="space-y-2">
          {hotlines.map((e) => (
            <a key={e.id} href={`tel:${e.phone.replace(/\s+/g, "")}`}
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
