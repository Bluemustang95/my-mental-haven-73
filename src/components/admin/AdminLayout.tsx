import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, Brain, Sparkles, Wind, Palette, Activity,
  TrendingUp, BookOpen, Zap, Bell, ChevronDown, LogOut, ShieldCheck, Plus,
  ClipboardList, Star, LifeBuoy, Globe2, NotebookPen, Settings2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type NavSection = {
  id: string;
  label: string;
  items: { title: string; url: string; icon: any }[];
};

const SECTIONS: NavSection[] = [
  {
    id: "principal",
    label: "Principal",
    items: [
      { title: "Dashboard Global", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "General", url: "/admin/general", icon: Settings2 },
      { title: "Estadísticas", url: "/admin/estadisticas-bienestar", icon: TrendingUp },
    ],
  },

  {
    id: "pacientes",
    label: "Pacientes",
    items: [
      { title: "CRM Pacientes", url: "/admin/pacientes", icon: Users },
      { title: "Solicitudes tratamiento", url: "/admin/solicitudes", icon: ClipboardList },
      { title: "Reseñas", url: "/admin/resenas", icon: Star },
      { title: "Líneas de crisis", url: "/admin/lineas-crisis", icon: LifeBuoy },
      { title: "Vista por país", url: "/admin/vista-pais", icon: Globe2 },
    ],
  },
  {
    id: "recursos",
    label: "Recursos Clínicos",
    items: [
      { title: "Diario", url: "/admin/diario", icon: NotebookPen },
      { title: "Pensamientos Auto.", url: "/admin/pensamientos", icon: Brain },
      { title: "Regulación DBT", url: "/admin/regulacion", icon: Sparkles },
      { title: "Mindfulness & Resp.", url: "/admin/mindfulness", icon: Wind },
      { title: "Escáner Corporal", url: "/admin/escaner", icon: Palette },
      { title: "Gestión de Hábitos", url: "/admin/habitos", icon: Activity },
    ],
  },
  {
    id: "monitoreo",
    label: "Monitoreo y Evolución",
    items: [
      { title: "Progreso y Psicometría", url: "/admin/progreso", icon: TrendingUp },
      { title: "Algoritmo onboarding", url: "/admin/onboarding", icon: ShieldCheck },
      { title: "Inteligencia Artificial", url: "/admin/ia", icon: Sparkles },
    ],
  },
  {
    id: "cms",
    label: "Librería CMS",
    items: [
      { title: "Psicoeducación", url: "/admin/contenido", icon: BookOpen },
      { title: "Frases y Noticias", url: "/admin/contenido-diario", icon: Sparkles },
      { title: "Pack de Actividades", url: "/admin/pack", icon: Zap },
    ],
  },
  {
    id: "comms",
    label: "Comunicaciones",
    items: [
      { title: "Notificaciones", url: "/admin/notificaciones", icon: Bell },
    ],
  },
];

export function AdminLayout() {
  const { signOut, user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState<Record<string, boolean>>({
    principal: true, pacientes: true, recursos: true, monitoreo: true, cms: true, comms: true,
  });

  return (
    <div className="resma-admin-shell h-screen w-screen overflow-hidden bg-[#f4f7f9] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-resma-navy text-slate-300 flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-white/5">
          <div className="h-9 w-9 rounded-xl bg-resma-teal/20 text-resma-teal flex items-center justify-center font-bold text-base">R</div>
          <div className="font-semibold text-white text-[15px] tracking-tight">RESMA</div>
          <Plus size={16} className="text-resma-teal" />
        </div>

        {/* Nav scroll */}
        <nav className="admin-scroll flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {SECTIONS.map((sec) => {
            const isOpen = open[sec.id];
            return (
              <div key={sec.id}>
                <button
                  onClick={() => setOpen((s) => ({ ...s, [sec.id]: !s[sec.id] }))}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-admin-label text-slate-400 hover:text-slate-200 transition"
                >
                  {sec.label}
                  <ChevronDown size={12} className={`transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-0.5">
                    {sec.items.map((it) => (
                      <NavLink
                        key={it.url}
                        to={it.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border-l-2 ${
                            isActive
                              ? "bg-resma-teal/10 text-resma-teal border-resma-teal"
                              : "text-slate-300 border-transparent hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        <it.icon size={16} />
                        {it.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">Admin RESMA</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck size={10} /> Coordinación Clínica
            </div>
          </div>
          <button onClick={() => signOut().then(() => navigate("/auth"))}
                  className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition flex items-center justify-center"
                  aria-label="Cerrar sesión">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Workspace */}
      <main className="flex-1 h-full overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
