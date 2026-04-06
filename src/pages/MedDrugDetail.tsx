import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info, Target, AlertTriangle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

type DrugDetail = {
  name: string;
  whatIs: string;
  usedFor: string;
  sideEffects: string[];
  warning: string;
};

const drugDetails: Record<string, DrugDetail> = {
  sertralina: {
    name: "Sertralina",
    whatIs: "Es un antidepresivo del grupo ISRS (Inhibidor Selectivo de la Recaptación de Serotonina). Ayuda a regular los niveles de serotonina en tu cerebro, un neurotransmisor relacionado con el bienestar emocional.",
    usedFor: "Se usa para tratar la depresión, trastorno de ansiedad generalizada, trastorno obsesivo-compulsivo (TOC), trastorno de pánico y estrés postraumático.",
    sideEffects: ["Náuseas leves los primeros días", "Dolor de cabeza", "Dificultad para dormir o somnolencia", "Cambios en el apetito", "Sequedad bucal"],
    warning: "No suspendas ni modifiques la dosis sin consultarlo con tu psiquiatra. Los efectos terapéuticos suelen aparecer entre 2 y 4 semanas después de iniciar el tratamiento.",
  },
  escitalopram: {
    name: "Escitalopram",
    whatIs: "Es un antidepresivo ISRS muy utilizado y bien tolerado. Actúa aumentando la disponibilidad de serotonina en el cerebro.",
    usedFor: "Se indica para depresión y trastorno de ansiedad generalizada. Es uno de los ISRS con menos interacciones medicamentosas.",
    sideEffects: ["Náuseas", "Somnolencia o insomnio", "Fatiga", "Sudoración aumentada", "Cambios en el deseo sexual"],
    warning: "No dejes de tomarlo abruptamente. Tu psiquiatra te guiará en cualquier cambio de dosis.",
  },
  fluoxetina: {
    name: "Fluoxetina",
    whatIs: "Es uno de los antidepresivos ISRS más conocidos. Tiene un efecto activante, lo que significa que puede darte más energía.",
    usedFor: "Se usa para depresión, bulimia nerviosa, TOC y trastorno de pánico.",
    sideEffects: ["Nerviosismo o inquietud", "Insomnio", "Dolor de cabeza", "Náuseas", "Pérdida de apetito"],
    warning: "Al ser activante, generalmente se toma por la mañana. Consultá siempre con tu psiquiatra antes de hacer cambios.",
  },
  venlafaxina: {
    name: "Venlafaxina",
    whatIs: "Es un antidepresivo IRSN (Inhibidor de la Recaptación de Serotonina y Noradrenalina). Actúa sobre dos neurotransmisores a la vez.",
    usedFor: "Depresión, ansiedad generalizada, fobia social y trastorno de pánico.",
    sideEffects: ["Náuseas", "Mareo", "Sudoración", "Insomnio", "Aumento de presión arterial (en dosis altas)"],
    warning: "Es muy importante no suspender abruptamente. Requiere reducción gradual supervisada por tu psiquiatra.",
  },
  duloxetina: {
    name: "Duloxetina",
    whatIs: "Antidepresivo dual (IRSN) que también puede ayudar con ciertos tipos de dolor crónico.",
    usedFor: "Depresión, ansiedad generalizada, dolor neuropático y fibromialgia.",
    sideEffects: ["Náuseas", "Sequedad bucal", "Somnolencia", "Fatiga", "Estreñimiento"],
    warning: "No modifiques la dosis sin supervisión médica. Si olvidás una toma, no dupliques la siguiente.",
  },
  mirtazapina: {
    name: "Mirtazapina",
    whatIs: "Es un antidepresivo atípico que actúa sobre la noradrenalina y la serotonina. Tiene un efecto sedante que puede ayudar con el sueño.",
    usedFor: "Depresión con insomnio, ansiedad y pérdida de apetito.",
    sideEffects: ["Somnolencia (especialmente al inicio)", "Aumento de apetito y peso", "Sequedad bucal", "Mareo"],
    warning: "Generalmente se toma por la noche. No cambies la dosis sin hablar con tu psiquiatra.",
  },
  bupropion: {
    name: "Bupropión",
    whatIs: "Antidepresivo que actúa sobre la dopamina y noradrenalina. Es activante y no suele causar aumento de peso ni disfunción sexual.",
    usedFor: "Depresión, dejar de fumar y TDAH (off-label).",
    sideEffects: ["Insomnio", "Sequedad bucal", "Dolor de cabeza", "Nerviosismo", "Disminución del apetito"],
    warning: "No está recomendado en personas con antecedentes de convulsiones. Consultá siempre con tu médico.",
  },
  clonazepam: {
    name: "Clonazepam",
    whatIs: "Es una benzodiacepina que actúa rápidamente para reducir la ansiedad. Tiene efecto relajante muscular y anticonvulsivante.",
    usedFor: "Trastorno de pánico, ansiedad intensa, epilepsia y ciertos trastornos del sueño.",
    sideEffects: ["Somnolencia", "Mareo", "Dificultad de coordinación", "Problemas de memoria", "Dependencia con uso prolongado"],
    warning: "Las benzodiacepinas pueden generar dependencia. Usá siempre la dosis indicada y nunca las suspendas abruptamente.",
  },
  alprazolam: {
    name: "Alprazolam",
    whatIs: "Benzodiacepina de acción corta. Actúa rápido para aliviar la ansiedad aguda.",
    usedFor: "Crisis de ansiedad, trastorno de pánico y ansiedad generalizada (uso a corto plazo).",
    sideEffects: ["Somnolencia", "Mareo", "Fatiga", "Confusión", "Riesgo de dependencia"],
    warning: "Solo para uso a corto plazo bajo supervisión estricta. No mezcles con alcohol.",
  },
  lorazepam: {
    name: "Lorazepam",
    whatIs: "Benzodiacepina de acción intermedia con efecto ansiolítico y sedante.",
    usedFor: "Ansiedad, insomnio asociado a ansiedad y como premedicación.",
    sideEffects: ["Sedación", "Debilidad muscular", "Mareo", "Dependencia"],
    warning: "Usalo solo según indicación médica. No aumentes la dosis por tu cuenta.",
  },
  diazepam: {
    name: "Diazepam",
    whatIs: "Una de las benzodiacepinas más antiguas y conocidas. Tiene efecto ansiolítico, relajante muscular y anticonvulsivante.",
    usedFor: "Ansiedad, espasmos musculares, convulsiones y abstinencia alcohólica.",
    sideEffects: ["Somnolencia", "Fatiga", "Ataxia", "Dependencia"],
    warning: "Tiene vida media larga. No lo combines con otros depresores del sistema nervioso.",
  },
  pregabalina: {
    name: "Pregabalina",
    whatIs: "Es un gabapentinoide que actúa modulando la liberación de neurotransmisores. No es una benzodiacepina.",
    usedFor: "Ansiedad generalizada, dolor neuropático, fibromialgia y epilepsia.",
    sideEffects: ["Somnolencia", "Mareo", "Aumento de peso", "Edema", "Visión borrosa"],
    warning: "No suspendas abruptamente. Requiere reducción gradual indicada por tu médico.",
  },
  litio: {
    name: "Litio",
    whatIs: "Es el estabilizador del ánimo por excelencia. Se usa desde hace décadas y sigue siendo muy efectivo.",
    usedFor: "Trastorno bipolar (prevención de episodios maníacos y depresivos) y como potenciador de antidepresivos.",
    sideEffects: ["Temblor leve en las manos", "Sed aumentada", "Orinar con más frecuencia", "Aumento de peso", "Problemas de tiroides a largo plazo"],
    warning: "Requiere controles de sangre regulares (litemia). Es fundamental mantener una buena hidratación.",
  },
  valproato: {
    name: "Ácido Valproico",
    whatIs: "Anticonvulsivante que también se usa como estabilizador del ánimo.",
    usedFor: "Trastorno bipolar, epilepsia y migrañas.",
    sideEffects: ["Náuseas", "Aumento de peso", "Temblor", "Caída de cabello", "Somnolencia"],
    warning: "Requiere controles de sangre periódicos. No se recomienda durante el embarazo.",
  },
  lamotrigina: {
    name: "Lamotrigina",
    whatIs: "Anticonvulsivante con propiedades estabilizadoras del ánimo, especialmente efectivo para prevenir episodios depresivos.",
    usedFor: "Trastorno bipolar (fase depresiva) y epilepsia.",
    sideEffects: ["Dolor de cabeza", "Mareo", "Visión doble", "Náuseas", "Erupción cutánea (raro pero importante)"],
    warning: "Debe aumentarse MUY gradualmente. Si aparece cualquier erupción en la piel, consultá inmediatamente.",
  },
  carbamazepina: {
    name: "Carbamazepina",
    whatIs: "Anticonvulsivante clásico usado también como estabilizador del ánimo.",
    usedFor: "Trastorno bipolar, epilepsia, neuralgia del trigémino.",
    sideEffects: ["Somnolencia", "Mareo", "Visión borrosa", "Náuseas", "Reacciones cutáneas"],
    warning: "Requiere análisis de sangre. Tiene muchas interacciones medicamentosas, informá siempre a tu médico sobre otros medicamentos.",
  },
  quetiapina: {
    name: "Quetiapina",
    whatIs: "Antipsicótico atípico que en dosis bajas se usa como inductor del sueño y ansiolítico, y en dosis mayores como antipsicótico.",
    usedFor: "Trastorno bipolar, esquizofrenia, insomnio resistente y como potenciador antidepresivo.",
    sideEffects: ["Somnolencia marcada", "Aumento de peso", "Sequedad bucal", "Mareo al levantarse", "Cambios metabólicos"],
    warning: "Puede afectar el metabolismo (glucosa, colesterol). Requiere controles periódicos.",
  },
  risperidona: {
    name: "Risperidona",
    whatIs: "Antipsicótico atípico que actúa bloqueando receptores de dopamina y serotonina.",
    usedFor: "Esquizofrenia, trastorno bipolar (manía), irritabilidad en autismo.",
    sideEffects: ["Aumento de peso", "Somnolencia", "Rigidez muscular", "Aumento de prolactina", "Inquietud motora"],
    warning: "Controlá peso y análisis metabólicos regularmente. No suspendas sin indicación médica.",
  },
  olanzapina: {
    name: "Olanzapina",
    whatIs: "Antipsicótico atípico muy efectivo pero con impacto metabólico significativo.",
    usedFor: "Esquizofrenia, trastorno bipolar, agitación aguda.",
    sideEffects: ["Aumento de peso significativo", "Somnolencia", "Aumento de glucosa y colesterol", "Sequedad bucal"],
    warning: "Requiere monitoreo metabólico estricto. El aumento de peso es común y debe manejarse activamente.",
  },
  aripiprazol: {
    name: "Aripiprazol",
    whatIs: "Antipsicótico atípico con un mecanismo diferente: es un agonista parcial de dopamina, lo que lo hace más 'equilibrado'.",
    usedFor: "Esquizofrenia, trastorno bipolar, como potenciador antidepresivo y en autismo.",
    sideEffects: ["Inquietud (acatisia)", "Insomnio", "Náuseas", "Dolor de cabeza", "Menor riesgo de aumento de peso que otros antipsicóticos"],
    warning: "La inquietud motora al inicio es el efecto más común. Comentalo con tu psiquiatra si persiste.",
  },
  zolpidem: {
    name: "Zolpidem",
    whatIs: "Hipnótico no benzodiacepínico de acción rápida para inducir el sueño.",
    usedFor: "Insomnio de conciliación (dificultad para quedarse dormido).",
    sideEffects: ["Somnolencia residual", "Mareo", "Amnesia (si no dormís después de tomarlo)", "Comportamientos automáticos (raro)"],
    warning: "Tomalo justo antes de acostarte y asegurate de poder dormir 7-8 horas. No mezcles con alcohol.",
  },
  melatonina: {
    name: "Melatonina",
    whatIs: "Hormona natural que tu cuerpo produce para regular el ciclo de sueño-vigilia. La versión farmacológica ayuda a regular ese reloj interno.",
    usedFor: "Insomnio, jet lag y trastornos del ritmo circadiano.",
    sideEffects: ["Somnolencia diurna (si la dosis es alta)", "Dolor de cabeza leve", "Mareo"],
    warning: "Aunque es de venta libre, consultá con tu médico la dosis adecuada. No es un somnífero potente.",
  },
  trazodona: {
    name: "Trazodona",
    whatIs: "Antidepresivo atípico que en dosis bajas se usa principalmente como inductor del sueño.",
    usedFor: "Insomnio asociado a depresión o ansiedad, depresión (en dosis más altas).",
    sideEffects: ["Somnolencia", "Mareo", "Sequedad bucal", "Visión borrosa"],
    warning: "No dejes de tomarlo abruptamente. Consultá cambios con tu médico.",
  },
  metilfenidato: {
    name: "Metilfenidato",
    whatIs: "Estimulante del sistema nervioso central que ayuda a mejorar la concentración y reducir la impulsividad.",
    usedFor: "Trastorno por déficit de atención e hiperactividad (TDAH) y narcolepsia.",
    sideEffects: ["Pérdida de apetito", "Insomnio", "Dolor de cabeza", "Nerviosismo", "Aumento de frecuencia cardíaca"],
    warning: "Es un medicamento controlado. Usalo exactamente como lo indicó tu médico. No lo compartas con nadie.",
  },
  atomoxetina: {
    name: "Atomoxetina",
    whatIs: "Medicamento no estimulante para TDAH. Actúa sobre la noradrenalina.",
    usedFor: "TDAH, especialmente cuando los estimulantes no son adecuados.",
    sideEffects: ["Disminución del apetito", "Náuseas", "Fatiga", "Cambios de humor al inicio"],
    warning: "Los efectos terapéuticos pueden tardar 4-6 semanas en aparecer completamente. Paciencia.",
  },
  lisdexanfetamina: {
    name: "Lisdexanfetamina",
    whatIs: "Profármaco estimulante de liberación prolongada para TDAH.",
    usedFor: "TDAH en adultos y niños.",
    sideEffects: ["Pérdida de apetito", "Insomnio", "Sequedad bucal", "Nerviosismo", "Aumento de presión arterial"],
    warning: "Medicamento controlado. Requiere receta especial y seguimiento médico regular.",
  },
};

