import { AdminCard } from "@/components/admin/ui/AdminPrimitives";
import {
  WEIGHTS, MIN_DAYS, WINDOW_DAYS, DAWN_MAP,
  POSITIVE_EMOTIONS, NEGATIVE_EMOTIONS,
} from "@/lib/wellbeingScore";
import { Sun, Moon, Calculator, HeartPulse, Info } from "lucide-react";

const COLORS: Record<string, string> = {
  mood: "#7cc2c8",
  sleep: "#6366f1",
  balance: "#f0928a",
  dawn: "#facb60",
};

type Row = {
  key: keyof typeof WEIGHTS;
  label: string;
  origin: string;
  field: string;
  range: string;
  formula: string;
  required: string;
};

const ROWS: Row[] = [
  {
    key: "mood",
    label: "Ánimo",
    origin: "Sintonía de la mañana · paso 1",
    field: "daily_checkins.mood_score",
    range: "1 – 5 (entero)",
    formula: "promedio de la ventana ÷ 5 × 100",
    required: "Opcional (si falta, se renormaliza)",
  },
  {
    key: "sleep",
    label: "Sueño",
    origin: "Balance nocturno · calidad de descanso",
    field: "daily_checkins.sleep_score",
    range: "1 – 5 (entero)",
    formula: "promedio de la ventana ÷ 5 × 100",
    required: "Opcional (si falta, se renormaliza)",
  },
  {
    key: "balance",
    label: "Balance emocional",
    origin: "Balance nocturno · selección de emociones",
    field: "daily_checkins.emotions[]",
    range: "lista de etiquetas",
    formula: "por noche: positivas ÷ (positivas + negativas) × 100, luego promedio",
    required: "Opcional · sólo cuenta en check-ins de noche",
  },
  {
    key: "dawn",
    label: "Despertar",
    origin: "Sintonía de la mañana · cómo amaneciste",
    field: "daily_checkins.dawn_score",
    range: "texto de 5 opciones",
    formula: "mapeo fijo a 0-100, luego promedio",
    required: "Opcional (si falta, se renormaliza)",
  },
];

const SELF_CARE = [
  { label: "Hábitos", field: "habit_completions.completed_date", formula: "días con al menos un hábito ÷ 7 × 100" },
  { label: "Medicación", field: "medication_logs.taken", formula: "tomas registradas como sí ÷ total × 100" },
  { label: "Uso de recursos", field: "thought_records · dbt_emotion_sessions · journal_entries · exercise_sessions · weekly_reflections · ba_day_logs", formula: "conteo 7 días → escalones 1/3/6/10 = 35/60/80/100" },
  { label: "Tests", field: "test_results.severity", formula: "último resultado por test (excluye Big Five) → severidad a 0-100" },
];

