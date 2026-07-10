// src/lib/onboardingAlgorithm.ts
// Unified onboarding personalization algorithm — single source of truth.
// Maps wizard answers to (a) a plan category, (b) a priority module,
// (c) top-3 recommended tools with a real route, (d) suggested optional widgets.

export const ALGO_VERSION = 1;

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type PlanCategory =
  | "sueno"
  | "ansiedad"
  | "recuperacion"
  | "activacion"
  | "autoconocimiento"
  | "integral";

/** Tools with a real route in the app. Only these can appear in top3_tools. */
export type ToolModule =
  | "mindfulness"
  | "pensamientos"
  | "psicoeducacion"
  | "psicohigiene_sueno"
  | "habitos"
  | "pack_actividades"
  | "diario";

/** Widgets sin ruta (solo home). Se sugieren aparte, no cuentan como top3. */
export type WidgetModule = "frases_del_dia" | "noticias_psicologia";

export type AnyModule = ToolModule | WidgetModule;

export type SleepQuality = "reparador" | "interrumpido" | "insomnio" | "pesadillas";
export type LearningFormat = "lecturas" | "audios" | "practicas";

export type AlgoInput = {
  brujula: string[];              // multi-select Q "Qué brújula guía tu viaje"
  maleta: string[];               // multi-select Q "Qué maleta querés aligerar"
  sleep: SleepQuality | "";
  format: LearningFormat | "";
  country?: string | null;        // ISO or free-form; only "AR" unlocks pack
  life_stage?: string | null;     // stored as age string ("13".."90+")
};

export type AlgoResult = {
  plan_category: PlanCategory;
  priority_module: ToolModule;
  top3_tools: ToolModule[];
  suggested_widgets: WidgetModule[];
  module_scores: Record<AnyModule, number>;
  algo_version: number;
};

// ────────────────────────────────────────────────────────────────
// Mapping: wizard labels → algorithm answer keys
// (The wizard stores the raw Spanish label; we map it to a stable key.)
// ────────────────────────────────────────────────────────────────

const BRUJULA_KEY: Record<string, string> = {
  "Hacer las paces con mi almohada": "almohada",
  "Aprender a soltar el control": "control",
  "Apagar el ruido mental": "ruido",
  "Reconectar con mi chispa (Alegría)": "chispa",
  "Construir un refugio interno (Autoestima)": "refugio",
  "Navegar la tristeza sin ahogarme": "tristeza",
  "Enfocar mi mente dispersa": "mente",
  "Despertar mi lado creativo": "creativo",
};

const MALETA_KEY: Record<string, string> = {
  "Abrazar a mi niño/a interior": "nino",
  "Despedirme de un hábito caduco": "habito",
  "Pausar y mirarme por dentro": "pausa",
  "Hacer las paces con la comida": "comida",
  'Aprender a decir "no" sin culpa': "no",
  "Perdonarme por el pasado": "perdon",
};

// ────────────────────────────────────────────────────────────────
// Scoring tables (module points per answer, per Q, before Q-weight)
// ────────────────────────────────────────────────────────────────

const Q1_SCORES: Record<string, Partial<Record<AnyModule, number>>> = {
  almohada: { mindfulness: 3, psicohigiene_sueno: 3 },
  control:  { mindfulness: 2, pensamientos: 3, frases_del_dia: 2 },
  ruido:    { mindfulness: 3, psicoeducacion: 2 },
  chispa:   { pack_actividades: 3, frases_del_dia: 2, habitos: 2 },
  refugio:  { pensamientos: 3, psicoeducacion: 2, diario: 2 },
  tristeza: { pack_actividades: 3, mindfulness: 2, pensamientos: 1 },
  mente:    { habitos: 2, psicoeducacion: 2, mindfulness: 2 },
  creativo: { diario: 3, frases_del_dia: 2, habitos: 1 },
};

