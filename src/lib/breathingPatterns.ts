export type PhaseId = "inhale" | "inhale2" | "hold" | "exhale" | "pause";

export type BreathPhase = {
  label: string;
  seconds: number;
  scale: number;
  color: string;
  speech: string;
  haptic: "inhale" | "hold" | "exhale";
  phaseId: PhaseId;
};

export type BreathingPattern = {
  id: string;
  name: string;
  short: string;
  description: string;
  phases: BreathPhase[];
};

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: "box",
    name: "Box 4-4-4-4",
    short: "Regulación general",
    description: "Cuatro tiempos iguales. Aterriza y equilibra el sistema nervioso.",
    phases: [
      { label: "Inhalá", seconds: 4, scale: 1.18, color: "#FB923C", speech: "Inhalá suave.", haptic: "inhale", phaseId: "inhale" },
      { label: "Sostené", seconds: 4, scale: 1.18, color: "#FCD34D", speech: "Sostené sin forzar.", haptic: "hold", phaseId: "hold" },
      { label: "Exhalá", seconds: 4, scale: 0.88, color: "#60A5FA", speech: "Exhalá despacio.", haptic: "exhale", phaseId: "exhale" },
      { label: "Pausa", seconds: 4, scale: 0.88, color: "#818CF8", speech: "Pausa. Quedate ahí.", haptic: "hold", phaseId: "pause" },
    ],
  },
  {
    id: "478",
    name: "4-7-8",
    short: "Ansiedad / sueño",
    description: "Exhalación larga que activa el sistema parasimpático. Ideal antes de dormir.",
    phases: [
      { label: "Inhalá", seconds: 4, scale: 1.18, color: "#FB923C", speech: "Inhalá por la nariz.", haptic: "inhale", phaseId: "inhale" },
      { label: "Sostené", seconds: 7, scale: 1.18, color: "#FCD34D", speech: "Sostené.", haptic: "hold", phaseId: "hold" },
      { label: "Exhalá", seconds: 8, scale: 0.85, color: "#60A5FA", speech: "Exhalá por la boca, lento.", haptic: "exhale", phaseId: "exhale" },
    ],
  },
  {
    id: "coherence",
    name: "Coherencia 5-5",
    short: "El más validado",
    description: "Seis respiraciones por minuto. Mejora la variabilidad cardíaca.",
    phases: [
      { label: "Inhalá", seconds: 5, scale: 1.2, color: "#FB923C", speech: "Inhalá con calma.", haptic: "inhale", phaseId: "inhale" },
      { label: "Exhalá", seconds: 5, scale: 0.85, color: "#60A5FA", speech: "Exhalá con calma.", haptic: "exhale", phaseId: "exhale" },
    ],
  },
  {
    id: "sigh",
    name: "Suspiro fisiológico",
    short: "Baja ansiedad rápido",
    description: "Dos inhalaciones cortas y una exhalación larga. Eficaz en pocos minutos.",
    phases: [
      { label: "Inhalá", seconds: 2, scale: 1.1, color: "#FB923C", speech: "Inhalá.", haptic: "inhale", phaseId: "inhale" },
      { label: "Inhalá más", seconds: 1, scale: 1.22, color: "#FB923C", speech: "Una pizca más.", haptic: "inhale", phaseId: "inhale2" },
      { label: "Exhalá largo", seconds: 6, scale: 0.85, color: "#60A5FA", speech: "Exhalá largo por la boca.", haptic: "exhale", phaseId: "exhale" },
    ],
  },
];

export function getPattern(id: string): BreathingPattern {
  return BREATHING_PATTERNS.find((p) => p.id === id) ?? BREATHING_PATTERNS[0];
}
