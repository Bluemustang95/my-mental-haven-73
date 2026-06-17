// Rueda de emociones tipo Plutchik adaptada al modelo DBT.
// 9 emociones primarias del DBT con 4-5 matices (nuances) cada una.
import type { DbtEmotion } from "./data";

export interface EmotionNuance {
  label: string;
  /** intensidad relativa 0-1 (afecta saturación del color) */
  intensity: number;
}

export const EMOTION_NUANCES: Record<DbtEmotion, EmotionNuance[]> = {
  Miedo: [
    { label: "Inquietud", intensity: 0.35 },
    { label: "Ansiedad", intensity: 0.55 },
    { label: "Temor", intensity: 0.7 },
    { label: "Pánico", intensity: 0.95 },
  ],
  Enojo: [
    { label: "Fastidio", intensity: 0.3 },
    { label: "Frustración", intensity: 0.5 },
    { label: "Resentimiento", intensity: 0.7 },
    { label: "Ira", intensity: 0.95 },
  ],
  Tristeza: [
    { label: "Nostalgia", intensity: 0.3 },
    { label: "Melancolía", intensity: 0.5 },
    { label: "Pena", intensity: 0.7 },
    { label: "Desolación", intensity: 0.95 },
  ],
  Vergüenza: [
    { label: "Pudor", intensity: 0.35 },
    { label: "Bochorno", intensity: 0.55 },
    { label: "Humillación", intensity: 0.8 },
    { label: "Mortificación", intensity: 0.95 },
  ],
  Asco: [
    { label: "Disgusto", intensity: 0.4 },
    { label: "Repulsión", intensity: 0.65 },
    { label: "Aversión", intensity: 0.85 },
  ],
  Culpa: [
    { label: "Remordimiento leve", intensity: 0.35 },
    { label: "Culpa", intensity: 0.6 },
    { label: "Auto-reproche", intensity: 0.8 },
    { label: "Auto-desprecio", intensity: 0.95 },
  ],
  Envidia: [
    { label: "Comparación", intensity: 0.3 },
    { label: "Envidia", intensity: 0.6 },
    { label: "Resentimiento envidioso", intensity: 0.85 },
  ],
  Celos: [
    { label: "Inseguridad", intensity: 0.35 },
    { label: "Celos", intensity: 0.6 },
    { label: "Posesividad", intensity: 0.85 },
    { label: "Sospecha persecutoria", intensity: 0.95 },
  ],
  Amor: [
    { label: "Afecto", intensity: 0.4 },
    { label: "Cariño", intensity: 0.6 },
    { label: "Amor", intensity: 0.8 },
    { label: "Devoción", intensity: 0.95 },
  ],
};

/** Orden visual de los sectores en la rueda (sentido horario desde arriba). */
export const WHEEL_ORDER: DbtEmotion[] = [
  "Amor", "Miedo", "Vergüenza", "Culpa", "Asco", "Enojo", "Envidia", "Celos", "Tristeza",
];
