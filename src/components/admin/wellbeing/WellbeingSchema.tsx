import { AdminCard } from "@/components/admin/ui/AdminPrimitives";
import {
  WELLBEING_WEIGHTS, CARE_WEIGHTS, COMBINED_WEIGHTS, SLEEP_INNER,
  MIN_DAYS, WINDOW_DAYS, SERIES_DAYS, MODULATOR_FULL_DAYS, MODULATOR_STALE_DAYS,
} from "@/lib/wellbeing/types";
import {
  DAWN_MAP, POSITIVE_EMOTIONS, NEGATIVE_EMOTIONS, RESOURCE_DAILY_CAP,
} from "@/lib/wellbeing/normalize";
import { Sun, Moon, Calculator, HeartPulse, Info, Activity } from "lucide-react";

const COLORS: Record<string, string> = {
  mood: "#7cc2c8",
  sleep: "#8b9df0",
  balance: "#facb60",
  resources: "#87d3a4",
  treatment: "#f0a58b",
  dawn: "#facb60",
};

type Row = {
  key: string;
  label: string;
  index: "Bienestar" | "Cuidado";
  weight: number;
  origin: string;
  field: string;
  formula: string;
  required: string;
};

const ROWS: Row[] = [
  {
    key: "mood",
    label: "Ánimo (A1)",
    index: "Bienestar",
    weight: WELLBEING_WEIGHTS.mood,
    origin: "Sintonía de la mañana · Balance nocturno",
    field: "daily_checkins.mood_score",
    formula: "un valor por día (mañana+noche consolidados) ÷ 5 × 100, luego promedio de la ventana",
    required: "Opcional (si falta, se renormaliza)",
  },
  {
    key: "sleep",
    label: "Sueño (S0/S1/S2)",
    index: "Bienestar",
    weight: WELLBEING_WEIGHTS.sleep,
    origin: "Balance nocturno · sleep_log · higiene · registro de sueños",
    field: "daily_checkins.sleep_score · sleep_log.score · sleep_hygiene_audits · dream_log",
    formula: `S0 calidad ${SLEEP_INNER.S0}% + S2 despertar ${SLEEP_INNER.S2}% + S1 higiene/pesadillas ${SLEEP_INNER.S1}%`,
    required: "Opcional (renormaliza también entre sub-ítems)",
  },
  {
    key: "balance",
    label: "Balance emocional (B1)",
    index: "Bienestar",
    weight: WELLBEING_WEIGHTS.balance,
    origin: "Balance nocturno · selección de emociones",
    field: "daily_checkins.emotions[]",
    formula: "por noche: positivas ÷ (positivas + negativas) × 100, luego promedio",
    required: "Opcional · sólo cuenta en check-ins de noche",
  },
  {
    key: "resources",
    label: "Uso de recursos (R1)",
    index: "Cuidado",
    weight: CARE_WEIGHTS.resources,
    origin: "Pensamientos · DBT · Diario · Mindfulness · Hábitos",
    field: "thought_records · dbt_emotion_sessions · journal_entries · exercise_sessions · habit_completions",
    formula: `conteo de la ventana con tope de ${RESOURCE_DAILY_CAP} acciones/día → escalones a 0-100`,
    required: "Opcional · excluye herramientas ocultas por el admin",
  },
  {
    key: "treatment",
    label: "Tratamiento (T1A-D)",
    index: "Cuidado",
    weight: CARE_WEIGHTS.treatment,
    origin: "Terapia, medicación y notas",
    field: "session_notes · medication_logs · therapy_prep_notes",
    formula: "asistencia (14 días) + adherencia a medicación + notas creadas + notas compartidas",
    required: "Sólo aplica si la persona está en terapia / tiene medicación activa",
  },
];

function Bar({ k, label, weight }: { k: string; label: string; weight: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-sm font-medium text-resma-navy">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${weight}%`, background: COLORS[k] }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums" style={{ color: COLORS[k] }}>
        {weight}%
      </span>
    </div>
  );
}