function Bar({ k, label, weight }: { k: string; label: string; weight: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm font-medium text-resma-navy">{label}</span>
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
          <h2 className="text-base font-semibold text-resma-navy">Cómo se calcula el Índice (Modelo A)</h2>
        </div>
        <p className="mb-5 text-xs text-slate-500">
          Auto-reporte puro: mide cómo se <strong>siente</strong> la persona. El uso de la app no infla el número.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-resma-navy">
              <Sun size={14} className="text-amber-500" /> Ritual de la mañana (Sintonía)
            </div>
            <ul className="space-y-1 text-xs text-slate-600">
              <li>· <code className="text-[11px]">mood_score</code> → Ánimo</li>
              <li>· <code className="text-[11px]">dawn_score</code> → Despertar</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-resma-navy">
              <Moon size={14} className="text-indigo-500" /> Ritual de la noche (Balance)
            </div>
            <ul className="space-y-1 text-xs text-slate-600">
              <li>· <code className="text-[11px]">sleep_score</code> → Sueño</li>
              <li>· <code className="text-[11px]">emotions[]</code> → Balance emocional</li>
            </ul>
          </div>
        </div>

        <div className="my-5 rounded-xl bg-resma-navy/5 px-4 py-3 text-xs text-slate-600">
          Ambos rituales escriben en <code>daily_checkins</code> (una fila por día y modo).
          El índice usa una ventana móvil de <strong>{WINDOW_DAYS} días</strong> y exige
          al menos <strong>{MIN_DAYS} días distintos</strong> con check-in para mostrar un número.
        </div>

        <div className="space-y-3">
          {ROWS.map((r) => (
            <Bar key={r.key} k={r.key} label={r.label} weight={WEIGHTS[r.key]} />
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <Info size={14} className="mt-0.5 shrink-0" />
          Si un factor no tiene datos, su peso se reparte proporcionalmente entre los presentes
          (renormalización). Por eso dos personas pueden tener el mismo número con distinta base.
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="mb-4 text-base font-semibold text-resma-navy">Todas las variables del cálculo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Variable</th>
                <th className="py-2 pr-3">Origen</th>
                <th className="py-2 pr-3">Campo</th>
                <th className="py-2 pr-3">Rango</th>
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
                  <td className="py-2.5 pr-3">{r.origin}</td>
                  <td className="py-2.5 pr-3"><code className="text-[11px]">{r.field}</code></td>
                  <td className="py-2.5 pr-3">{r.range}</td>
                  <td className="py-2.5 pr-3">{r.formula}</td>
                  <td className="py-2.5 pr-3 font-bold tabular-nums" style={{ color: COLORS[r.key] }}>{WEIGHTS[r.key]}%</td>
                  <td className="py-2.5">{r.required}</td>
                </tr>
              ))}
              <tr className="border-b border-slate-100 align-top">
                <td className="py-2.5 pr-3 font-semibold text-resma-navy">Día de registro</td>
                <td className="py-2.5 pr-3">Ambos rituales</td>
                <td className="py-2.5 pr-3"><code className="text-[11px]">checkin_date</code></td>
                <td className="py-2.5 pr-3">fecha (zona AR)</td>
                <td className="py-2.5 pr-3">define la ventana de {WINDOW_DAYS} días y el conteo de días distintos</td>
                <td className="py-2.5 pr-3">—</td>
                <td className="py-2.5">Obligatoria: sin {MIN_DAYS} días no hay índice</td>
              </tr>
              <tr className="align-top">
                <td className="py-2.5 pr-3 font-semibold text-resma-navy">Momento</td>
                <td className="py-2.5 pr-3">Ritual mañana / noche</td>
                <td className="py-2.5 pr-3"><code className="text-[11px]">mode</code></td>
                <td className="py-2.5 pr-3">morning · night</td>
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
          <h3 className="mb-3 text-sm font-semibold text-resma-navy">Mapeo del Despertar</h3>
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
          <h3 className="mb-3 text-sm font-semibold text-resma-navy">Emociones del Balance</h3>
          <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-400">Positivas</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {[...POSITIVE_EMOTIONS].map((e) => (
              <span key={e} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 border border-emerald-200">{e}</span>
            ))}
          </div>
          <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-400">Negativas</p>
          <div className="flex flex-wrap gap-1.5">
            {[...NEGATIVE_EMOTIONS].map((e) => (
              <span key={e} className="rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-700 border border-rose-200">{e}</span>
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
        <p className="mb-4 text-xs text-slate-500">
          Todo lo que la persona hace en la app y hoy pesa <strong>0%</strong> en el número.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Pantalla / función</th>
                <th className="py-2 pr-3">Dónde impacta hoy</th>
                <th className="py-2">Por qué no suma</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {[
                ["Tests e inventarios (PHQ-9, GAD-7)", "Autocuidado → Tests", "Decisión de Modelo A: el índice es auto-reporte diario, no psicometría"],
                ["Personalidad / Big Five", "Excluido explícitamente", "Es un rasgo estable, no un estado semanal"],
                ["Pensamientos automáticos", "Autocuidado → Engagement (conteo)", "Se cuenta el uso, no la intensidad emocional registrada"],
                ["Diario / Diario inteligente", "Autocuidado → Engagement (conteo)", "Texto libre sin puntaje normalizable"],
                ["Hábitos", "Autocuidado → Hábitos", "Es conducta, no cómo se siente la persona"],
                ["Registro de sueños y pesadillas", "No se lee en el índice", "No cruzado con sleep_score todavía"],
                ["Psicoeducación", "No se lee en el índice", "Consumo de contenido = engagement puro"],
                ["Regulación emocional DBT", "Autocuidado → Engagement (conteo)", "Se cuenta la sesión, no el resultado"],
                ["Medicación", "Autocuidado → Medicación", "Adherencia, no estado afectivo"],
                ["Plan de seguridad / Crisis", "No se lee en el índice", "Uso puntual, no serie temporal"],
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
          <HeartPulse size={16} className="text-rose-400" />
          <h3 className="text-base font-semibold text-resma-navy">Autocuidado — se muestra, no suma</h3>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Estas variables aparecen en el detalle del paciente pero <strong>no entran</strong> al número del índice.
          Se les aplica el filtro de recursos desactivados (herramientas ocultas no cuentan).
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {SELF_CARE.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="text-sm font-semibold text-resma-navy">{s.label}</div>
              <div className="mt-0.5 text-[11px] text-slate-500 break-words"><code>{s.field}</code></div>
              <div className="mt-1 text-xs text-slate-600">{s.formula}</div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="mb-3 text-sm font-semibold text-resma-navy">Salidas derivadas</h3>
        <ul className="space-y-2 text-xs text-slate-600">
          <li>· <strong>Índice 0-100</strong>: suma ponderada renormalizada de los 4 factores.</li>
          <li>· <strong>Delta</strong>: variación % del ánimo vs. los {WINDOW_DAYS} días anteriores (se ignora si es menor a 3 puntos).</li>
          <li>· <strong>Tendencia</strong>: {WINDOW_DAYS} puntos con <code>mood_score × 20</code>; los días sin check-in valen 0 y se dibujan como hueco.</li>
          <li>· <strong>Componente más flojo</strong>: el factor presente con menor valor; define el mensaje contextual.</li>
          <li>· <strong>Estado sin datos</strong>: si hay menos de {MIN_DAYS} días, no se muestra número sino el progreso “X/{MIN_DAYS} días”.</li>
        </ul>
      </AdminCard>
    </div>
  );
}
