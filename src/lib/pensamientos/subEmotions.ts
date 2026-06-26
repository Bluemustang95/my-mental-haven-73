import type { EmotionKey } from "./emotions";

export const SUB_EMOTIONS: Record<EmotionKey, string[]> = {
  ansiedad: ["Inquietud", "Preocupación", "Tensión", "Sobrecarga", "Pánico"],
  tristeza: ["Desánimo", "Soledad", "Nostalgia", "Vacío", "Desesperanza"],
  enojo: ["Irritación", "Indignación", "Furia", "Resentimiento", "Hostilidad"],
  culpa: ["Remordimiento", "Auto-reproche", "Pesar", "Arrepentimiento"],
  verguenza: ["Bochorno", "Humillación", "Inadecuación", "Exposición"],
  frustracion: ["Impotencia", "Hartazgo", "Bloqueo", "Decepción"],
  celos: ["Inseguridad", "Posesividad", "Comparación", "Desconfianza"],
  miedo: ["Susto", "Terror", "Aprensión", "Inquietud anticipada"],
  otro: [],
};
