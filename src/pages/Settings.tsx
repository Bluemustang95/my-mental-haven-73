import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Moon, Bell, LogOut, Trash2, User as UserIcon, BarChart3, Wrench, History, Crown, RefreshCw, Sparkles, Fingerprint, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { usePlan } from "@/hooks/usePlan";
import { IOSToggle } from "@/components/ui/IOSToggle";
import { PaywallModal } from "@/components/modals/PaywallModal";
import { ManageSubscriptionModal } from "@/components/modals/ManageSubscriptionModal";
import { toast } from "sonner";
import { isBiometricSupported, isBiometricEnabled, enrollBiometric, disableBiometric } from "@/lib/biometricAuth";
import { isPushSupported, currentPermission, requestPermissionAndRegister, disablePush } from "@/lib/pushNotifications";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { plan, planStartedAt, isAdmin: isAdminPlan } = usePlan();

  const [name, setName] = useState("");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notifications, setNotifications] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState<null | "manage" | "restore">(null);
  const [bioOn, setBioOn] = useState(false);
  const bioSupported = isBiometricSupported();

  const adminFlag = isAdmin || isAdminPlan;

  const isPremium = plan === "premium" || adminFlag;
  const planLabel = adminFlag
    ? "Plan Activo: Admin (Premium)"
    : isPremium
      ? "Plan Activo: Premium Semanal"
      : "Plan Activo: Gratis de Terapia";
  const planSub = adminFlag
    ? "Acceso completo sin restricciones como administrador."
    : isPremium && planStartedAt
      ? `Renueva semanalmente · activo desde ${new Date(planStartedAt).toLocaleDateString("es-AR")}`
      : "Acceso completo a Terapia y Seguimiento.";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("display_name, prefers_dark, notifications_on")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.display_name || user.email?.split("@")[0] || "");
        if (data?.prefers_dark != null) setDark(!!data.prefers_dark);
        if (data?.notifications_on != null) setNotifications(!!data.notifications_on);
      });
  }, [user]);
  useEffect(() => { setBioOn(isBiometricEnabled()); }, []);

  const toggleBio = async (v: boolean) => {
    if (!v) { disableBiometric(); setBioOn(false); toast("Acceso biométrico desactivado"); return; }
    if (!user) return;
    const ok = await enrollBiometric(user.id, name || user.email || "RESMA");
    if (ok) { setBioOn(true); toast.success("Acceso biométrico activado"); }
    else toast.error("No pudimos activar el biométrico");
  };


  const updateProfile = async (patch: any) => {
    if (!user) return;
    await supabase
      .from("patient_app_profiles")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
  };

  const toggleDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    updateProfile({ prefers_dark: v });
  };

  const toggleNotifs = async (v: boolean) => {
    if (v) {
      if (!isPushSupported()) {
        toast.error("Tu navegador no soporta notificaciones push.");
        return;
      }
      const ok = await requestPermissionAndRegister();
      if (!ok) return;
      setNotifications(true);
      updateProfile({ notifications_on: true });
      toast.success("Notificaciones activadas");
    } else {
      await disablePush();
      setNotifications(false);
      updateProfile({ notifications_on: false });
      toast("Notificaciones desactivadas");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/onboarding");
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar cuenta? Esta acción no se puede deshacer.")) return;
    toast.error("Contactá soporte para eliminar definitivamente tu cuenta.");
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-32">
      <div className="mx-auto max-w-md">
        <div className="flex items-center px-4 pt-12 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="-ml-2 flex h-9 w-9 items-center justify-center text-accent"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Mi cuenta</p>
          </div>
          <div className="w-9" />
        </div>

        <div className="px-5 pb-4">
          <h1 className="font-display text-3xl font-bold text-[#101927]">
            {name || "Mi perfil"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Mi cuenta */}
        <Group label="Mi Cuenta">
          <Row
            icon={<UserIcon size={18} />}
            label="Información personal"
            onClick={() => navigate("/perfil")}
          />
          <Row
            icon={<History size={18} />}
            label="Historial de actividad"
            onClick={() => navigate("/configuracion/historial")}
          />
          <Row
            icon={<BarChart3 size={18} />}
            label="Estadísticas"
            onClick={() => navigate("/mi-proceso")}
          />
        </Group>

        {/* Suscripción */}
        <div className="mt-6 px-3">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Suscripción
          </p>
          <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_8px_24px_-14px_rgba(16,25,39,0.18)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#facb60]/25 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${isPremium ? "bg-[#facb60]/30 text-[#101927]" : "bg-foreground/[0.06] text-foreground/70"}`}>
                  <Crown size={18} />
                </span>
                <div className="flex-1">
                  <p className="font-display text-[15px] font-bold text-foreground">{planLabel}</p>
                  <p className="text-[11px] text-muted-foreground">{planSub}</p>
                </div>
              </div>

              {!isPremium && (
                <button
                  onClick={() => setPaywallOpen(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-3.5 text-sm font-bold text-white transition active:scale-[0.98]"
                >
                  <Sparkles size={16} />
                  Activar Premium — USD 0.99/sem
                </button>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-foreground/55">
                Tu facturación y suscripción a RESMA Premium están gestionadas de forma segura y
                directa a través de tu cuenta de Apple App Store o Google Play Store.
              </p>

              <button
                onClick={() => setManageOpen("manage")}
                className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-left shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] backdrop-blur transition active:scale-[0.99]"
              >
                <span className="text-[13px] font-semibold text-foreground">
                  Gestionar Suscripción en el Sistema
                </span>
                <ChevronRight size={16} className="text-foreground/40" />
              </button>

              <button
                onClick={() => setManageOpen("restore")}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12px] font-semibold text-foreground/65 transition active:bg-foreground/[0.04]"
              >
                <RefreshCw size={13} />
                Restaurar Compras
              </button>
            </div>
          </div>
        </div>


        {/* Preferencias */}
        <Group label="Preferencias">
          <RowToggle
            icon={<Moon size={18} />}
            label="Tema oscuro"
            checked={dark}
            onChange={toggleDark}
          />
          <RowToggle
            icon={<Bell size={18} />}
            label="Notificaciones"
            checked={notifications}
            onChange={toggleNotifs}
          />
          {bioSupported && (
            <RowToggle
              icon={<Fingerprint size={18} />}
              label="Acceso con Face ID / huella"
              checked={bioOn}
              onChange={toggleBio}
            />
          )}
        </Group>

        {/* Seguridad */}
        <Group label="Seguridad">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-between px-4 py-3.5 active:bg-black/[0.03]"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} className="text-[#FF3B30]" />
              <span className="text-[15px] font-medium text-[#FF3B30]">Cerrar sesión</span>
            </div>
          </button>
          <div className="ml-12 h-px bg-black/[0.06]" />
          <button
            onClick={handleDelete}
            className="flex w-full items-center justify-between px-4 py-3.5 active:bg-black/[0.03]"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-[#B91C1C]" />
              <span className="text-[15px] font-medium text-[#B91C1C]">Eliminar cuenta</span>
            </div>
          </button>
        </Group>

        {/* Admin access — only visible for real admins */}
        {isAdmin && (
          <div className="px-5 pt-8">
            <button
              onClick={() => navigate("/admin")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#101927]/15 bg-transparent px-4 py-4 text-xs font-semibold uppercase tracking-widest text-[#101927]/55 transition active:bg-[#101927]/5"
            >
              <Wrench size={14} />
              Acceso Desarrollador / Admin
            </button>
          </div>
        )}
      </div>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
      <ManageSubscriptionModal
        open={manageOpen !== null}
        variant={manageOpen ?? "manage"}
        onClose={() => setManageOpen(null)}
      />
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mx-3 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <>
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between px-4 py-3.5 active:bg-black/[0.03]"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#101927]/70">{icon}</span>
          <span className="text-[15px] font-medium text-[#101927]">{label}</span>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>
      <div className="ml-12 h-px bg-black/[0.06] last:hidden" />
    </>
  );
}

function RowToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[#101927]/70">{icon}</span>
          <span className="text-[15px] font-medium text-[#101927]">{label}</span>
        </div>
        <IOSToggle checked={checked} onChange={onChange} label={label} />
      </div>
      <div className="ml-12 h-px bg-black/[0.06] last:hidden" />
    </>
  );
}
