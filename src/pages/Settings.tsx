import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Moon, Bell, LogOut, Trash2, User as UserIcon, BarChart3, Wrench, History, Crown, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { usePlan } from "@/hooks/usePlan";
import { IOSToggle } from "@/components/ui/IOSToggle";
import { PaywallModal } from "@/components/modals/PaywallModal";
import { ManageSubscriptionModal } from "@/components/modals/ManageSubscriptionModal";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { plan, planStartedAt } = usePlan();

  const [name, setName] = useState("");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notifications, setNotifications] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState<null | "manage" | "restore">(null);

  const isPremium = plan === "premium";
  const planLabel = isPremium ? "Plan Activo: Premium Semanal" : "Plan Activo: Gratis de Terapia";
  const planSub = isPremium && planStartedAt
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

  const toggleNotifs = (v: boolean) => {
    setNotifications(v);
    updateProfile({ notifications_on: v });
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

        {/* Easter egg admin */}
        <div className="px-5 pt-8">
          <button
            onClick={() => navigate("/admin")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#101927]/15 bg-transparent px-4 py-4 text-xs font-semibold uppercase tracking-widest text-[#101927]/55 transition active:bg-[#101927]/5"
          >
            <Wrench size={14} />
            Acceso Desarrollador / Admin
          </button>
          {!isAdmin && (
            <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
              Solo accesible con permisos.
            </p>
          )}
        </div>
      </div>
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
