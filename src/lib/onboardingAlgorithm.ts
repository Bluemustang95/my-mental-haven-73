// src/lib/onboardingAlgorithm.ts

export type OnboardingResponses = {
  q1: string[]; // Puede elegir varias (almohada, control, ruido, chispa, refugio, tristeza, mente, creativo)
  q2: string;   // Solo una (nino, habito, pausa, comida, no, perdon)
  q3: string;   // Solo una (reparador, interrumpido, cuesta, pesadillas)
  q4: string;   // Solo una (lectura, audios, practico)
};

export function assignCategory(responses: OnboardingResponses): string {
  const { q1, q2, q3 } = responses;

  // 1. Prioridad Sueño
  if (["cuesta", "pesadillas", "interrumpido"].includes(q3)) {
    return "sueno";
  }

  // 2. Prioridad Ansiedad
  if (q1.some(k => ["control", "ruido"].includes(k)) || ["comida", "no"].includes(q2)) {
    return "ansiedad";
  }

  // 3. Prioridad Recuperación Emocional
  if (q1.includes("tristeza") || q2 === "perdon") {
    return "recuperacion";
  }

  // 4. Prioridad Activación y Motivación
  if (q1.some(k => ["chispa", "creativo"].includes(k)) || q2 === "habito") {
    return "activacion";
  }

  // 5. Prioridad Autoconocimiento
  if (["nino", "pausa"].includes(q2) || q1.includes("refugio")) {
    return "autoconocimiento";
  }

  // 6. Default
  return "integral";
}

const question1Scores: Record<string, Record<string, number>> = {
  "almohada":  { mindfulness: 3, psicohigiene_sueno: 3 },
  "control":   { mindfulness: 2, pensamientos: 3, frases_del_dia: 2 },
  "ruido":     { mindfulness: 3, psicoeducacion: 2 },
  "chispa":    { pack_actividades: 3, frases_del_dia: 2, habitos: 2 },
  "refugio":   { pensamientos: 3, psicoeducacion: 2, diario: 2 },
  "tristeza":  { pack_actividades: 3, mindfulness: 2, pensamientos: 1 },
  "mente":     { habitos: 2, psicoeducacion: 2, mindfulness: 2 },
  "creativo":  { diario: 3, frases_del_dia: 2, habitos: 1 }
};

const question2Scores: Record<string, Record<string, number>> = {
  "nino":    { mindfulness: 2, psicoeducacion: 2 },
  "habito":  { habitos: 2, pensamientos: 2 },
  "pausa":   { diario: 2, mindfulness: 2 },
  "comida":  { pensamientos: 2, psicoeducacion: 2 },
  "no":      { pensamientos: 2, habitos: 1, psicoeducacion: 1 },
  "perdon":  { diario: 2, mindfulness: 1, frases_del_dia: 2 }
};

const question3Scores: Record<string, Record<string, number>> = {
  "reparador":    { psicohigiene_sueno: 0.5 },
  "interrumpido": { mindfulness: 1.5, psicohigiene_sueno: 1.5 },
  "cuesta":       { mindfulness: 2.5, psicohigiene_sueno: 2, pensamientos: 1 },
  "pesadillas":   { psicohigiene_sueno: 2.5, mindfulness: 2, pensamientos: 1.5 }
};

const question4Multipliers: Record<string, Record<string, number>> = {
  "lectura":   { psicoeducacion: 1.5, noticias_psicologia: 1.5 },
  "audios":    { mindfulness: 1.5, psicoeducacion: 1.2 },
  "practico":  { habitos: 1.5, pack_actividades: 1.5, diario: 1.2 }
};

export function calculateHomeModules(responses: OnboardingResponses) {
  const { q1, q2, q3, q4 } = responses;

  const scores: Record<string, number> = {
    diario: 0, mindfulness: 0, pensamientos: 0,
    frases_del_dia: 0, noticias_psicologia: 0,
    psicoeducacion: 0, psicohigiene_sueno: 0,
    habitos: 0, pack_actividades: 0
  };

  // Q1 (peso ×3) - Como es un array, iteramos sobre cada selección
  q1.forEach(answer => {
    const q1w = question1Scores[answer] || {};
    for (const [mod, pts] of Object.entries(q1w)) scores[mod] += pts * 3;
  });

  // Q2 (peso ×2)
  const q2w = question2Scores[q2] || {};
  for (const [mod, pts] of Object.entries(q2w)) scores[mod] += pts * 2;

  // Q3 (peso ×2.5)
  const q3w = question3Scores[q3] || {};
  for (const [mod, pts] of Object.entries(q3w)) scores[mod] += pts * 2.5;

  // Multiplicadores Q4
  const q4m = question4Multipliers[q4] || {};
  for (const [mod, mult] of Object.entries(q4m)) {
    if (scores[mod] > 0) scores[mod] *= mult;
  }

  // Top 3
  const top3 = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)
    .slice(0, 3)
    .map(([id]) => id);

  return {
    fixed: ["valoraciones"],
    dynamic: top3,
    category: assignCategory(responses)
  };
}