const Q2_SCORES: Record<string, Partial<Record<AnyModule, number>>> = {
  nino:   { mindfulness: 2, psicoeducacion: 2 },
  habito: { habitos: 2, pensamientos: 2 },
  pausa:  { diario: 2, mindfulness: 2 },
  comida: { pensamientos: 2, psicoeducacion: 2 },
  no:     { pensamientos: 2, habitos: 1, psicoeducacion: 1 },
  perdon: { diario: 2, mindfulness: 1, frases_del_dia: 2 },
};

const Q3_SCORES: Record<SleepQuality, Partial<Record<AnyModule, number>>> = {
  reparador:    { psicohigiene_sueno: 0.5 },
  interrumpido: { mindfulness: 1.5, psicohigiene_sueno: 1.5 },
  insomnio:     { mindfulness: 2.5, psicohigiene_sueno: 2, pensamientos: 1 },
  pesadillas:   { psicohigiene_sueno: 2.5, mindfulness: 2, pensamientos: 1.5 },
};

const Q4_MULTIPLIERS: Record<LearningFormat, Partial<Record<AnyModule, number>>> = {
  lecturas:  { psicoeducacion: 1.5, noticias_psicologia: 1.5 },
  audios:    { mindfulness: 1.5, psicoeducacion: 1.2 },
  practicas: { habitos: 1.5, pack_actividades: 1.5, diario: 1.2 },
};

/** Deterministic tiebreaker order — earlier wins on ties. */
const TIEBREAKER: ToolModule[] = [
  "mindfulness",
  "pensamientos",
  "psicohigiene_sueno",
  "pack_actividades",
  "habitos",
  "diario",
  "psicoeducacion",
];

const WIDGET_MODULES: WidgetModule[] = ["frases_del_dia", "noticias_psicologia"];
const TOOL_MODULES: ToolModule[] = [
  "mindfulness",
  "pensamientos",
  "psicoeducacion",
  "psicohigiene_sueno",
  "habitos",
  "pack_actividades",
  "diario",
];

// ────────────────────────────────────────────────────────────────
// Category assignment (with real fallback to "integral")
// ────────────────────────────────────────────────────────────────

export function assignCategory(input: AlgoInput): PlanCategory {
  const b = new Set(input.brujula.map((l) => BRUJULA_KEY[l]).filter(Boolean));
  const m = new Set(input.maleta.map((l) => MALETA_KEY[l]).filter(Boolean));
  const s = input.sleep;

  // 1. Sueño
  if (s === "insomnio" || s === "pesadillas" || s === "interrumpido") return "sueno";
  // 2. Ansiedad
  if (b.has("control") || b.has("ruido") || m.has("comida") || m.has("no")) return "ansiedad";
  // 3. Recuperación emocional
  if (b.has("tristeza") || m.has("perdon")) return "recuperacion";
  // 4. Activación
  if (b.has("chispa") || b.has("creativo") || m.has("habito")) return "activacion";
  // 5. Autoconocimiento
  if (m.has("nino") || m.has("pausa") || b.has("refugio")) return "autoconocimiento";
  // 6. Fallback (usuario con respuestas vacías o combinación no cubierta)
  return "integral";
}

// ────────────────────────────────────────────────────────────────
// Main calculation
// ────────────────────────────────────────────────────────────────

function emptyScores(): Record<AnyModule, number> {
  return {
    mindfulness: 0,
    pensamientos: 0,
    psicoeducacion: 0,
    psicohigiene_sueno: 0,
    habitos: 0,
    pack_actividades: 0,
    diario: 0,
    frases_del_dia: 0,
    noticias_psicologia: 0,
  };
}

// Runtime-overridable weights (mutated by applyAlgoOverrides from admin config).
export const RUNTIME_WEIGHTS = {
  q1_multiplier: 3,
  q2_multiplier: 2,
  q3_multiplier: 2.5,
  age_teen_boost: 1.2,
  pack_ar_only: true,
};

