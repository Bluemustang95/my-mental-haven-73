import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Shield, Send, Check, Download, Lock, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSendSummaryWindow } from "@/hooks/useNextSession";

export function ReportEditor({
  initialText,
  displayName,
}: {
  initialText: string;
  displayName: string;
}) {
  const { user } = useAuth();
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [therapist, setTherapist] = useState<{ name: string | null; phone: string | null } | null>(null);
  const [bridgeState, setBridgeState] = useState<string | null>(null);
  const { inWindow, hasSession, nextSessionAt, loading: windowLoading } = useSendSummaryWindow();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("therapist_name, therapist_phone, bridge_last_state")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setTherapist({ name: data?.therapist_name ?? null, phone: data?.therapist_phone ?? null });
        setBridgeState(data?.bridge_last_state ?? null);
      });
  }, [user]);

  const isConcretized = bridgeState === "concretized";
  const hasPhone = !!therapist?.phone;
  const canSend = isConcretized && hasPhone && hasSession && inWindow;

  let gatingMsg: string | null = null;
  if (!windowLoading) {
    if (!isConcretized) gatingMsg = "Vas a poder enviar cuando concretes tu primera sesión.";
    else if (!hasPhone) gatingMsg = "Aún no tenemos el WhatsApp de tu profesional.";
    else if (!hasSession) gatingMsg = "Marcá tu próxima sesión en Mi Proceso para habilitar el envío 24 hs antes.";
    else if (!inWindow && nextSessionAt) {
      const now = Date.now();
      const nextTs = nextSessionAt.getTime();
      if (now < nextTs - 24 * 3600 * 1000) {
        gatingMsg = `El envío se habilita 24 hs antes de tu próxima sesión (${format(nextSessionAt, "EEE d MMM · HH:mm", { locale: es })}).`;
      } else {
        gatingMsg = "La sesión ya pasó. Agendá una nueva para volver a enviar.";
      }
    }
  }

  const logShare = async (channel: string) => {
    try {
      if (!user) return;
      await supabase.from("resmita_context_events").insert({
        user_id: user.id,
        event_type: "psico_summary_shared",
        payload: { channel } as any,
      });
    } catch { /* best-effort */ }
  };

  const firstName = (n: string | null) => (n ? n.trim().split(/\s+/)[0] : "");

  const send = () => {
    if (status !== "idle" || !canSend || !therapist?.phone) return;
    setStatus("sending");
    setTimeout(() => {
      const clean = therapist.phone!.replace(/[^\d]/g, "");
      const message = `Hola ${firstName(therapist.name) || "Doctor/a"}, te comparto el resumen de mi proceso psicológico para nuestra próxima sesión:\n\n${text}`;
      const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener");
      logShare("whatsapp");
      setStatus("sent");
      toast.success("Se abrió WhatsApp con tu resumen");
    }, 900);
  };

  const downloadCopy = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Resumen_${displayName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    logShare("download");
  };

  return (
    <div className="space-y-4 pb-32">
      <div className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,25,39,0.05)]">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="min-h-[340px] w-full resize-y rounded-2xl bg-transparent p-4 font-mono text-[11.5px] leading-relaxed text-[#0f172a] outline-none"
          spellCheck={false}
        />
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-3.5">
        <Shield size={16} className="mt-0.5 shrink-0 text-[#2563eb]" />
        <p className="text-[11.5px] leading-relaxed text-[#1e40af]">
          Al enviar, se abre WhatsApp con tu resumen prellenado para {firstName(therapist?.name ?? null) || "tu profesional"}. Vos elegís qué compartir.
        </p>
      </div>

      {gatingMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <CalendarClock size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <p className="text-[11.5px] leading-relaxed text-amber-900">{gatingMsg}</p>
        </div>
      )}

      <motion.button
        whileTap={{ scale: canSend && status === "idle" ? 0.98 : 1 }}
        onClick={send}
        disabled={!canSend || status !== "idle"}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-[13.5px] font-semibold text-white transition-colors ${
          status === "sent"
            ? "bg-emerald-500"
            : status === "sending"
            ? "bg-[#7cc2c8]/70"
            : canSend
              ? "bg-[#7cc2c8] shadow-[0_6px_20px_rgba(124,194,200,0.35)]"
              : "bg-slate-300 cursor-not-allowed"
        }`}
      >
        {status === "sent" ? (
          <><Check size={17} /> ¡Enviado con éxito!</>
        ) : status === "sending" ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />Enviando…</>
        ) : canSend ? (
          <><Send size={16} /> Enviar al profesional</>
        ) : (
          <><Lock size={15} /> Enviar al profesional</>
        )}
      </motion.button>

      <button
        onClick={downloadCopy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white py-3 text-[12.5px] font-semibold text-[#0f172a] active:scale-[0.99]"
      >
        <Download size={15} /> Descargar copia
      </button>
    </div>
  );
}
