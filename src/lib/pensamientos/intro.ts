export const INTRO_FLAG_KEY = "resma:pensamientos:intro-v1";

export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_FLAG_KEY, "1");
  } catch {}
}

export type Lector = {
  id: string;
  emoji: string;
  nombre: string;
  pensamiento: string;
  emocion: string;
  color: string;
};

export const LECTORES: Lector[] = [
  {
    id: "A",
    emoji: "🤩",
    nombre: "Lector A",
    pensamiento: "¡Esto es genial! Por fin un libro que me va a enseñar.",
    emocion: "Entusiasmo",
    color: "#facb60",
  },
  {
    id: "B",
    emoji: "😒",
    nombre: "Lector B",
    pensamiento: "Esto es demasiado simplista. No va a funcionar.",
    emocion: "Decepción",
    color: "#9CA3AF",
  },
  {
    id: "C",
    emoji: "😡",
    nombre: "Lector C",
    pensamiento: "No es lo que esperaba. Tiré la plata.",
    emocion: "Disgusto",
    color: "#FCA5A5",
  },
  {
    id: "D",
    emoji: "😟",
    nombre: "Lector D",
    pensamiento: "¿Y si no llego a entenderlo?",
    emocion: "Angustia",
    color: "#A78BFA",
  },
  {
    id: "E",
    emoji: "😞",
    nombre: "Lector E",
    pensamiento: "Es muy difícil, nunca lo voy a aprender.",
    emocion: "Tristeza",
    color: "#60A5FA",
  },
];

export type Camino2 = {
  id: "alerta" | "calma";
  emoji: string;
  pensamiento: string;
  emocion: string;
  cuerpo: string;
  conducta: string;
  color: string;
};

export const CAMINOS_VENTANA: Camino2[] = [
  {
    id: "alerta",
    emoji: "🚨",
    pensamiento: "¡Es un ladrón!",
    emocion: "Pánico",
    cuerpo: "Taquicardia, sudoración",
    conducta: "Me escondo, llamo a la policía",
    color: "#FCA5A5",
  },
  {
    id: "calma",
    emoji: "🍃",
    pensamiento: "Es el viento",
    emocion: "Tranquilidad",
    cuerpo: "Ritmo cardíaco normal",
    conducta: "Me doy vuelta y sigo durmiendo",
    color: "#A7F3D0",
  },
];

export const DISTORSIONES = [
  { k: "dicotomico", t: "Dicotómico", d: "Todo o nada. Sin matices.", e: "“Si no soy un triunfador absoluto, soy un fracasado.”" },
  { k: "catastrofico", t: "Catastrófico", d: "Predecir lo peor sin considerar otras opciones.", e: "“Voy a estar tan mal que no podré hacer nada.”" },
  { k: "descalificar", t: "Descalificar lo positivo", d: "Lo bueno “no cuenta”.", e: "“Hice bien el proyecto, pero fue suerte.”" },
  { k: "razonamiento_emocional", t: "Razonamiento emocional", d: "“Si lo siento, es real.”", e: "“Me siento un fracaso, entonces lo soy.”" },
  { k: "catalogar", t: "Catalogar", d: "Etiquetas globales a vos o a otros.", e: "“Soy un perdedor.”" },
  { k: "magnificar", t: "Magnificar / Minimizar", d: "Agrandás lo negativo, achicás lo positivo.", e: "“Una nota mediocre prueba que soy inútil.”" },
  { k: "abstraccion_selectiva", t: "Abstracción selectiva", d: "Te enfocás en un detalle negativo y olvidás el resto.", e: "“Saqué un puntaje bajo, soy un inútil.”" },
  { k: "leer_mente", t: "Leer la mente", d: "Asumís lo que otros piensan, sin chequear.", e: "“Está pensando mal de mí.”" },
  { k: "sobregeneralizacion", t: "Sobregeneralización", d: "Una situación = una regla universal.", e: "“No me sentí cómodo, no sé hacer amigos.”" },
  { k: "personalizacion", t: "Personalización", d: "Te lo tomás todo personal.", e: "“Fue parco conmigo porque hice algo mal.”" },
  { k: "debo_tengo_que", t: "Debo / Tengo que", d: "Reglas rígidas que sobrestiman lo malo de incumplir.", e: "“Es horrible cometer errores.”" },
];
