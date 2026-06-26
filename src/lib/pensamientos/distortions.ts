export type Distortion = {
  key: string;
  label: string;
  emoji: string;
  desc: string;
};

export const DISTORTIONS: Distortion[] = [
  {
    key: "dicotomico",
    label: "Pensamiento Dicotómico",
    emoji: "⚫⚪",
    desc: "Ver las situaciones en blanco o negro, sin matices intermedios.",
  },
  {
    key: "catastrofico",
    label: "Catastrófico",
    emoji: "🌪️",
    desc: "Anticipar el peor escenario imaginable como un hecho.",
  },
  {
    key: "lectura_mente",
    label: "Lectura de mente",
    emoji: "🔮",
    desc: "Asumir que sabés exactamente qué piensan otros de vos.",
  },
  {
    key: "descalificar",
    label: "Descalificar lo positivo",
    emoji: "❌",
    desc: "Anular las cosas buenas y enfocarte en lo negativo.",
  },
];
