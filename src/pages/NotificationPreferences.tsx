import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Sunrise, Moon, Sparkles, BarChart3, Flame, Heart, MessageCircle, Newspaper, Stethoscope, Pill, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { IOSToggle } from "@/components/ui/IOSToggle";
import { toast } from "sonner";
import { requestPermissionAndRegister } from "@/lib/pushNotifications";

type Prefs = {
  push_enabled: boolean;
  checkin_enabled: boolean;
  medication_enabled: boolean;
  habits_enabled: boolean;
  admin_enabled: boolean;
  morning_enabled: boolean;
  night_enabled: boolean;
  habits_relapse_enabled: boolean;
  tests_due_enabled: boolean;
  reengagement_enabled: boolean;
  resmita_enabled: boolean;
  content_enabled: boolean;
  therapist_enabled: boolean;
};

const DEFAULTS: Prefs = {
  push_enabled: true,
  checkin_enabled: true,
  medication_enabled: true,
  habits_enabled: true,
  admin_enabled: true,
  morning_enabled: true,
  night_enabled: true,
  habits_relapse_enabled: true,
  tests_due_enabled: true,
  reengagement_enabled: true,
  resmita_enabled: true,
  content_enabled: true,
  therapist_enabled: true,
};

type ItemDef = { key: keyof Prefs; label: string; desc: string; icon: any };

const SECTIONS: { title: string; items: ItemDef[] }[] = [
  {
    title: "Rutinas diarias",
    items: [
      { key: "morning_enabled", label: "Buenos días", desc: "Check-in matinal alrededor de las 8 am.", icon: Sunrise },
      { key: "night_enabled", label: "Cierre del día", desc: "Balance nocturno alrededor de las 21 hs.", icon: Moon },
      { key: "checkin_enabled", label: "Recordatorio de check-in", desc: "Si te salteás tu registro habitual.", icon: CheckCircle2 },
      { key: "medication_enabled", label: "Medicación", desc: "Tomas programadas.", icon: Pill },
      { key: "habits_enabled", label: "Hábitos", desc: "En el horario que elegiste para cada uno.", icon: Flame },
    ],
  },
  {
    title: "Clínicas y bienestar",
    items: [
      { key: "habits_relapse_enabled", label: "Prevención de recaída", desc: "Si estuviste varios días sin registrar hábitos.", icon: Heart },
      { key: "tests_due_enabled", label: "Tests vencidos", desc: "Cuando pasan 2 semanas sin actualizar tus síntomas.", icon: BarChart3 },
      { key: "reengagement_enabled", label: "Te extrañamos", desc: "Rescate suave si dejaste de abrir la app.", icon: Sparkles },
      { key: "therapist_enabled", label: "Notas de tu terapeuta", desc: "Cuando llega nueva información clínica.", icon: Stethoscope },
    ],
  },
  {
    title: "Comunicación y contenido",
    items: [
      { key: "resmita_enabled", label: "Resmita", desc: "Mensajes proactivos de tu compañera IA.", icon: MessageCircle },
      { key: "admin_enabled", label: "Novedades del equipo RESMA", desc: "Anuncios importantes y campañas.", icon: Newspaper },
      { key: "content_enabled", label: "Nuevo contenido", desc: "Cuando sumamos psicoeducación o ejercicios.", icon: Sparkles },
    ],
  },
];

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setPrefs({ ...DEFAULTS, ...(data as any) });
      setLoaded(true);
    })();
  }, [user]);

  const persist = async (patch: Partial<Prefs>) => {
    if (!user) return;
    setPrefs((p) => ({ ...p, ...patch }));
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...patch } as any, { onConflict: "user_id" });
    if (error) toast.error("No se pudo guardar");
  };

  const toggleMaster = async (v: boolean) => {
    if (v) {
      const ok = await requestPermissionAndRegister();
      if (!ok) return;
    }
    persist({ push_enabled: v });
  };

  const master = prefs.push_enabled;

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/5 bg-[#FDFCFB]/90 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 active:scale-95">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display text-[17px] font-semibold text-[#101927]">Notificaciones</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-[15px] font-semibold text-[#101927]">Notificaciones push</p>
              <p className="mt-0.5 text-[12px] text-[#101927]/60">
                Interruptor general. Si está apagado, no se envía ninguna.
              </p>
            </div>
            <IOSToggle checked={master} onChange={toggleMaster} label="Notificaciones push" />
          </div>
        </div>

        <div className={`mt-5 space-y-6 transition ${master ? "" : "pointer-events-none opacity-40"}`}>
          {SECTIONS.map((sec) => (
            <section key={sec.title}>
              <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#101927]/50">
                {sec.title}
              </h2>
              <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {sec.items.map((it, i) => {
                  const Icon = it.icon;
                  const checked = prefs[it.key] as boolean;
                  return (
                    <div key={it.key}>
                      {i > 0 && <div className="ml-14 h-px bg-black/[0.05]" />}
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-resma-teal/10 text-resma-teal">
                            <Icon size={17} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14.5px] font-medium text-[#101927]">{it.label}</p>
                            <p className="mt-0.5 line-clamp-2 text-[12px] text-[#101927]/55">{it.desc}</p>
                          </div>
                        </div>
                        <IOSToggle
                          checked={checked}
                          onChange={(v) => persist({ [it.key]: v } as any)}
                          label={it.label}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {!loaded && <p className="mt-6 text-center text-xs text-[#101927]/40">Cargando…</p>}
      </div>
    </div>
  );
}
