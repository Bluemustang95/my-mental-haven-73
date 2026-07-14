import { Shield, Check, X, Eye, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Info mode: read-only, hides Activar/Cancelar and shows a Cerrar button */
  mode?: "consent" | "info";
  onConfirm?: () => void;
  onDecline?: () => void;
  /** For info mode: current sharing state to reflect what's actually happening */
  shareScreen?: boolean;
  shareSnapshot?: boolean;
};

export function ResmitaSnapshotConsentModal({
  open,
  onOpenChange,
  mode = "consent",
  onConfirm,
  onDecline,
  shareScreen = true,
  shareSnapshot = false,
}: Props) {
  const isInfo = mode === "info";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-[#f9f9fb] overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl"
          >
            <div className="bg-gradient-to-br from-[#7cc2c8]/30 to-white px-6 pt-6 pb-4 shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7cc2c8]/25">
                <Shield size={20} className="text-[#101927]" />
              </div>
              <div className="mt-3 space-y-1 text-left">
                <h2 className="font-display text-[18px] font-bold text-[#101927]">
                  {isInfo ? "Qué ve Resmita ahora" : "Compartir resumen de tu actividad"}
                </h2>
                <p className="text-[12.5px] leading-relaxed text-[#101927]/70">
                  {isInfo
                    ? "Podés cambiar esto en cualquier momento desde Ajustes → Privacidad de Resmita."
                    : "Resmita necesita tu permiso para ver un resumen mínimo y darte respuestas más útiles."}
                </p>
              </div>
            </div>

            <div className="px-6 pt-3 pb-2 space-y-3 overflow-y-auto">
              {isInfo && (
                <section className="space-y-1.5">
                  <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] ${shareScreen ? "bg-[#7cc2c8]/15 text-[#101927]" : "bg-[#f2f2f5] text-[#101927]/60"}`}>
                    {shareScreen ? <Eye size={14} /> : <Lock size={14} />}
                    <span className="font-semibold">Pantalla actual:</span>
                    <span>{shareScreen ? "Compartida" : "Oculta"}</span>
                  </div>
                  <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] ${shareSnapshot ? "bg-[#7cc2c8]/15 text-[#101927]" : "bg-[#f2f2f5] text-[#101927]/60"}`}>
                    {shareSnapshot ? <Eye size={14} /> : <Lock size={14} />}
                    <span className="font-semibold">Resumen de actividad:</span>
                    <span>{shareSnapshot ? "Compartido" : "Oculto"}</span>
                  </div>
                </section>
              )}

              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#101927]/50">Qué guardamos</p>
                <ul className="mt-1.5 space-y-1 text-[13px] text-[#101927]/85">
                  <li>• Tu último check-in (ánimo y sueño)</li>
                  <li>• Tendencia de ánimo de los últimos 7 días</li>
                  <li>• Racha de días activos</li>
                  <li>• Cantidad de medicaciones activas (no los nombres)</li>
                  <li>• Si tenés un registro CBT abierto</li>
                  <li>• Último resultado numérico de test</li>
                </ul>
              </section>

              <section className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#101927]/50">Qué NO guardamos</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#101927]/75">
                  El texto de tu diario, tus pensamientos completos, cartas, notas de sesión, plan de seguridad ni
                  nombres de medicaciones. Resmita no ve nada literal, solo metadatos agregados.
                </p>
              </section>

              <section className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="font-semibold text-[#101927]">Retención</p>
                  <p className="text-[#101927]/65">90 días para eventos de uso. El resumen se recalcula en vivo.</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="font-semibold text-[#101927]">Control</p>
                  <p className="text-[#101927]/65">Podés desactivarlo o borrar todo cuando quieras.</p>
                </div>
              </section>

              <p className="text-[10.5px] leading-relaxed text-[#101927]/50">
                Los datos viajan cifrados y solo se asocian a tu cuenta. El equipo clínico solo ve métricas
                agregadas y anónimas.
              </p>
            </div>

            <div className="flex gap-2 border-t border-[#101927]/5 bg-white px-6 py-4 shrink-0">
              {isInfo ? (
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[#101927] px-4 py-2.5 text-[13px] font-semibold text-white"
                >
                  Cerrar
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { onDecline?.(); onOpenChange(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[#f2f2f5] px-4 py-2.5 text-[13px] font-semibold text-[#101927]"
                  >
                    <X size={14} /> Cancelar
                  </button>
                  <button
                    onClick={() => { onConfirm?.(); onOpenChange(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[#101927] px-4 py-2.5 text-[13px] font-semibold text-white"
                  >
                    <Check size={14} /> Activar
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
