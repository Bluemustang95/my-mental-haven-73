import { useNavigate } from "react-router-dom";
import { BigFiveProfileModal } from "@/components/proceso/BigFiveProfileModal";

export default function PersonalidadHome() {
  const navigate = useNavigate();
  // Abrir modal on-mount y volver atrás al cerrar
  return <BigFiveProfileModal open={true} onClose={() => navigate(-1)} />;
}
