import { useState } from "react";
import { Send, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  proName: string | null;
  proPhone: string | null; // E.164 con "+"
}

function buildLink() {
  return `${window.location.origin}/mi-proceso/resumen`;
}

function firstName(name: string | null) {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] ?? "";
}

export function ShareSummaryCard({ proName, proPhone }: Props) {
  const [copied, setCopied] = useState(false);
  const link = buildLink();
  const message = `Hola ${firstName(proName) || "Doctor/a"}, te comparto el resumen de mi proceso psicológico para nuestra próxima sesión: ${link}`;

  const logShare = async (channel: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("resmita_context_events").insert({
        user_id: user.id,
        event_type: "psico_summary_shared",
        payload: { channel } as any,
      });
    } catch {
      // best-effort
    }
  };

  const handleWhatsApp = async () => {
    if (!proPhone) return;
    const clean = proPhone.replace(/[^\d]/g, "");
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
    logShare("whatsapp");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copiado");
      logShare("copy");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="rounded-[20px] border border-[#7cc2c8]/40 bg-gradient-to-br from-[#7cc2c8]/12 to-white/70 p-4 shadow-[0_8px_24px_-18px_rgba(16,25,39,0.22)] backdrop-blur-xl">
      <div className="flex items-start gap-2">
        <Send size={15} className="mt-0.5 shrink-0 text-[#0e8a92]" />
        <div className="flex-1">
          <p className="font-display text-[13px] font-bold text-[#0f172a]">Compartir Resumen Psico</p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#64748b]">
            Enviale a {firstName(proName) || "tu profesional"} un link con tu evolución antes de la sesión.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleWhatsApp}
          disabled={!proPhone}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-[12px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          <Send size={13} />
          Enviar por WhatsApp
        </button>
        <button
          onClick={handleCopy}
          aria-label="Copiar link"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] transition active:scale-[0.96]"
        >
          {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
