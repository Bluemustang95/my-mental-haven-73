import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Send, Check, Download } from "lucide-react";
import { toast } from "sonner";

export function ReportEditor({
  initialText,
  displayName,
}: {
  initialText: string;
  displayName: string;
}) {
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const send = () => {
    if (status !== "idle") return;
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
      toast.success("Enviado al profesional");
    }, 1500);
  };

  const downloadCopy = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Resumen_${displayName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-32">
      <div className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,25,39,0.05)]">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="min-h-[400px] w-full resize-y rounded-2xl bg-transparent p-4 font-mono text-[11.5px] leading-relaxed text-[#0f172a] outline-none"
          spellCheck={false}
        />
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-3.5">
        <Shield size={16} className="mt-0.5 shrink-0 text-[#2563eb]" />
        <p className="text-[11.5px] leading-relaxed text-[#1e40af]">
          Al presionar enviar, el documento se cifra de extremo a extremo. Solo tu profesional podrá leerlo.
        </p>
      </div>

      <button
        onClick={downloadCopy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white py-3 text-[12.5px] font-semibold text-[#0f172a] active:scale-[0.99]"
      >
        <Download size={15} /> Descargar copia
      </button>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-5 pb-6 pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <motion.button
            whileTap={{ scale: status === "idle" ? 0.98 : 1 }}
            onClick={send}
            disabled={status !== "idle"}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-[13.5px] font-semibold text-white transition-colors ${
              status === "sent"
                ? "bg-emerald-500"
                : status === "sending"
                ? "bg-[#7cc2c8]/70"
                : "bg-[#7cc2c8] shadow-[0_6px_20px_rgba(124,194,200,0.35)]"
            }`}
          >
            {status === "sent" ? (
              <>
                <Check size={17} /> ¡Enviado con éxito!
              </>
            ) : status === "sending" ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                Enviando…
              </>
            ) : (
              <>
                <Send size={16} /> Enviar al profesional
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
