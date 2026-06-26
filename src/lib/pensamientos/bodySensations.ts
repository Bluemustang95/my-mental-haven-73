import type { EmotionKey } from "./emotions";

export type BodySensation = {
  id: string;
  label: string;
  emoji: string;
  linkedEmotions: EmotionKey[];
};

export const BODY_SENSATIONS: BodySensation[] = [
  { id: "chest", label: "Pecho oprimido / Palpitaciones", emoji: "🫁", linkedEmotions: ["ansiedad", "miedo"] },
  { id: "stomach", label: "Vacío / Nudo en el estómago", emoji: "🤢", linkedEmotions: ["ansiedad", "tristeza", "miedo"] },
  { id: "head", label: "Dolor / Presión de cabeza", emoji: "🧠", linkedEmotions: ["ansiedad", "frustracion"] },
  { id: "throat", label: "Nudo en la garganta", emoji: "🗣️", linkedEmotions: ["tristeza", "ansiedad", "verguenza"] },
  { id: "jaw", label: "Mandíbula / Dientes apretados", emoji: "🦷", linkedEmotions: ["enojo", "frustracion"] },
  { id: "face", label: "Calor en la cara / Rubor", emoji: "🥵", linkedEmotions: ["verguenza", "enojo", "culpa"] },
  { id: "shoulders", label: "Hombros tensos / Contractura", emoji: "👤", linkedEmotions: ["ansiedad", "frustracion", "enojo"] },
  { id: "hands", label: "Manos frías / Sudorosas", emoji: "✋", linkedEmotions: ["ansiedad", "miedo"] },
  { id: "fists", label: "Tensión en puños / Brazos", emoji: "✊", linkedEmotions: ["enojo", "frustracion"] },
  { id: "heavy", label: "Pesadez en todo el cuerpo", emoji: "🛏️", linkedEmotions: ["tristeza", "culpa"] },
  { id: "breath", label: "Respiración entrecortada", emoji: "💨", linkedEmotions: ["ansiedad", "miedo", "enojo"] },
  { id: "tears", label: "Ganas de llorar", emoji: "💧", linkedEmotions: ["tristeza", "culpa", "verguenza"] },
];
