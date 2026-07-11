import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminButton, AdminCard, AdminPageHeader, AdminToggle } from "@/components/admin/ui/AdminPrimitives";
import { Bell, Sunrise, Flame, BarChart3, Moon, Stethoscope } from "lucide-react";
import { toast } from "sonner";

type Rule = {
  id?: string;
  category: string;
  trigger_key: string;
  enabled: boolean;
  condition_text: string;
  copy_text: string;
};

type Card = {
  category: string;
  icon: any;
  title: string;
  description: string;
  triggers: { key: string; label: string; condition: string; copy: string }[];
};

const CARDS: Card[] = [
  {
    category: "circadiana", icon: Sunrise, title: "🌅 Rutinas Circadianas",
    description: "Anclar la app a los ritmos del paciente.",
    triggers: [
      { key: "amanecer", label: "Amanecer (Check-in)", condition: "8:00 AM hora local", copy: "🌞 ¡Buen día! ¿Cómo descansaste? Hagamos el check-in." },
      { key: "anochecer", label: "Anochecer (Cierre)", condition: "21:00 PM hora local", copy: "🌙 Hora de cerrar el día. ¿Qué tal estuvo tu jornada?" },
    ],
  },
  {
    category: "habitos", icon: Flame, title: "🔥 Motor de Hábitos",
    description: "Constancia sin presión.",
    triggers: [
      { key: "recordatorio", label: "Recordatorio estándar", condition: "Hora programada en la app", copy: "Es hora de tu hábito: {{nombre_habito}}." },
      { key: "recaida", label: "Prevención de Recaídas (IA Coach)", condition: "Tras 3 días de inactividad", copy: "Hey, vimos que pausaste tus hábitos. Está bien fallar, ¿intentamos hacer un 1% hoy?" },
    ],
  },
  {
    category: "psicometria", icon: BarChart3, title: "📊 Psicometría y Progreso",
    description: "Mantener los baremos al día.",
    triggers: [
      { key: "test_vencido", label: "Actualización de test vencido", condition: "14 días sin BDI-II", copy: "📊 Hace {{dias}} días que no actualizamos síntomas. Tómate 2 min para tu cuestionario." },
    ],
  },
  {
    category: "hibernacion", icon: Moon, title: "💤 Re-activación clínica",
    description: "Rescatar al usuario antes del abandono.",
    triggers: [
      { key: "re_engagement", label: "Re-engagement Anti-Abandono", condition: "5 días sin abrir la app", copy: "Tu índice de bienestar te extraña. Haz un micro check-in para recalibrar." },
    ],
  },
  {
    category: "vinculo", icon: Stethoscope, title: "🏥 Vínculo Terapéutico",
    description: "Comunicación con el clínico.",
    triggers: [
      { key: "nota_terapeuta", label: "Nuevo mensaje del Terapeuta", condition: "El clínico adjunta feedback", copy: "Tienes una nueva nota sincronizada con tu especialista." },
    ],
  },
];

