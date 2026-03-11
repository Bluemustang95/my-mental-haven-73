import { useState } from "react";
import { Moon, Sun, SignOut, Stethoscope, Gear, Bell } from "@phosphor-icons/react";

export default function Profile() {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <h1 className="mb-2 font-display text-xl font-semibold">Mi Perfil</h1>
      <p className="mb-8 text-sm text-muted-foreground">Configurá tu experiencia.</p>

      {/* Settings sections */}
      <div className="space-y-3">
        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4"
        >
          {darkMode ? <Moon size={20} weight="duotone" /> : <Sun size={20} weight="duotone" />}
          <span className="flex-1 text-left font-display text-sm font-medium">
            {darkMode ? "Modo oscuro" : "Modo claro"}
          </span>
          <div className={`h-6 w-11 rounded-full transition-colors ${darkMode ? "bg-accent" : "bg-muted"} relative`}>
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </button>

        {/* Notifications placeholder */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Bell size={20} weight="duotone" />
          <span className="flex-1 font-display text-sm font-medium">Notificaciones</span>
          <span className="text-xs text-muted-foreground">Próximamente</span>
        </div>

        {/* Settings placeholder */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Gear size={20} weight="duotone" />
          <span className="flex-1 font-display text-sm font-medium">Preferencias</span>
          <span className="text-xs text-muted-foreground">Próximamente</span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 h-px bg-border" />

      {/* Solicitar tratamiento */}
      <button className="flex w-full items-center gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left">
        <Stethoscope size={20} className="text-accent" weight="duotone" />
        <div className="flex-1">
          <p className="font-display text-sm font-medium">Solicitar tratamiento</p>
          <p className="text-xs text-muted-foreground">Conectá con un profesional RESMA</p>
        </div>
      </button>

      {/* Divider */}
      <div className="my-6 h-px bg-border" />

      {/* Logout */}
      <button className="flex w-full items-center gap-4 rounded-2xl p-4 text-destructive transition-colors active:bg-destructive/5">
        <SignOut size={20} />
        <span className="font-display text-sm font-medium">Cerrar sesión</span>
      </button>
    </div>
  );
}
