import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search, UserCheck, Clock, BadgeCheck, Phone, MessageCircle, FileText, NotebookPen, Pill, PartyPopper, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTherapyStatus, BridgeState } from "@/hooks/useTherapyStatus";
import { ContactConfirmDialog } from "@/components/modals/ContactConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NextSessionCard } from "./NextSessionCard";
import { ShareSummaryCard } from "./ShareSummaryCard";

interface Props {
  phone: string;
  initialState?: BridgeState | null;
  initialProName?: string | null;
  linkedLastName?: string | null;
}

export function TherapyMiniTracker({
  phone,
  initialState,
  initialProName,
  linkedLastName,
}: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: status, refetch } = useTherapyStatus(phone, { enabled: true });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [optimisticConfirmed, setOptimisticConfirmed] = useState(false);
  const [assignedAt, setAssignedAt] = useState<Date | null>(null);
  const [storedProName, setStoredProName] = useState<string | null>(null);
  const [storedPro, setStoredPro] = useState<{ phone?: string | null; email?: string | null; license?: string | null } | null>(null);

  const rawState: BridgeState = status?.state ?? initialState ?? "searching";
  const state: BridgeState = optimisticConfirmed && rawState === "assigned" ? "coordinating" : rawState;
  const pro = status?.professional;
  const proName = pro?.name ?? initialProName ?? storedProName ?? null;
  const proPhone = pro?.phone ?? storedPro?.phone ?? null;
  const specialty = (pro as any)?.specialty ?? null;
  const assigned = state === "assigned" || state === "coordinating" || state === "concretized";
  const contactConfirmed = state === "coordinating" || state === "concretized";
  const concretized = state === "concretized";
  const failed = state === "failed";

  // 24h gate para "¿Ya te contactó?"
  const hoursSinceAssigned = assignedAt ? (Date.now() - assignedAt.getTime()) / 3600000 : 0;
  const canConfirmContact = state === "assigned" && !!assignedAt && hoursSinceAssigned >= 24;
  const hoursRemaining = assignedAt ? Math.max(0, Math.ceil(24 - hoursSinceAssigned)) : 24;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("bridge_assigned_at, therapist_name, therapist_phone, therapist_email, therapist_license")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.bridge_assigned_at) setAssignedAt(new Date(data.bridge_assigned_at));
        if (data?.therapist_name) setStoredProName(data.therapist_name);
        if (data) setStoredPro({ phone: data.therapist_phone, email: data.therapist_email, license: data.therapist_license });
        if (assigned && !data?.bridge_assigned_at) {
          const nowIso = new Date().toISOString();
          setAssignedAt(new Date(nowIso));
          supabase
            .from("patient_app_profiles")
            .update({
              bridge_assigned_at: nowIso,
              bridge_last_state: rawState,
              therapist_name: proName,
              therapist_phone: pro?.phone ?? null,
              therapist_email: pro?.email ?? null,
              therapist_license: pro?.license ?? null,
            })
            .eq("user_id", user.id);
        }
      });
  }, [assigned, user, proName, pro?.phone, pro?.email, pro?.license, rawState]);

  // Barra de progreso: 0 → assigned → coordinating → concretized
  const progress1 = assigned ? 100 : 0;
  const progress2 = concretized ? 100 : contactConfirmed ? 50 : 0;

  return (
    <div className="space-y-2.5">
      {/* Tracker: 3 esferas */}
      <div className="rounded-[20px] border border-white/70 bg-white/85 p-4 shadow-[0_8px_24px_-18px_rgba(16,25,39,0.22)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-1">
          <Sphere
            label="Buscando"
            sub={assigned ? "Listo" : "Asignando"}
            Icon={Search}
            active={state === "searching"}
            done={assigned}
          />
          <Bar progress={progress1} />
          <Sphere
            label="Asignado"
            sub={contactConfirmed ? "Confirmado" : assigned ? "En espera" : "—"}
            Icon={UserCheck}
            active={state === "assigned" || state === "coordinating"}
            done={concretized}
          />
          <Bar progress={progress2} />
          <Sphere
            label="Concretado"
            sub={concretized ? "¡Listo!" : "—"}
            Icon={PartyPopper}
            active={concretized}
            done={false}
          />
        </div>
      </div>

      {failed && (
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 p-3.5">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-700" />
            <p className="text-[12px] leading-snug text-rose-900">
              Hubo un problema con tu derivación. Escribinos por WhatsApp para reactivarla.
            </p>
          </div>
        </div>
      )}

      {/* Aviso azul: asignado, esperando 24 hs */}
      {state === "assigned" && !canConfirmContact && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[18px] border border-[#bae6fd] bg-[#f0f9ff] p-3.5"
        >
          <div className="flex items-start gap-2">
            <Clock size={15} className="mt-0.5 shrink-0 text-[#0369a1]" />
            <p className="text-[12px] leading-snug text-[#0c4a6e]">
              <span className="font-bold">{proName ?? "Tu profesional"}</span> aceptó tu caso y se contactará en las próximas <span className="font-bold">24 hs hábiles</span>.
              {assignedAt && (
                <span className="mt-1 block text-[11px] font-medium text-[#0369a1]">
                  Podrás confirmar el contacto en ~{hoursRemaining} h.
                </span>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Aviso amarillo: pasaron 24 hs */}
      {canConfirmContact && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[18px] border border-amber-200 bg-amber-50 p-3.5"
        >
          <div className="flex items-start gap-2">
            <Clock size={15} className="mt-0.5 shrink-0 text-amber-700" />
            <p className="text-[12px] leading-snug text-amber-900">
              Ya pasaron 24 hs desde la asignación. ¿<span className="font-bold">{proName ?? "Tu profesional"}</span> se contactó con vos?
            </p>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="mt-3 w-full rounded-xl bg-[#101927] py-2.5 text-[12px] font-bold text-white transition active:scale-[0.98]"
          >
            ¿Ya te contactó?
          </button>
        </motion.div>
      )}

      {/* Tarjeta del profesional (coordinating y concretized) */}
      {contactConfirmed && (
        <ProfessionalCard
          proName={proName ?? "Tu profesional"}
          license={pro?.license ?? storedPro?.license ?? null}
          phone={proPhone}
          specialty={specialty}
          linkedLastName={linkedLastName}
          concretized={concretized}
        />
      )}

      {/* Compartir Resumen Psico — solo en concretized */}
      {concretized && (
        <ShareSummaryCard proName={proName} proPhone={proPhone} />
      )}

      {/* Bento 2x2: Próxima sesión / Medicación / Notas de Sesión / Resumen Psico */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <NextSessionCard />
        <MiniBento icon={<Pill size={26} strokeWidth={2} className="text-[#7cc2c8]" />} bg="#101927" textColor="#ffffff" title="Medicación" onClick={() => navigate("/mi-proceso/medicacion")} />
        <MiniBento icon={<NotebookPen size={26} strokeWidth={2} className="text-white" />} bg="#7c3aed" textColor="#ffffff" title="Notas de Sesión" onClick={() => navigate("/mi-proceso/terapia")} />
        <MiniBento icon={<FileText size={26} strokeWidth={2} className="text-[#101927]" />} bg="#facb60" textColor="#101927" title="Resumen Psico" onClick={() => navigate("/mi-proceso/resumen")} />
      </div>

      <ContactConfirmDialog
        open={confirmOpen}
        phone={phone}
        onClose={() => setConfirmOpen(false)}
        onConfirmed={() => {
          setOptimisticConfirmed(true);
          refetch();
        }}
      />
    </div>
  );
}

function Sphere({ label, sub, Icon, active, done }: { label: string; sub: string; Icon: any; active: boolean; done: boolean }) {
  return (
    <div className="flex w-[76px] flex-col items-center gap-1">
      <motion.div
        animate={active ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 2, repeat: active ? Infinity : 0 }}
        className={`flex h-11 w-11 items-center justify-center rounded-full ${
          active
            ? "bg-gradient-to-br from-[#101927] to-[#0e8a92] text-white shadow-[0_6px_16px_-6px_rgba(14,138,146,0.5)]"
            : done
              ? "bg-[#7cc2c8]/30 text-[#0e8a92]"
              : "bg-[#f1f5f9] text-[#94a3b8]"
        }`}
      >
        {done ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
      </motion.div>
      <p className={`font-display text-[10.5px] font-bold ${active || done ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>
        {label}
      </p>
      <p className="text-[9px] text-[#94a3b8]">{sub}</p>
    </div>
  );
}

function Bar({ progress }: { progress: number }) {
  return (
    <div className="relative h-px flex-1 bg-[#e2e8f0]">
      <motion.div
        className="absolute inset-y-0 left-0 bg-[#0e8a92]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.6 }}
      />
    </div>
  );
}

function ProfessionalCard({
  proName, license, phone, specialty, linkedLastName, concretized,
}: {
  proName: string; license: string | null; phone: string | null; specialty: string | null;
  linkedLastName?: string | null; concretized: boolean;
}) {
  const initials = proName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="rounded-[20px] border border-white/70 bg-white/85 p-3.5 shadow-[0_8px_24px_-18px_rgba(16,25,39,0.22)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#101927] to-[#0e8a92] font-display text-[13px] font-bold text-white">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-display text-[13px] font-bold text-[#0f172a]">{proName}</p>
            <BadgeCheck size={13} className="shrink-0 text-[#7cc2c8]" />
          </div>
          <p className="text-[10.5px] text-[#64748b]">
            {license ? `M.N. ${license} · ` : ""}{specialty ?? "Especialista Clínico"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${concretized ? "bg-emerald-100 text-emerald-700" : "bg-[#e0f2fe] text-[#0369a1]"}`}>
          {concretized ? "Concretado" : "Contactado"}
        </span>
      </div>

      {phone && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white py-2 text-[12px] font-semibold text-[#0f172a] transition active:scale-[0.98]"
          >
            <Phone size={13} /> Llamar
          </a>
          <a
            href={`https://wa.me/${phone.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2 text-[12px] font-bold text-white transition active:scale-[0.98]"
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
        </div>
      )}

      {linkedLastName && (
        <p className="mt-2.5 border-t border-[#e2e8f0] pt-2 text-[10.5px] text-[#64748b]">
          Vinculado a paciente <span className="font-semibold text-[#0f172a]">{linkedLastName}</span>
        </p>
      )}
    </div>
  );
}

function MiniBento({ icon, bg, textColor, title, onClick }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-[22px] p-3 text-center"
      style={{ background: bg }}
    >
      {icon}
      <p className="font-display text-[13px] font-bold leading-tight" style={{ color: textColor }}>{title}</p>
    </motion.button>
  );
}
