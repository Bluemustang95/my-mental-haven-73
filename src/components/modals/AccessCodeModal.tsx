import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AccessCodeModal({ open, onClose, onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = usePlan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-access-code", {
        body: { code: code.trim() },
      });
      if (error || !data?.ok) {
        toast.error("Código inválido");
        setLoading(false);
        return;
      }
      if (data.kind === "admin") {
        toast.success("Acceso admin activado · Premium permanente");
      } else {
        toast.success("Acceso tester activado · Premium por 30 días");
      }
      await refresh();
      setCode("");
      onSuccess?.();
      onClose();
      // Refresh role-aware UI
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("Error al validar el código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground/50 hover:bg-black/5"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101927]/5 text-[#101927]">
              <KeyRound size={20} />
            </div>

            <h2 className="font-display text-xl font-bold text-foreground">Ingresar código de acceso</h2>
            <p className="mt-1 text-[12.5px] text-foreground/60">
              Si tenés un código de admin o tester, ingresalo acá para activar Premium.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="RESMA-XXXX-XXXX"
                autoFocus
                className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-center font-mono text-sm font-semibold tracking-wider text-foreground placeholder:text-foreground/30 focus:border-[#7cc2c8] focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Validando…" : "Activar"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
