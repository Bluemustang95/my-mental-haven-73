import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "AR", label: "Argentina" },
  { code: "UY", label: "Uruguay" },
  { code: "CL", label: "Chile" },
  { code: "MX", label: "México" },
  { code: "ES", label: "España" },
  { code: "OTRO", label: "Otro" },
];

const LIFE_STAGES = [
  { id: "estudiante", label: "Estudiando" },
  { id: "trabajando", label: "Trabajando" },
  { id: "maternidad", label: "Maternidad / paternidad" },
  { id: "transicion", label: "En transición" },
  { id: "jubilado", label: "Jubilación" },
];

export default function PersonalInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("display_name, country, life_stage")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.display_name || user.email?.split("@")[0] || "");
        setCountry(data?.country || "AR");
        setLifeStage(data?.life_stage || "");
        setLoading(false);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("patient_app_profiles").upsert(
      {
        user_id: user.id,
        display_name: name.trim() || null,
        country: country || null,
        life_stage: lifeStage || null,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) {
      toast.error("No pudimos guardar tus datos");
      return;
    }
    toast.success("Datos actualizados");
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-32">
      <div className="mx-auto max-w-md">
        <div className="flex items-center px-4 pb-4 pt-12">
          <button
            onClick={() => navigate(-1)}
            className="-ml-2 flex h-9 w-9 items-center justify-center text-accent"
            aria-label="Volver"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Información personal</p>
          </div>
          <div className="w-9" />
        </div>

        {loading ? (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : (
          <div className="px-3">
            <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                ¿Cómo querés que te llamemos?
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[15px] focus:border-[#7cc2c8] focus:outline-none"
              />

              <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </p>
              <p className="mt-1.5 text-[15px] text-[#101927]/70">{user?.email}</p>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                País
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCountry(c.code)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                      country === c.code
                        ? "bg-[#101927] text-white"
                        : "bg-black/5 text-[#101927]/70"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Momento de vida
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {LIFE_STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setLifeStage(lifeStage === s.id ? "" : s.id)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                      lifeStage === s.id
                        ? "bg-[#7cc2c8] text-[#101927]"
                        : "bg-black/5 text-[#101927]/70"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate("/vincular-profesional")}
              className="mt-4 w-full rounded-2xl bg-white px-4 py-3.5 text-left text-[15px] font-medium text-[#101927] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              Vincular con un profesional
            </button>

            <button
              onClick={save}
              disabled={saving}
              className="mt-6 grid h-13 w-full place-items-center rounded-full bg-[#101927] py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
