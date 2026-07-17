import { motion } from "framer-motion";
import { CheckCircle2, Clock, Loader2, Mail, Phone, Search, Sparkles, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { BridgeState, TherapyStatus } from "@/hooks/useTherapyStatus";
import { ContactConfirmDialog } from "./ContactConfirmDialog";

const STEPS: { key: BridgeState; label: string; sub: string; Icon: any }[] = [
  { key: "searching",   label: "Buscando", sub: "Asignando profesional", Icon: Search },
  { key: "assigned",    label: "Asignado", sub: "Profesional encontrado", Icon: UserCheck },
  { key: "coordinating",label: "Coordinando", sub: "Contacto en curso", Icon: Phone },
  { key: "concretized", label: "En tratamiento", sub: "¡Listo!", Icon: Sparkles },
];

interface Props {
  phone: string;
  status: TherapyStatus | null;
  loading: boolean;
  onRefetch: () => void;
}

export function TherapyTrackingView({ phone, status, loading, onRefetch }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const state = status?.state ?? "searching";
  const stepIdx = useMemo(
    () => Math.max(0, STEPS.findIndex((s) => s.key === state)),
    [state],
  );
  const pro = status?.professional;
  const showProDetails = state === "coordinating" || state === "concretized";

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Tu seguimiento
          </h2>
          <p className="mt-1 text-sm text-foreground/65">
            {state === "searching" && "Estamos buscando el profesional ideal para vos."}
            {state === "assigned" && "¡Un profesional aceptó tu caso!"}
            {state === "coordinating" && "Tu profesional se va a contactar en las próximas 24 h hábiles."}
            {state === "concretized" && "Tratamiento activo. Buen camino."}
            {state === "failed" && "Tuvimos un problema. Escribinos."}
          </p>
        </div>
        {loading && <Loader2 size={18} className="animate-spin text-foreground/40" />}
      </div>

      {/* Tracker */}
      <div className="mt-6 space-y-3">
        {STEPS.map((s, i) => {
          const reached = i <= stepIdx;
          const current = i === stepIdx;
          const Icon = s.Icon;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                reached
                  ? "border-[#7cc2c8]/50 bg-[#7cc2c8]/10"
                  : "border-foreground/8 bg-white/50"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  reached ? "bg-[#101927] text-white" : "bg-foreground/5 text-foreground/40"
                }`}
              >
                {current ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                    <Icon size={18} />
                  </motion.div>
                ) : reached ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Icon size={18} />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${reached ? "text-foreground" : "text-foreground/45"}`}>
                  {s.label}
                </p>
                <p className="text-[11px] text-foreground/55">{s.sub}</p>
              </div>
              {current && (
                <span className="rounded-full bg-[#101927] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Ahora
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Pro details */}
      {state === "assigned" && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock size={16} />
            <p className="text-sm font-bold">El profesional se contactará en las próximas 24 h hábiles.</p>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="mt-3 w-full rounded-xl bg-[#101927] py-3 text-sm font-bold text-white transition active:scale-[0.98]"
          >
            ¿Ya te contactó?
          </button>
        </div>
      )}

      {showProDetails && pro && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Tu profesional
          </p>
          <p className="mt-1 font-display text-lg font-bold text-foreground">
            {pro.name ?? "—"}
          </p>
          {pro.license && <p className="text-xs text-foreground/60">{pro.license}</p>}
          <div className="mt-3 space-y-2 text-sm">
            {pro.phone && (
              <a href={`tel:${pro.phone}`} className="flex items-center gap-2 text-foreground">
                <Phone size={14} className="text-emerald-600" /> {pro.phone}
              </a>
            )}
            {pro.email && (
              <a href={`mailto:${pro.email}`} className="flex items-center gap-2 text-foreground">
                <Mail size={14} className="text-emerald-600" /> {pro.email}
              </a>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onRefetch}
        className="mt-4 w-full text-center text-xs font-semibold text-foreground/55"
      >
        Actualizar estado
      </button>

      <ContactConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
