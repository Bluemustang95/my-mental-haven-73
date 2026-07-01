import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search, UserCheck, Clock, BadgeCheck, Phone, UserPlus, FileText, NotebookPen, Pill } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTherapyStatus, BridgeState } from "@/hooks/useTherapyStatus";
import { ContactConfirmDialog } from "@/components/modals/ContactConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NextSessionCard } from "./NextSessionCard";

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
  const state: BridgeState = optimisticConfirmed && (rawState === "assigned" || rawState === "coordinating") ? "coordinating" : rawState;
  const pro = status?.professional;
  const proName = pro?.name ?? initialProName ?? storedProName ?? null;
  const assigned = state === "assigned" || state === "coordinating" || state === "concretized";
  const contactConfirmed = state === "coordinating" || state === "concretized";

  // 24h gate: only allow "¿Ya te contactó?" once 24h passed since assignment
  const hoursSinceAssigned = assignedAt ? (Date.now() - assignedAt.getTime()) / 3600000 : 0;
  const canConfirmContact = assigned && !contactConfirmed && !!assignedAt && hoursSinceAssigned >= 24;
  const hoursRemaining = assignedAt ? Math.max(0, Math.ceil(24 - hoursSinceAssigned)) : 24;

  // Load assigned_at + persisted pro info; persist first time we see assigned
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

  // Once contact is confirmed → render full professional card (with bento)
  if (contactConfirmed && assigned) {
    return (
      <FullProfessionalCard
        proName={proName ?? "Tu profesional"}
        license={pro?.license ?? storedPro?.license ?? null}
        phone={pro?.phone ?? storedPro?.phone ?? null}
        email={pro?.email ?? storedPro?.email ?? null}
        linkedLastName={linkedLastName}
        onAdd={() => navigate("/configuracion")}
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Mini tracker: 2 spheres */}
      <div className="rounded-[20px] border border-white/70 bg-white/85 p-4 shadow-[0_8px_24px_-18px_rgba(16,25,39,0.22)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <Sphere
            label="Buscando"
            sub="Asignando"
            Icon={Search}
            active={!assigned}
            done={assigned}
          />
          <div className="relative h-px flex-1 bg-[#e2e8f0]">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#0e8a92]"
              initial={{ width: 0 }}
              animate={{ width: assigned ? "100%" : "0%" }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <Sphere
            label="Asignado"
            sub={assigned ? "Listo" : "En espera"}
            Icon={UserCheck}
            active={assigned}
            done={false}
          />
        </div>
      </div>

      {/* Aviso: asignado, esperando 24 hs */}
      {assigned && !canConfirmContact && (
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

      {/* Aviso amarillo: ya pasaron 24 hs, pedimos confirmación */}
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

      {!assigned && (
        <p className="px-1 text-[11px] leading-snug text-[#64748b]">
          Estamos buscando un profesional ideal para vos. Te avisamos apenas se asigne.
        </p>
      )}

      {/* Acceso a herramientas siempre disponible cuando el toggle está activo */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <NextSessionCard />
        <MiniBento icon={<FileText size={15} className="text-[#b45309]" />} iconBg="bg-[#facb60]/20" title="Resumen Psico" sub="Reportes y hábitos." onClick={() => navigate("/mi-proceso/resumen")} />
        <MiniBento icon={<NotebookPen size={15} className="text-[#7c3aed]" />} iconBg="bg-[#7c3aed]/12" title="Notas de Sesión" sub="Temas y dudas." onClick={() => navigate("/mi-proceso/terapia")} />
        <MiniBento icon={<Pill size={15} className="text-[#0e8a92]" />} iconBg="bg-[#7cc2c8]/15" title="Medicación" sub="Próxima toma: Al día" onClick={() => navigate("/mi-proceso/medicacion")} />
      </div>

      <ContactConfirmDialog
        open={confirmOpen}
        phone={phone}
        onClose={() => setConfirmOpen(false)}
        onConfirmed={() => {
          refetch();
        }}
      />
    </div>
  );
}

function Sphere({
  label, sub, Icon, active, done,
}: { label: string; sub: string; Icon: any; active: boolean; done: boolean }) {
  return (
    <div className="flex w-[88px] flex-col items-center gap-1">
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
      <p className={`font-display text-[11px] font-bold ${active || done ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>
        {label}
      </p>
      <p className="text-[9.5px] text-[#94a3b8]">{sub}</p>
    </div>
  );
}

function FullProfessionalCard({
  proName, license, phone, email, linkedLastName, onAdd,
}: {
  proName: string; license: string | null; phone: string | null; email: string | null;
  linkedLastName?: string | null; onAdd: () => void;
}) {
  const initials = proName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const navigate = useNavigate();
  return (
    <div className="space-y-2.5">
      <div className="rounded-[20px] border border-white/70 bg-white/85 p-3.5 shadow-[0_8px_24px_-18px_rgba(16,25,39,0.22)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#101927] to-[#0e8a92] font-display text-[13px] font-bold text-white">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-display text-[13px] font-bold text-[#0f172a]">{proName}</p>
              <BadgeCheck size={13} className="shrink-0 text-[#7cc2c8]" />
            </div>
            <p className="text-[10.5px] text-[#64748b]">
              {license ? `M.N. ${license} · ` : ""}Especialista Clínico
            </p>
          </div>
          {phone ? (
            <a href={`tel:${phone}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101927] text-white">
              <Phone size={14} />
            </a>
          ) : (
            <button onClick={onAdd} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101927]/10 text-[#101927]/70">
              <UserPlus size={14} />
            </button>
          )}
        </div>
        {linkedLastName && (
          <p className="mt-2.5 border-t border-[#e2e8f0] pt-2 text-[10.5px] text-[#64748b]">
            Vinculado a paciente <span className="font-semibold text-[#0f172a]">{linkedLastName}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <NextSessionCard />
        <MiniBento icon={<FileText size={15} className="text-[#b45309]" />} iconBg="bg-[#facb60]/20" title="Resumen Psico" sub="Reportes y hábitos." onClick={() => navigate("/mi-proceso/resumen")} />
        <MiniBento icon={<NotebookPen size={15} className="text-[#7c3aed]" />} iconBg="bg-[#7c3aed]/12" title="Notas de Sesión" sub="Temas y dudas." onClick={() => navigate("/mi-proceso/terapia")} />
        <MiniBento icon={<Pill size={15} className="text-[#0e8a92]" />} iconBg="bg-[#7cc2c8]/15" title="Medicación" sub="Próxima toma: Al día" onClick={() => navigate("/mi-proceso/medicacion")} />
      </div>
    </div>
  );
}

function MiniBento({ icon, iconBg, title, sub, onClick }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-[18px] border border-white/70 bg-white/80 p-3 text-left shadow-[0_6px_20px_-16px_rgba(16,25,39,0.22)] backdrop-blur-xl"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
      <div>
        <p className="font-display text-[12.5px] font-bold leading-tight text-[#0f172a]">{title}</p>
        <p className="mt-0.5 text-[10.5px] leading-snug text-[#64748b]">{sub}</p>
      </div>
    </motion.button>
  );
}
