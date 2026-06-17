// Lightweight clinical personalization algorithm for the RESMA onboarding.
// Maps free-form wizard answers onto canonical practice modules so we can pick
// a "priority" module and surface dynamic content.

export type Module =
  | "mindfulness"
  | "regulacion-emocional"
  | "tolerancia-malestar"
  | "efectividad-personal"
  | "gestion-pensamientos"
  | "sueno"
  | "autoestima";

export const MODULE_LABEL: Record<Module, string> = {
  mindfulness: "Mindfulness",
  "regulacion-emocional": "Regulación Emocional",
  "tolerancia-malestar": "Tolerancia al Malestar",
  "efectividad-personal": "Efectividad Personal",
  "gestion-pensamientos": "Gestión de Pensamientos",
  sueno: "Higiene del Sueño",
  autoestima: "Autoestima",
};

const BRUJULA_MAP: Record<string, Module[]> = {
  "Hacer las paces con mi almohada": ["sueno"],
  "Aprender a soltar el control": ["tolerancia-malestar"],
  "Apagar el ruido mental": ["mindfulness", "gestion-pensamientos"],
  "Reconectar con mi chispa (Alegría)": ["regulacion-emocional"],
  "Construir un refugio interno (Autoestima)": ["autoestima"],
  "Navegar la tristeza sin ahogarme": ["regulacion-emocional"],
  "Enfocar mi mente dispersa": ["mindfulness", "efectividad-personal"],
  "Despertar mi lado creativo": ["efectividad-personal"],
};

const MALETA_MAP: Record<string, Module[]> = {
  "Abrazar a mi niño/a interior": ["autoestima"],
  "Despedirme de un hábito caduco": ["efectividad-personal"],
  "Pausar y mirarme por dentro": ["mindfulness"],
  "Hacer las paces con la comida": ["regulacion-emocional"],
  'Aprender a decir "no" sin culpa': ["efectividad-personal"],
  "Perdonarme por el pasado": ["autoestima"],
};

export type SleepQuality = "reparador" | "interrumpido" | "insomnio" | "pesadillas";
export type LearningFormat = "lecturas" | "audios" | "practicas";

export type AlgoInput = {
  brujula: string[];
  maleta: string[];
  sleep: SleepQuality | "";
  format: LearningFormat | "";
};

export type AlgoResult = {
  priority: Module;
  scores: Record<Module, number>;
};

export function computePriority(input: AlgoInput): AlgoResult {
  const scores: Record<Module, number> = {
    mindfulness: 0,
    "regulacion-emocional": 0,
    "tolerancia-malestar": 0,
    "efectividad-personal": 0,
    "gestion-pensamientos": 0,
    sueno: 0,
    autoestima: 0,
  };

  input.brujula.forEach((opt) => {
    (BRUJULA_MAP[opt] ?? []).forEach((m) => (scores[m] += 3));
  });
  input.maleta.forEach((opt) => {
    (MALETA_MAP[opt] ?? []).forEach((m) => (scores[m] += 3));
  });

  if (
    input.sleep === "interrumpido" ||
    input.sleep === "insomnio" ||
    input.sleep === "pesadillas"
  ) {
    scores.sueno += 2;
    scores.mindfulness += 1;
  }

  if (input.format === "audios") scores.mindfulness += 1;
  if (input.format === "practicas") scores["regulacion-emocional"] += 1;
  if (input.format === "lecturas") scores["gestion-pensamientos"] += 1;

  let priority: Module = "mindfulness";
  let best = -1;
  (Object.keys(scores) as Module[]).forEach((m) => {
    if (scores[m] > best) {
      best = scores[m];
      priority = m;
    }
  });

  return { priority, scores };
}

const STORAGE_KEY = "resma:profile";

export function saveLocalProfile(payload: {
  priority: Module;
  scores: Record<Module, number>;
  sleep: SleepQuality | "";
  format: LearningFormat | "";
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readLocalProfile(): {
  priority: Module;
  scores: Record<Module, number>;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
