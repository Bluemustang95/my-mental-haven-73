// Datos clínicos estáticos extraídos de las Fichas DBT de Marsha Linehan
// Ficha 8A · 10 · 13

export type DbtEmotion =
  | "Miedo" | "Enojo" | "Tristeza" | "Vergüenza" | "Asco"
  | "Culpa" | "Envidia" | "Celos" | "Amor";

export const EMOTIONS: DbtEmotion[] = [
  "Miedo", "Enojo", "Tristeza", "Vergüenza", "Asco", "Culpa", "Envidia", "Celos", "Amor",
];

export const EMOTION_TINT: Record<DbtEmotion, string> = {
  Miedo: "#a08bd6",
  Enojo: "#e07a6b",
  Tristeza: "#7aa5c8",
  Vergüenza: "#d6a08b",
  Asco: "#8bb88f",
  Culpa: "#c89bb8",
  Envidia: "#9bc89b",
  Celos: "#c89b7a",
  Amor: "#e09bb8",
};

export const FICHA_8A: Record<DbtEmotion, string> = {
  Miedo: "Existe una amenaza real para tu vida, tu salud o tu bienestar (o el de alguien que te importa).",
  Enojo: "Se bloquea un objetivo importante, alguien viola tus derechos o hay una injusticia real.",
  Tristeza: "Hay una pérdida real de algo o alguien valioso, o las cosas no son como querías.",
  Vergüenza: "Tu conducta realmente viola los valores morales del grupo al que pertenecés (y serías rechazado si se enteran).",
  Asco: "Existe una amenaza real a tu salud (contagio, toxicidad), o algo viola fundamentalmente tus valores.",
  Culpa: "Tu conducta realmente viola tus propios valores morales.",
  Envidia: "Otra persona tiene algo que vos querés y necesitás legítimamente.",
  Celos: "Existe una amenaza real a una relación importante o a algo que tenés.",
  Amor: "Hay una persona que realmente te cuida, te respeta o suma a tu vida.",
};

export const OPPOSITE_ACTIONS: Record<DbtEmotion, { impulse: string; action: string }> = {
  Miedo: { impulse: "huir, escapar, evitar lo temido", action: "acercarte y afrontar lo temido gradualmente, una y otra vez, hasta que el miedo baje" },
  Enojo: { impulse: "atacar, gritar, romper, descargar", action: "alejarte suavemente, adoptar manos dispuestas, bajar el tono de voz y desear bien a la otra persona" },
  Tristeza: { impulse: "aislarte, quedarte quieto, replegarte", action: "activarte físicamente, salir, conectar con personas que te hacen bien, hacer actividades placenteras" },
  Vergüenza: { impulse: "esconderte, desaparecer, evitar contacto visual", action: "exponerte, sostener la mirada, hablar de lo que sentís con alguien de confianza" },
  Asco: { impulse: "alejarte, rechazar, vomitar", action: "acercarte con neutralidad y observar sin juzgar" },
  Culpa: { impulse: "castigarte, pedir perdón sin parar, autodespreciarte", action: "reparar el daño concreto si es posible, aceptar tu humanidad y seguir actuando con rectitud" },
  Envidia: { impulse: "dañar al otro, desearle el mal, compararte", action: "alegrarte por la otra persona, agradecer lo que tenés y trabajar por lo que querés" },
  Celos: { impulse: "controlar, acusar, vigilar", action: "dar espacio, confiar, comportarte con gentileza y reforzar tu seguridad interna" },
  Amor: { impulse: "fusionarte, perderte en el otro, abandonar tus límites", action: "mantener tus límites, seguir cuidándote a vos mismo, sostener tus vínculos y tareas" },
};

export const BODY_PLAN_FALLBACK: Record<DbtEmotion, string[]> = {
  Miedo: ["Erguí la postura y afirmá los pies al suelo", "Respiración abdominal lenta", "Sostené contacto visual", "Voz firme y volumen medio", "Hombros atrás, pecho abierto"],
  Enojo: ["Relajá las cejas y la frente", "Aflojá la mandíbula", "Bajá el volumen de voz", "Adoptá manos dispuestas (palmas hacia arriba)", "Media sonrisa suave", "Movimientos lentos"],
  Tristeza: ["Enderezá la columna", "Media sonrisa", "Levantá la mirada", "Gestos amplios y expansivos", "Salí a un lugar con luz natural", "Caminata enérgica"],
  Vergüenza: ["Mantené la cabeza erguida", "Sostené la mirada del otro", "Hombros hacia atrás", "Voz audible, no susurrante", "Postura abierta"],
  Asco: ["Postura neutra, no retraída", "Respiración pareja", "Acercate físicamente con calma", "Voz tranquila", "Cara distendida"],
  Culpa: ["Postura erguida, no encorvada", "Voz firme al disculparte", "Acción reparadora concreta", "Contacto visual sostenido", "Respiración estable"],
  Envidia: ["Sonrisa genuina al felicitar", "Hombros relajados", "Voz cálida", "Manos abiertas", "Postura amistosa"],
  Celos: ["Manos abiertas, no cerradas", "Voz suave", "Postura relajada, sin tensión", "Respiración lenta", "Acercate con gentileza"],
  Amor: ["Mantené tu postura propia", "Voz pareja", "Cuidá tus tiempos y tareas", "Respeto al espacio del otro", "Cuidá tu cuerpo (sueño, comida)"],
};
