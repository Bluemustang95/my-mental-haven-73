import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, ClipboardList, Users, LogOut, Sparkles, Brain, Terminal, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { title: "Usuarios", url: "/admin/pacientes", icon: Users },
  { title: "Psicoeducación", url: "/admin/contenido", icon: BookOpen },
  { title: "Actividades (IA)", url: "/admin/recursos", icon: Sparkles },
  { title: "Tests", url: "/admin/cuestionario", icon: Brain },
  { title: "Solicitudes", url: "/admin/solicitudes", icon: ClipboardList },
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
];

export function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url: string, end?: boolean) =>
    end ? location.pathname === url : location.pathname.startsWith(url);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0F172A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft size={14} />
          </button>
          <Terminal size={18} className="text-emerald-400" />
          <div className="flex-1">
            <p className="font-mono text-xs text-slate-400">RESMA Admin · v2.4.1</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-400/30">
            Modo Admin
          </span>
          <button
            onClick={signOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-red-400"
            aria-label="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 scrollbar-thin">
            {navItems.map((item) => {
              const active = isActive(item.url, item.end);
              return (
                <button
                  key={item.url}
                  onClick={() => navigate(item.url)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-white/5 bg-[#111c33] p-5 text-slate-200 [&_*]:!text-current">
          <div className="resma-admin-content text-slate-200">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
