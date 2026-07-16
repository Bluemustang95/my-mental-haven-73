import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BigFiveProfileModal } from "@/components/proceso/BigFiveProfileModal";

export default function PersonalidadHome() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  // Si por algún motivo el modal se cierra sin acción, volvemos a inventarios.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => navigate("/mi-proceso/inventarios", { replace: true }), 50);
      return () => clearTimeout(t);
    }
  }, [open, navigate]);

  return (
    <div className="relative min-h-screen w-full bg-[#f9f9fb]">
      {/* Fallback visible detrás del modal para evitar pantalla blanca */}
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-xl font-bold text-[#101927]">Perfil de Personalidad</h1>
          <p className="mt-2 text-sm text-[#101927]/60">
            Cargando tu inventario Big Five…
          </p>
          <button
            onClick={() => navigate("/mi-proceso/inventarios")}
            className="mt-6 rounded-full bg-[#101927] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Volver a inventarios
          </button>
        </div>
      </div>

      <BigFiveProfileModal
        open={open}
        onClose={() => {
          setOpen(false);
          navigate("/mi-proceso/inventarios", { replace: true });
        }}
      />
    </div>
  );
}