export default function WellbeingSchema() {
  const dawnEntries = Object.entries(DAWN_MAP);

  return (
    <div className="space-y-4">
      <AdminCard className="p-6">
        <div className="mb-1 flex items-center gap-2">
          <Calculator size={16} className="text-resma-teal" />
          <h2 className="text-base font-semibold text-resma-navy">Cómo se calcula el Índice (v3)</h2>
        </div>
        <p className="mb-5 text-xs text-slate-500">
          Dos índices separados: <strong>Bienestar (SENTIR)</strong> mide cómo se siente la persona;{" "}
          <strong>Cuidado (HACER)</strong> mide qué hace por su tratamiento. La conducta nunca infla el Bienestar.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-resma-navy">
              <Sun size={14} className="text-amber-500" /> Bienestar (SENTIR)
            </div>
            <div className="space-y-2">
              <Bar k="mood" label="Ánimo" weight={WELLBEING_WEIGHTS.mood} />
              <Bar k="sleep" label="Sueño" weight={WELLBEING_WEIGHTS.sleep} />
              <Bar k="balance" label="Balance emocional" weight={WELLBEING_WEIGHTS.balance} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-resma-navy">
              <Moon size={14} className="text-indigo-500" /> Cuidado (HACER)
            </div>
            <div className="space-y-2">
              <Bar k="resources" label="Uso de recursos" weight={CARE_WEIGHTS.resources} />
              <Bar k="treatment" label="Tratamiento" weight={CARE_WEIGHTS.treatment} />
            </div>
          </div>
        </div>

        <div className="my-5 rounded-xl bg-resma-navy/5 px-4 py-3 text-xs text-slate-600">
          Ventana móvil de <strong>{WINDOW_DAYS} días</strong> con umbral de{" "}
          <strong>{MIN_DAYS} días distintos</strong> con check-in: por debajo de eso el Bienestar es{" "}
          <code>null</code> y la app muestra el progreso “X/{MIN_DAYS} días”. La serie diaria y el calendario
          usan <strong>{SERIES_DAYS} días</strong>.
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <Info size={14} className="mt-0.5 shrink-0" />
          Si un pilar o sub-ítem no tiene datos, su peso se reparte proporcionalmente entre los presentes
          (renormalización). En “Ver índice de un paciente” se muestra el peso base y el peso aplicado de cada pilar.
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <div className="mb-1 flex items-center gap-2">
          <HeartPulse size={16} className="text-rose-400" />
          <h3 className="text-base font-semibold text-resma-navy">Modulador clínico (Módulo B)</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Los tests clínicos (BDI-II, BAI, PHQ-9, GAD-7…) <strong>no puntúan</strong> dentro del índice: actúan como
          limitador. Un cuadro severo no puede convivir con un Bienestar alto.
        </p>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li>· Severidad <strong>moderada</strong> → penalización parcial; <strong>severa</strong> → hasta −15 puntos.</li>
          <li>· La penalización es plena hasta los <strong>{MODULATOR_FULL_DAYS} días</strong> y decae linealmente.</li>
          <li>· A los <strong>{MODULATOR_STALE_DAYS} días</strong> el test se considera vencido y el modulador se apaga.</li>
          <li>· Big Five queda excluido (rasgo estable, no estado).</li>
        </ul>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="mb-4 text-base font-semibold text-resma-navy">Todas las variables del cálculo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Pilar</th>
                <th className="py-2 pr-3">Índice</th>
                <th className="py-2 pr-3">Origen</th>
                <th className="py-2 pr-3">Campos</th>
                <th className="py-2 pr-3">Normalización</th>
                <th className="py-2 pr-3">Peso</th>
                <th className="py-2">Obligatoriedad</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {ROWS.map((r) => (
                <tr key={r.key} className="border-b border-slate-100 align-top">
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-resma-navy">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[r.key] }} />
                      {r.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">{r.index}</td>
                  <td className="py-2.5 pr-3">{r.origin}</td>
                  <td className="py-2.5 pr-3"><code className="text-[11px] break-words">{r.field}</code></td>
                  <td className="py-2.5 pr-3">{r.formula}</td>
                  <td className="py-2.5 pr-3 font-bold tabular-nums" style={{ color: COLORS[r.key] }}>{r.weight}%</td>
                  <td className="py-2.5">{r.required}</td>
                </tr>
              ))}
              <tr className="border-b border-slate-100 align-top">
                <td className="py-2.5 pr-3 font-semibold text-resma-navy">Día de registro</td>
                <td className="py-2.5 pr-3">Ambos</td>
                <td className="py-2.5 pr-3">Ambos rituales</td>
                <td className="py-2.5 pr-3"><code className="text-[11px]">checkin_date</code></td>
                <td className="py-2.5 pr-3">define la ventana de {WINDOW_DAYS} días y el conteo de días distintos</td>
                <td className="py-2.5 pr-3">—</td>
                <td className="py-2.5">Obligatoria: sin {MIN_DAYS} días no hay Bienestar</td>
              </tr>
              <tr className="align-top">
                <td className="py-2.5 pr-3 font-semibold text-resma-navy">Momento</td>
                <td className="py-2.5 pr-3">Bienestar</td>
                <td className="py-2.5 pr-3">Ritual mañana / noche</td>
                <td className="py-2.5 pr-3"><code className="text-[11px]">mode</code></td>
                <td className="py-2.5 pr-3">filtra qué filas alimentan el Balance emocional (sólo noche)</td>
                <td className="py-2.5 pr-3">—</td>
                <td className="py-2.5">Obligatoria para el Balance</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminCard>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-resma-navy">Mapeo del Despertar (S2)</h3>
          <div className="space-y-2">
            {dawnEntries.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-slate-600">{k}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: COLORS.dawn }} />
                </div>
                <span className="w-8 text-right text-xs font-bold tabular-nums text-slate-500">{v}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-resma-navy">Emociones del Balance (B1)</h3>
          <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-400">Positivas</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {[...POSITIVE_EMOTIONS].map((e) => (
              <span key={e} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">{e}</span>
            ))}
          </div>
          <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-400">Negativas</p>
          <div className="flex flex-wrap gap-1.5">
            {[...NEGATIVE_EMOTIONS].map((e) => (
              <span key={e} className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">{e}</span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Cualquier emoción fuera de estas listas se ignora en el cálculo del Balance.
          </p>
        </AdminCard>
      </div>

      <AdminCard className="p-6">
        <div className="mb-1 flex items-center gap-2">
          <Info size={16} className="text-slate-400" />
          <h3 className="text-base font-semibold text-resma-navy">Variables que NO entran al índice</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Pantalla / función</th>
                <th className="py-2 pr-3">Dónde impacta hoy</th>
                <th className="py-2">Por qué no puntúa</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {[
                ["Tests clínicos (PHQ-9, GAD-7, BDI, BAI)", "Modulador clínico (resta puntos)", "No son auto-reporte diario: limitan el máximo, no suman"],
                ["Personalidad / Big Five", "Excluido explícitamente", "Rasgo estable, no estado semanal"],
                ["Psicoeducación", "No se lee", "Consumo de contenido = engagement puro"],
                ["Plan de seguridad / Crisis", "No se lee", "Uso puntual, no serie temporal"],
                ["Contenido del diario y pensamientos", "Sólo cuenta como acción en R1", "Texto libre sin puntaje normalizable"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-b border-slate-100 align-top">
                  <td className="py-2.5 pr-3 font-semibold text-resma-navy">{a}</td>
                  <td className="py-2.5 pr-3">{b}</td>
                  <td className="py-2.5">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <div className="mb-1 flex items-center gap-2">
          <Activity size={16} className="text-resma-teal" />
          <h3 className="text-sm font-semibold text-resma-navy">Salidas derivadas</h3>
        </div>
        <ul className="mt-2 space-y-2 text-xs text-slate-600">
          <li>· <strong>Bienestar 0-100</strong>: suma ponderada renormalizada de Ánimo/Sueño/Balance, menos el modulador clínico.</li>
          <li>· <strong>Cuidado 0-100</strong>: Recursos {CARE_WEIGHTS.resources}% + Tratamiento {CARE_WEIGHTS.treatment}%.</li>
          <li>· <strong>Lectura combinada</strong> (opcional): Ánimo {COMBINED_WEIGHTS.mood} / Sueño {COMBINED_WEIGHTS.sleep} / Recursos {COMBINED_WEIGHTS.resources} / Tratamiento {COMBINED_WEIGHTS.treatment}.</li>
          <li>· <strong>Delta</strong>: variación % del ánimo vs. los {WINDOW_DAYS} días previos.</li>
          <li>· <strong>Serie diaria</strong>: {SERIES_DAYS} días para calendario, barras y correlaciones de Spearman.</li>
          <li>· <strong>Pilar más flojo</strong>: define el mensaje contextual que ve la persona.</li>
        </ul>
      </AdminCard>
    </div>
  );
}