export default function NotificacionesAdmin() {
  const [rules, setRules] = useState<Record<string, Rule>>({});
  const [preview, setPreview] = useState<{ title: string; body: string }>({
    title: "RESMA+", body: "Selecciona un mensaje para previsualizarlo aquí.",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("notification_rules").select("*");
      const map: Record<string, Rule> = {};
      // seed from defaults
      CARDS.forEach((c) => c.triggers.forEach((t) => {
        const key = `${c.category}.${t.key}`;
        map[key] = { category: c.category, trigger_key: t.key, enabled: true, condition_text: t.condition, copy_text: t.copy };
      }));
      // overlay db
      (data ?? []).forEach((r: any) => {
        const k = `${r.category}.${r.trigger_key}`;
        map[k] = r;
      });
      setRules(map);
    })();
  }, []);

  const update = (key: string, patch: Partial<Rule>) => {
    setRules((r) => ({ ...r, [key]: { ...r[key], ...patch } }));
  };

  const saveAll = async () => {
    const payload = Object.values(rules).map((r) => ({
      category: r.category, trigger_key: r.trigger_key,
      enabled: r.enabled, condition_text: r.condition_text, copy_text: r.copy_text,
    }));
    const { error } = await supabase
      .from("notification_rules")
      .upsert(payload, { onConflict: "category,trigger_key" });
    if (error) toast.error("No se pudo guardar: " + error.message);
    else toast.success("Reglas de notificación guardadas y propagadas a los dispositivos");
  };

  return (
    <>
      <AdminPageHeader
        title="Gestor de Notificaciones (Anti-Fatiga)"
        subtitle="Disparadores inteligentes para evitar el spam al paciente"
        action={<AdminButton onClick={saveAll}><Bell size={14} /> Guardar Configuración Global</AdminButton>}
      />
      <div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">
        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-4">
            {CARDS.map((c) => (
              <AdminCard key={c.category} className="p-6 rounded-3xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-resma-teal/10 text-resma-teal flex items-center justify-center">
                    <c.icon size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-resma-navy">{c.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {c.triggers.map((t) => {
                    const k = `${c.category}.${t.key}`;
                    const r = rules[k];
                    if (!r) return null;
                    return (
                      <div key={t.key} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-resma-navy">{t.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">⏱ {r.condition_text}</div>
                          </div>
                          <AdminToggle value={r.enabled} onChange={(v) => update(k, { enabled: v })} />
                        </div>
                        <input
                          value={r.copy_text}
                          onChange={(e) => update(k, { copy_text: e.target.value })}
                          onFocus={() => setPreview({ title: t.label, body: r.copy_text })}
                          disabled={!r.enabled}
                          className={`w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm transition focus:outline-none focus:border-resma-teal ${
                            r.enabled ? "" : "opacity-50 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </AdminCard>
            ))}
          </div>

          {/* Phone preview */}
          <div className="sticky top-6">
            <PhonePreview title={preview.title} body={preview.body} />
          </div>
        </div>

        <ManualPushSection />
      </div>
    </>
  );
}

function ManualPushSection() {
  const [target, setTarget] = useState<"all" | "country" | "plan">("all");
  const [country, setCountry] = useState("AR");
  const [plan, setPlan] = useState<"free" | "premium">("premium");
  const [kind, setKind] = useState<string>("admin");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("notification_log")
        .select("kind, title, body, sent_at, status, user_id")
        .order("sent_at", { ascending: false })
        .limit(20);
      setRecent(data ?? []);
    })();
  }, [sending]);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Título y cuerpo son obligatorios");
      return;
    }
    setSending(true);
    const segment =
      target === "all" ? { all: true } : target === "country" ? { country } : { plan };
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: { segment, title: title.trim(), body: body.trim(), url, kind },
    });
    setSending(false);
    if (error) {
      toast.error("Error al enviar: " + error.message);
      return;
    }
    toast.success(`Enviado a ${data?.sent ?? 0} dispositivos (${data?.targets ?? 0} usuarios)`);
    setTitle("");
    setBody("");
  };

  return (
    <AdminCard className="p-6 rounded-3xl mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-resma-teal/10 text-resma-teal flex items-center justify-center">
          <Bell size={18} />
        </div>
        <div>
          <div className="font-semibold text-resma-navy">Push manual</div>
          <div className="text-xs text-slate-500 mt-0.5">Enviar un mensaje a un segmento ahora mismo (Firebase Cloud Messaging).</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <select value={target} onChange={(e) => setTarget(e.target.value as any)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
          <option value="all">Todos los usuarios</option>
          <option value="country">Por país</option>
          <option value="plan">Por plan</option>
        </select>
        {target === "country" && (
          <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="AR" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
        )}
        {target === "plan" && (
          <select value={plan} onChange={(e) => setPlan(e.target.value as any)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="premium">Premium</option>
            <option value="free">Free</option>
          </select>
        )}
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL destino /" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm mb-2" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mensaje" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />

      <div className="flex justify-end mt-3">
        <AdminButton onClick={send} disabled={sending}>
          <Bell size={14} /> {sending ? "Enviando…" : "Enviar push"}
        </AdminButton>
      </div>

      {recent.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Envíos recientes</div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {recent.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-resma-navy truncate">{r.title} <span className="text-slate-400 font-normal">· {r.kind}</span></div>
                  <div className="text-slate-500 truncate">{r.body}</div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(r.sent_at).toLocaleString("es-AR")}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminCard>
  );
}

function PhonePreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto w-[280px] rounded-[44px] bg-resma-navy p-3 shadow-2xl">
      <div className="rounded-[34px] overflow-hidden h-[560px] relative" style={{ background: "linear-gradient(180deg,#1e293b 0%,#475569 100%)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 h-5 w-24 rounded-full bg-black/60" />
        <div className="pt-14 px-4 text-center text-white">
          <div className="text-[11px] opacity-80">viernes 26 de junio</div>
          <div className="text-5xl font-light mt-1 tabular-nums">09:41</div>
        </div>
        <div className="absolute bottom-6 left-3 right-3">
          <div className="rounded-2xl bg-white/90 backdrop-blur px-3 py-2.5 shadow-lg admin-toast-in" key={title + body}>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-resma-teal text-white text-[10px] font-bold flex items-center justify-center">R+</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-800 truncate">RESMA+</div>
                  <div className="text-[9px] text-slate-400">ahora</div>
                </div>
                <div className="text-[11px] font-semibold text-slate-900 mt-0.5 line-clamp-1">{title}</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-700 mt-1.5 leading-snug line-clamp-3">{body}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
