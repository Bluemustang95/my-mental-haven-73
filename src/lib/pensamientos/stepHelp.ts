export type StepHelp = {
  title: string;
  body: string[];
  llave: string;
};

export const STEP_HELP: Record<number, StepHelp> = {
  1: {
    title: "Situación",
    body: [
      "Describí los hechos como si fueras una cámara de video: qué ocurrió, dónde, con quién. Sin adjetivos, sin juicios.",
      "Separar el hecho de la interpretación es el primer paso para desarmar la rumiación.",
    ],
    llave: "¿Qué vería una cámara si filmara este momento?",
  },
  2: {
    title: "Pensamiento automático",
    body: [
      "Son ideas veloces que aparecen sin invitarlas y se presentan como verdades absolutas — aunque son sólo hipótesis.",
      "Escribilo tal como cruzó tu mente, sin suavizarlo.",
    ],
    llave: "¿Qué acaba de pasar por mi mente?",
  },
  3: {
    title: "Emociones",
    body: [
      "Las emociones nos dan información sobre cómo interpretamos la situación.",
      "Identificar la emoción principal y profundizar en subemociones te ayuda a nombrar con precisión lo que sentís.",
    ],
    llave: "¿Qué siento exactamente, y con qué intensidad?",
  },
  4: {
    title: "Conducta",
    body: [
      "Es lo que hiciste o dejaste de hacer en respuesta al pensamiento y la emoción.",
      "Observar la conducta sin juzgarla te muestra patrones que podrías querer modificar.",
    ],
    llave: "¿Qué hice, dije o evité hacer?",
  },
  5: {
    title: "Sensaciones corporales",
    body: [
      "El cuerpo registra las emociones antes que la mente. Pecho oprimido, nudo en el estómago, tensión en la mandíbula son señales valiosas.",
      "Reconocerlas te permite anclarte en el presente y regularte.",
    ],
    llave: "¿Dónde lo siento en mi cuerpo ahora mismo?",
  },
  6: {
    title: "Balanza de evidencias",
    body: [
      "Sumá hechos concretos a favor y en contra de tu pensamiento. Solo hechos observables — no interpretaciones.",
      "La balanza te muestra cuán sostenido por la realidad está realmente.",
    ],
    llave: "¿Qué prueba objetiva tengo de que esto sea cierto?",
  },
  7: {
    title: "Distorsiones cognitivas",
    body: [
      "Son patrones de pensamiento sesgados que distorsionan la realidad sin que lo notemos.",
      "Identificarlos te permite ver el pensamiento con más distancia.",
    ],
    llave: "¿Qué filtro mental podría estar usando?",
  },
  8: {
    title: "Resolución del pensamiento",
    body: [
      "Si los hechos no sostienen el pensamiento, reestructurálo con una respuesta más adaptativa y realista.",
      "Si los hechos lo sostienen, planificá un curso de acción asertivo para abordar la situación.",
    ],
    llave: "¿Qué pensamiento o acción me acerca más a lo que valoro?",
  },
};

export const STEP_TITLES = [
  "Situación",
  "Pensamiento automático",
  "Emociones",
  "Conducta",
  "Sensaciones corporales",
  "Pros y contras",
  "Distorsiones cognitivas",
  "Resolución",
];

export const STEP_GROUPS = [
  "Identificar",
  "Identificar",
  "Identificar",
  "Identificar",
  "Identificar",
  "Evaluar",
  "Evaluar",
  "Reestructurar",
];
