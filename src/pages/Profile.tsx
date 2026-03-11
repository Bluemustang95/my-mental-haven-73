import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, SignOut, Stethoscope, Gear, Bell, Link as LinkIcon, UserCircle, Lifebuoy, Phone, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const emergencyLines = [
  { label: "Centro de Asistencia al Suicida", number: "135" },
  { label: "Línea contra la Violencia", number: "137" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [crisisOpen, setCrisisOpen] = useState(false);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      {/* User info */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
          <UserCircle size={32} weight="duotone" className="text-accent-foreground" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold">
            {user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Mi Perfil"}
          </h1>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="mb-6 h-px bg-border" />

      {/* Settings */}
      <div className="space-y-3">
        <button onClick={toggleDark} className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4">
          {darkMode ? <Moon size={20} weight="duotone" /> : <Sun size={20} weight="duotone" />}
          <span className="flex-1 text-left font-display text-sm font-medium">
            {darkMode ? "Modo oscuro" : "Modo claro"}
          </span>
          <div className={`h-6 w-11 rounded-full transition-colors ${darkMode ? "bg-accent" : "bg-muted"} relative`}>
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </button>

        <button onClick={() => navigate("/vincular")} className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left">
          <LinkIcon size={20} weight="duotone" />
          <div className="flex-1">
            <p className="font-display text-sm font-medium">Vincular profesional</p>
            <p className="text-xs text-muted-foreground">Conectá con tu terapeuta RESMA</p>
          </div>
        </button>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Bell size={20} weight="duotone" />
          <span className="flex-1 font-display text-sm font-medium">Notificaciones</span>
          <span className="text-xs text-muted-foreground">Próximamente</span>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Gear size={20} weight="duotone" />
          <span className="flex-1 font-display text-sm font-medium">Preferencias</span>
          <span className="text-xs text-muted-foreground">Próximamente</span>
        </div>
      </div>

      <div className="my-6 h-px bg-border" />

      {/* Treatment request */}
      <button
        onClick={() => navigate("/tratamiento")}
        className="flex w-full items-center gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left"
      >
        <Stethoscope size={20} className="text-accent" weight="duotone" />
        <div className="flex-1">
          <p className="font-display text-sm font-medium">Solicitar tratamiento</p>
          <p className="text-xs text-muted-foreground">Conectá con un profesional RESMA</p>
        </div>
      </button>

      <div className="my-4 h-px bg-border" />

      {/* Crisis button */}
      <button
        onClick={() => setCrisisOpen(true)}
        className="flex w-full items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-left"
      >
        <Lifebuoy size={20} className="text-destructive" weight="bold" />
        <div className="flex-1">
          <p className="font-display text-sm font-medium text-destructive">Línea de crisis</p>
          <p className="text-xs text-muted-foreground">Ayuda inmediata 24hs</p>
        </div>
      </button>

      <div className="my-6 h-px bg-border" />

      {/* Logout */}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-4 rounded-2xl p-4 text-destructive transition-colors active:bg-destructive/5"
      >
        <SignOut size={20} />
        <span className="font-display text-sm font-medium">Cerrar sesión</span>
      </button>

      {/* Crisis modal */}
      <AnimatePresence>
        {crisisOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setCrisisOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-10"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">¿Necesitás ayuda ahora?</h2>
                <button onClick={() => setCrisisOpen(false)} className="text-muted-foreground">
                  <X size={20} />
                </button>
              </div>
              <p className="mb-6 text-sm text-muted-foreground font-body">
                Si estás en crisis o conocés a alguien que lo está, estas líneas son gratuitas, confidenciales y funcionan las 24 horas.
              </p>
              <div className="space-y-3">
                {emergencyLines.map((line) => (
                  <a
                    key={line.number}
                    href={`tel:${line.number}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors active:bg-muted"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <Phone size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-medium">{line.label}</p>
                      <p className="font-display text-lg font-bold">{line.number}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