export default function MedDrugDetail() {
  const navigate = useNavigate();
  const { categoryId, drugId } = useParams();
  const drug = drugDetails[drugId ?? ""];

  if (!drug) {
    return (
      <div className="px-5 pt-14 pb-28 safe-area-top">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="text-muted-foreground">Medicamento no encontrado.</p>
      </div>
    );
  }

  const sections = [
    { icon: Info, title: "¿Qué es?", content: drug.whatIs, color: "bg-[hsl(var(--accent))]/10" },
    { icon: Target, title: "¿Para qué se usa?", content: drug.usedFor, color: "bg-[hsl(var(--mood-5))]/10" },
  ];

  return (
    <div className="px-5 pt-14 pb-28 safe-area-top bg-[hsl(var(--background))]">
      <button onClick={() => navigate(`/mi-proceso/medicacion/biblioteca/${categoryId}`)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Volver
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-1 font-display text-xl font-semibold">{drug.name}</h1>
        <p className="mb-6 text-sm text-muted-foreground">Ficha informativa</p>

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="rounded-2xl bg-card p-5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${section.color}`}>
                    <Icon size={16} className="text-foreground" />
                  </div>
                  <h2 className="font-display text-sm font-semibold">{section.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              </div>
            );
          })}

          {/* Side Effects */}
          <div className="rounded-2xl bg-card p-5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--mood-3))]/10">
                <AlertTriangle size={16} className="text-foreground" />
              </div>
              <h2 className="font-display text-sm font-semibold">Efectos secundarios comunes</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">No todos los experimentan. Pueden disminuir con el tiempo.</p>
            <div className="flex flex-wrap gap-2">
              {drug.sideEffects.map((effect) => (
                <span key={effect} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {effect}
                </span>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-2xl bg-[hsl(var(--accent))]/8 border border-[hsl(var(--accent))]/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={18} className="text-[hsl(var(--accent-foreground))]" />
              <h2 className="font-display text-sm font-semibold">Aviso importante</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{drug.warning}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