export function applyAlgoOverrides(w: Partial<typeof RUNTIME_WEIGHTS> | null | undefined) {
  if (!w) return;
  for (const k of Object.keys(RUNTIME_WEIGHTS) as (keyof typeof RUNTIME_WEIGHTS)[]) {
    if (w[k] !== undefined && w[k] !== null) (RUNTIME_WEIGHTS as any)[k] = w[k];
  }
}

export function calculatePlan(input: AlgoInput): AlgoResult {
  const scores = emptyScores();
  const W = RUNTIME_WEIGHTS;

  // Q1 — multi
  input.brujula.forEach((label) => {
    const key = BRUJULA_KEY[label];
    if (!key) return;
    const row = Q1_SCORES[key] ?? {};
    for (const [mod, pts] of Object.entries(row)) {
      scores[mod as AnyModule] += (pts ?? 0) * W.q1_multiplier;
    }
  });

  // Q2 — multi
  input.maleta.forEach((label) => {
    const key = MALETA_KEY[label];
    if (!key) return;
    const row = Q2_SCORES[key] ?? {};
    for (const [mod, pts] of Object.entries(row)) {
      scores[mod as AnyModule] += (pts ?? 0) * W.q2_multiplier;
    }
  });

  // Q3 — sleep
  if (input.sleep) {
    const row = Q3_SCORES[input.sleep] ?? {};
    for (const [mod, pts] of Object.entries(row)) {
      scores[mod as AnyModule] += (pts ?? 0) * W.q3_multiplier;
    }
  }

  // Q4 — format multipliers (only on modules already scoring > 0)
  if (input.format) {
    const row = Q4_MULTIPLIERS[input.format] ?? {};
    for (const [mod, mult] of Object.entries(row)) {
      if (scores[mod as AnyModule] > 0) {
        scores[mod as AnyModule] *= mult ?? 1;
      }
    }
  }

  // Soft modifiers
  const countryNorm = (input.country ?? "").toLowerCase().trim();
  const isAR =
    countryNorm === "ar" ||
    countryNorm === "argentina" ||
    countryNorm.includes("argentin");
  if (W.pack_ar_only && !isAR) {
    scores.pack_actividades = 0;
  }

  const ageNum = parseInt(input.life_stage ?? "", 10);
  if (!Number.isNaN(ageNum) && ageNum >= 13 && ageNum <= 25) {
    scores.habitos *= W.age_teen_boost;
  }


  // Rank tool modules with deterministic tiebreaker
  const rankedTools = [...TOOL_MODULES]
    .filter((m) => scores[m] > 0)
    .sort((a, b) => {
      const diff = scores[b] - scores[a];
      if (diff !== 0) return diff;
      return TIEBREAKER.indexOf(a) - TIEBREAKER.indexOf(b);
    });

  const top3_tools: ToolModule[] = rankedTools.slice(0, 3);
  // Ensure we always return at least one priority module — fall back to mindfulness
  const priority_module: ToolModule = top3_tools[0] ?? "mindfulness";

  // Suggested widgets: any widget-module with score > 0, sorted desc
  const suggested_widgets = [...WIDGET_MODULES]
    .filter((w) => scores[w] > 0)
    .sort((a, b) => scores[b] - scores[a]);

  return {
    plan_category: assignCategory(input),
    priority_module,
    top3_tools,
    suggested_widgets,
    module_scores: scores,
    algo_version: ALGO_VERSION,
  };
}

// ────────────────────────────────────────────────────────────────
// Category display content (title / description / icon / accent)
// ────────────────────────────────────────────────────────────────

export type CategoryContent = {
  title: string;
  subtitle: string;
  description: string;
  icon: "moon" | "wind" | "heart" | "spark" | "compass" | "orbit";
  accent: string; // hex
};

