import { useNavigate } from "react-router-dom";
import { PsychoModal } from "@/components/modals/PsychoModal";

export default function Psicoeducacion() {
  const navigate = useNavigate();
  return (
    <PsychoModal
      open={true}
      onClose={() => navigate(-1)}
      onComplete={() => navigate("/")}
    />
  );
}
