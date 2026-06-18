export type TrainerItem = {
  id: string;
  text: string;
  answer: "hecho" | "pensamiento";
  justification: string;
};

export const TRAINER_ITEMS: TrainerItem[] = [
  {
    id: "t1",
    text: "Mi jefa corrigió mi informe y me marcó tres errores de redacción.",
    answer: "hecho",
    justification:
      "Es un dato observable y verificable: marcó tres errores concretos. No incluye interpretación sobre qué significa.",
  },
  {
    id: "t2",
    text: "Mi jefa lo hizo a propósito porque piensa que soy un inútil.",
    answer: "pensamiento",
    justification:
      "Es una interpretación: vos no podés verificar las intenciones de tu jefa ni lo que ella piensa de vos. Es lectura de mente.",
  },
  {
    id: "t3",
    text: "Tengo la certeza absoluta de que me va a ir pésimo mañana.",
    answer: "pensamiento",
    justification:
      "Es una predicción catastrófica: el futuro todavía no ocurrió, no hay manera de tener certeza absoluta sobre lo que va a pasar.",
  },
  {
    id: "t4",
    text: "El reporte indica un descenso del 12% con respecto al mes pasado.",
    answer: "hecho",
    justification:
      "Es un dato cuantitativo y verificable. No incluye juicio de valor sobre vos ni sobre el equipo.",
  },
];
