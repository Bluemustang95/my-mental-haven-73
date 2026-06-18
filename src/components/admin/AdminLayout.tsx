import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, ClipboardList, Users, LogOut, Sparkles, Brain, ArrowLeft, ShieldCheck, Settings, Zap, BarChart3, Wind } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { title: "Usuarios", url: "/admin/pacientes", icon: Users },
  { title: "Estadísticas", url: "/admin/estadisticas", icon: BarChart3 },
  { title: "Psicoeducación", url: "/admin/contenido", icon: BookOpen },
  { title: "Recursos", url: "/admin/recursos", icon: Sparkles },
  { title: "Pack de Actividades", url: "/admin/pack", icon: Zap },
  { title: "Mindfulness", url: "/admin/mindfulness", icon: Wind },
  { title: "Tests", url: "/admin/cuestionario", icon: Brain },
  { title: "Solicitudes", url: "/admin/solicitudes", icon: ClipboardList },
  { title: "Configuración", url: "/admin/configuracion", icon: Settings },
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
];

export function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url: string, end?: boolean) =>
    end ? location.pathname === url : location.pathname.startsWith(url);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fdfbfb] to-[#ebedee] text-slate-800">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full bg-[#6B4EFF]/10 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#E8A365]/15 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/60 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(107,78,255,0.18)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-slate-600 shadow-sm transition hover:bg-white"
            aria-label="Volver"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6B4EFF]/10 text-[#6B4EFF]">
            <ShieldCheck size={16} />
          </div>
          <div className="flex-1">
            <p className="font-display text-sm font-semibold text-slate-800">RESMA Admin</p>
            <p className="text-[10px] text-slate-500">Panel de control</p>
          </div>
          <span className="rounded-full bg-[#E8A365]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#B5701F] ring-1 ring-[#E8A365]/40">
            Modo Admin
          </span>
          <button
            onClick={signOut}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-rose-500"
            aria-label="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-t border-white/40">
          <div className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-3 py-2 scrollbar-thin">
            {navItems.map((item) => {
              const active = isActive(item.url, item.end);
              return (
                <button
                  key={item.url}
                  onClick={() => navigate(item.url)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-[#6B4EFF] text-white shadow-[0_8px_20px_-8px_rgba(107,78,255,0.55)]"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                  }`}
                >
                  <item.icon size={14} />
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-3xl border border-white/50 bg-white/60 p-6 text-slate-800 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          <div className="resma-admin-content">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
