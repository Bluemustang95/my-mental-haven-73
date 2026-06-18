export type EmotionKey =
  | "ansiedad" | "tristeza" | "enojo" | "culpa" | "verguenza"
  | "frustracion" | "celos" | "miedo" | "otro";

export const EMOTIONS: { key: EmotionKey; label: string; emoji: string }[] = [
  { key: "ansiedad", label: "Ansiedad", emoji: "😰" },
  { key: "tristeza", label: "Tristeza", emoji: "😢" },
  { key: "enojo", label: "Enojo", emoji: "😠" },
  { key: "culpa", label: "Culpa", emoji: "😔" },
  { key: "verguenza", label: "Vergüenza", emoji: "🙈" },
  { key: "frustracion", label: "Frustración", emoji: "😤" },
  { key: "celos", label: "Celos", emoji: "💚" },
  { key: "miedo", label: "Miedo", emoji: "😨" },
  { key: "otro", label: "Otro", emoji: "✨" },
];

// Step 1 didactic content
export type Camino = "catastrofista" | "sabia";

export const CAMINO_OPCIONES: Record<Camino, { emotionKey: string; label: string }[]> = {
  catastrofista: [
    { emotionKey: "panico", label: "Pánico Absoluto 😱" },
    { emotionKey: "temor", label: "Temor intenso 😨" },
    { emotionKey: "alerta", label: "Alerta máxima 🚨" },
  ],
  sabia: [
    { emotionKey: "molestia", label: "Leve molestia 😐" },
    { emotionKey: "tranquilidad", label: "Tranquilidad 🍃" },
    { emotionKey: "curiosidad", label: "Curiosidad 🤔" },
  ],
};

export const FISIOLOGIA_MAP: Record<string, string> = {
  panico: "Taquicardia severa y sudoración",
  temor: "Respiración entrecortada y tensión muscular",
  alerta: "Pupilas dilatadas y rigidez corporal",
  molestia: "Ligera tensión que se disipa rápido",
  tranquilidad: "Ritmo cardíaco liso y relajado",
  curiosidad: "Atención despierta, cuerpo en calma",
};

export const CONDUCTA_MAP: Record<Camino, string> = {
  catastrofista: "Me escondo abajo de las sábanas, llamo a la policía y no me muevo",
  sabia: "Me doy la vuelta y sigo durmiendo tranquilamente",
};
