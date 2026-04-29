import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, BriefcaseBusiness, Compass, HeartHandshake, Palmtree, Sprout } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn, localDateStr } from "@/lib/utils";

type ValuesReflection = {
  id: string;
  life_area: string;
  person_intention: string | null;
  weekly_action: string | null;
  coherence_score: number;
  entry_date: string;
  created_at: string;
};

const lifeAreas = [
  { key: "Relaciones", label: "Relaciones", helper: "Familia y amigos", Icon: HeartHandshake },
  { key: "Crecimiento", label: "Crecimiento", helper: "Aprendizaje y expansión", Icon: BookOpen },
  { key: "Trabajo", label: "Trabajo", helper: "Vocación y proyectos", Icon: BriefcaseBusiness },
  { key: "Salud", label: "Salud", helper: "Bienestar y cuidado", Icon: Sprout },
  { key: "Ocio", label: "Ocio", helper: "Juego y recreación", Icon: Palmtree },
];

export default function MyValues() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState(lifeAreas[0].key);
  const [personIntention, setPersonIntention] = useState("");
  const [weeklyAction, setWeeklyAction] = useState("");
  const [coherence, setCoherence] = useState([5]);
  const [reflections, setReflections] = useState<ValuesReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("values_reflections")
        .select("id, life_area, person_intention, weekly_action, coherence_score, entry_date, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setReflections((data as ValuesReflection[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const selectedAreaMeta = lifeAreas.find((area) => area.key === selectedArea) ?? lifeAreas[0];

  const chartData = useMemo(
    () =>
      lifeAreas.map((area) => {
        const latest = reflections.find((reflection) => reflection.life_area === area.key);
        return { area: area.label, score: latest?.coherence_score ?? 0 };
      }),
    [reflections],
  );

  const saveReflection = async () => {
    if (!user) return;
    if (!personIntention.trim() && !weeklyAction.trim()) {
      toast.error("Sumá al menos una frase para guardar tu reflexión.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("values_reflections")
      .insert({
        user_id: user.id,
        life_area: selectedArea,
        person_intention: personIntention.trim() || null,
        weekly_action: weeklyAction.trim() || null,
        coherence_score: coherence[0],
        entry_date: localDateStr(),
      })
      .select("id, life_area, person_intention, weekly_action, coherence_score, entry_date, created_at")
      .single();

    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar tu reflexión.");
      return;
    }

    if (data) setReflections((current) => [data as ValuesReflection, ...current]);
    setPersonIntention("");
    setWeeklyAction("");
    setCoherence([5]);
    toast.success("Reflexión guardada en tu historial.");
  };

  return (
    <div className="min-h-screen bg-resource-values-bg px-5 pt-12 pb-6 text-resource-values-accent safe-area-top">
      <button onClick={() => navigate("/herramientas")} className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm">
        <ArrowLeft size={20} />
      </button>

      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-card/85 shadow-sm shadow-resource-values-accent/10">
          <Compass size={34} strokeWidth={2.1} />
        </div>
        <h1 className="font-mindful text-3xl leading-tight sm:text-4xl">Mis Valores</h1>
        <p className="mx-auto mt-3 max-w-sm font-sans text-xs font-normal leading-6 text-resource-values-accent/75 sm:text-sm sm:leading-7">
          Tus valores son la dirección, no el destino. Elegí cómo querés caminar hoy.
        </p>
      </motion.header>

      <section className="mb-5 rounded-[2.5rem] border border-resource-values-accent/15 bg-card/85 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-semibold">Las áreas de mi vida</p>
          <span className="rounded-full bg-resource-values-bg px-3 py-1 font-display text-xs font-semibold">Elegí una</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {lifeAreas.map(({ key, label, helper, Icon }) => {
            const active = selectedArea === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedArea(key)}
                className={cn(
                  "min-h-[96px] rounded-[2rem] border p-3 text-left transition-colors",
                  active
                    ? "border-resource-values-accent bg-resource-values-accent text-primary-foreground"
                    : "border-resource-values-accent/15 bg-resource-values-bg/60 text-resource-values-accent",
                )}
              >
                <Icon size={19} />
                <p className="mt-3 font-display text-xs font-semibold leading-tight">{label}</p>
                <p className={cn("mt-1 text-[10px] leading-4", active ? "text-primary-foreground/75" : "text-resource-values-accent/60")}>{helper}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-[2.5rem] border border-resource-values-accent/15 bg-card/85 p-5 shadow-sm">
          <p className="font-display text-base font-semibold">{selectedAreaMeta.label}</p>
          <p className="mt-1 text-xs text-resource-values-accent/65">Definí qué querés cuidar en esta área.</p>
          <Textarea
            value={personIntention}
            onChange={(event) => setPersonIntention(event.target.value)}
            placeholder="¿Qué tipo de persona quiero ser en esta área?"
            className="mt-4 min-h-28 rounded-[2rem] border-resource-values-accent/15 bg-resource-values-bg/50 p-5 font-sans text-sm text-resource-values-accent placeholder:text-resource-values-accent/40 focus-visible:ring-resource-values-accent/25"
          />
          <Textarea
            value={weeklyAction}
            onChange={(event) => setWeeklyAction(event.target.value)}
            placeholder="¿Qué pequeña acción puedo hacer esta semana para acercarme a este valor?"
            className="mt-3 min-h-28 rounded-[2rem] border-resource-values-accent/15 bg-resource-values-bg/50 p-5 font-sans text-sm text-resource-values-accent placeholder:text-resource-values-accent/40 focus-visible:ring-resource-values-accent/25"
          />
        </div>

        <div className="rounded-[2.5rem] border border-resource-values-accent/15 bg-card/85 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-display text-sm font-semibold leading-5">Del 1 al 10, ¿qué tan cerca te sentiste de este valor en los últimos días?</p>
            <span className="shrink-0 rounded-full bg-resource-values-bg px-3 py-1 font-display text-sm font-semibold">{coherence[0]}/10</span>
          </div>
          <Slider value={coherence} onValueChange={setCoherence} min={1} max={10} step={1} className="[&_[role=slider]]:border-resource-values-accent [&_[role=slider]]:bg-card [&>span>span]:bg-resource-values-accent" />
        </div>

        <button onClick={saveReflection} disabled={saving} className="w-full rounded-[3rem] bg-resource-values-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-values-accent/20 active:scale-[0.98] disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar reflexión"}
        </button>
      </section>

      <section className="mt-7 rounded-[2.5rem] border border-resource-values-accent/15 bg-card/85 p-5 shadow-sm">
        <p className="mb-2 font-display text-sm font-semibold">Mapa de cuidado</p>
        <p className="mb-3 text-xs leading-5 text-resource-values-accent/65">Mirá qué áreas vienen recibiendo más atención y cuáles piden un poco más de cuidado.</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="72%">
              <PolarGrid stroke="hsl(var(--resource-values-accent) / 0.18)" />
              <PolarAngleAxis dataKey="area" tick={{ fill: "hsl(var(--resource-values-accent))", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "18px",
                  color: "hsl(var(--resource-values-accent))",
                  fontSize: 12,
                }}
              />
              <Radar dataKey="score" stroke="hsl(var(--resource-values-accent))" fill="hsl(var(--resource-values-accent))" fillOpacity={0.18} strokeWidth={2.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 font-display text-sm font-semibold">Historial</h2>
        {loading ? (
          <div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-2 border-resource-values-accent border-t-transparent" /></div>
        ) : reflections.length === 0 ? (
          <div className="rounded-[2rem] border border-resource-values-accent/15 bg-card/70 p-5 text-sm text-resource-values-accent/65">
            Todavía no hay registros. Cuando guardes una reflexión, va a aparecer acá.
          </div>
        ) : (
          <div className="space-y-3">
            {reflections.map((reflection) => (
              <article key={reflection.id} className="rounded-[2rem] border border-resource-values-accent/15 bg-card/75 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm font-semibold">{reflection.life_area}</p>
                    <p className="text-[11px] text-resource-values-accent/55">{reflection.entry_date}</p>
                  </div>
                  <span className="rounded-full bg-resource-values-bg px-3 py-1 font-display text-xs font-semibold">{reflection.coherence_score}/10</span>
                </div>
                {reflection.person_intention && <p className="mt-3 text-sm leading-6 text-resource-values-accent/80">{reflection.person_intention}</p>}
                {reflection.weekly_action && <p className="mt-2 text-xs leading-5 text-resource-values-accent/65">Acción valiosa: {reflection.weekly_action}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