export const CATEGORY_CONTENT: Record<PlanCategory, CategoryContent> = {
  sueno: {
    title: "Tu plan del descanso",
    subtitle: "Recuperar el sueño",
    description:
      "Tu prioridad es reconectar con un sueño reparador. Vamos a acompañarte con prácticas suaves para acomodar el cuerpo, la mente y las noches.",
    icon: "moon",
    accent: "#6d5bd0",
  },
  ansiedad: {
    title: "Tu plan de la calma",
    subtitle: "Bajar el volumen mental",
    description:
      "Vamos a trabajar en aflojar la tensión, gestionar la sobre-activación y darle herramientas concretas a esos momentos difíciles.",
    icon: "wind",
    accent: "#7cc2c8",
  },
  recuperacion: {
    title: "Tu plan de reencuentro",
    subtitle: "Recuperación emocional",
    description:
      "Este es un espacio para navegar la tristeza sin ahogarte, honrar lo que dolió y volver a habitarte con ternura.",
    icon: "heart",
    accent: "#f291b2",
  },
  activacion: {
    title: "Tu plan del impulso",
    subtitle: "Activar tu chispa",
    description:
      "Vamos a reconectar con lo que te mueve: micro-acciones, hábitos y prácticas que devuelven energía y sentido.",
    icon: "spark",
    accent: "#facb60",
  },
  autoconocimiento: {
    title: "Tu plan del adentro",
    subtitle: "Mirarte con curiosidad",
    description:
      "Un camino para pausar, escucharte y construir un refugio interno. Vamos a acompañarte en ese diálogo íntimo.",
    icon: "compass",
    accent: "#c47a55",
  },
  integral: {
    title: "Tu plan integral",
    subtitle: "Un poco de cada práctica",
    description:
      "Elegimos un recorrido balanceado para que explores distintas herramientas y encuentres lo que más resuena con vos.",
    icon: "orbit",
    accent: "#5dbf9a",
  },
};

// ────────────────────────────────────────────────────────────────
// Tool metadata (label + route + widget id for home seeding)
// ────────────────────────────────────────────────────────────────

export type ToolMeta = {
  label: string;
  short: string;
  route: string;
  /** Widget id used when seeding home_layouts.widgets after signup. */
  widget_id: string;
};

export const TOOL_META: Record<ToolModule, ToolMeta> = {
  mindfulness: {
    label: "Mindfulness y respiración",
    short: "Mindfulness",
    route: "/herramientas/mindfulness",
    widget_id: "mindfulness_quick",
  },
  pensamientos: {
    label: "Gestión de pensamientos",
    short: "Pensamientos",
    route: "/herramientas/pensamientos",
    widget_id: "pensamientos_quick",
  },
  psicoeducacion: {
    label: "Biblioteca de psicoeducación",
    short: "Psicoeducación",
    route: "/psicoeducacion",
    widget_id: "psico_quick",
  },
  psicohigiene_sueno: {
    label: "Santuario del sueño",
    short: "Sueño",
    route: "/herramientas/sueno",
    widget_id: "sleep_zone",
  },
  habitos: {
    label: "Hábitos y rutinas",
    short: "Hábitos",
    route: "/diario-inteligente/gestion-pensamientos/habitos",
    widget_id: "mini_habits",
  },
  pack_actividades: {
    label: "Pack de activación",
    short: "Pack",
    route: "/herramientas/pack",
    widget_id: "pack_quick",
  },
  diario: {
    label: "Diario íntimo",
    short: "Diario",
    route: "/diario",
    widget_id: "diario_quick",
  },
};

// ────────────────────────────────────────────────────────────────
// LocalStorage cache (compat with previous clinicalAlgorithm.saveLocalProfile)
// ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "resma:profile";

export function saveLocalProfile(payload: {
  priority: string;
  scores: Record<string, number>;
  sleep: SleepQuality | "";
  format: LearningFormat | "";
  plan_category?: PlanCategory;
  top3_tools?: ToolModule[];
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readLocalProfile(): {
  priority: string;
  scores: Record<string, number>;
  plan_category?: PlanCategory;
  top3_tools?: ToolModule[];
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
