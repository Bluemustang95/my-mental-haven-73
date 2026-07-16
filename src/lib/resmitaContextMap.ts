export type ResmitaAction = {
  label: string;
  kind: "prefill" | "navigate";
  target: string;
};

export type ResmitaScreenContext = {
  screenTitle: string;
  screenPurpose: string;
  welcome: string;
  actions: ResmitaAction[];
};

const DEFAULT: ResmitaScreenContext = {
  screenTitle: "Inicio",
  screenPurpose: "El usuario está en la pantalla principal.",
  welcome: "Hola, estoy acá. ¿En qué te ayudo hoy?",
  actions: [
    { label: "¿Cómo mejoro mi ánimo hoy?", kind: "prefill", target: "¿Qué me sugerís hacer para mejorar mi ánimo ahora?" },
    { label: "Sugerime algo corto", kind: "prefill", target: "Sugerime un ejercicio de 5 minutos para ahora." },
  ],
};

const MAP: Array<{ prefix: string; ctx: ResmitaScreenContext }> = [
  // ---------- Home / dashboard ----------
  {
    prefix: "/dashboard",
    ctx: {
      screenTitle: "Dashboard",
      screenPurpose: "El usuario está en su panel principal viendo widgets.",
      welcome: "¿Querés que te ayude a leer tu día?",
      actions: [
        { label: "Resumime mi día", kind: "prefill", target: "Resumime cómo vengo hoy según mis widgets." },
      ],
    },
  },

  // ---------- Diario ----------
  {
    prefix: "/diario/checkin",
    ctx: {
      screenTitle: "Check-in diario",
      screenPurpose: "El usuario está registrando su check-in emocional del día.",
      welcome: "Estoy con vos en el check-in. ¿Querés ayuda para nombrar lo que sentís?",
      actions: [
        { label: "Ayudame a nombrar la emoción", kind: "prefill", target: "Ayudame a identificar qué emoción estoy sintiendo ahora." },
        { label: "¿Qué me dice mi ánimo?", kind: "prefill", target: "¿Qué me dice mi ánimo de hoy?" },
      ],
    },
  },
  {
    prefix: "/diario/pensamientos",
    ctx: {
      screenTitle: "Registro de pensamientos",
      screenPurpose: "El usuario está trabajando un pensamiento automático con formato CBT.",
      welcome: "Vamos a desarmar este pensamiento juntes. ¿Por dónde te trabo?",
      actions: [
        { label: "Detectar distorsiones", kind: "prefill", target: "¿Qué distorsiones cognitivas ves en mi pensamiento?" },
        { label: "Evidencia en contra", kind: "prefill", target: "Ayudame a encontrar evidencia en contra de este pensamiento." },
      ],
    },
  },
  {
    prefix: "/diario/huellas",
    ctx: {
      screenTitle: "Tus huellas",
      screenPurpose: "El usuario está viendo el historial visual de su diario.",
      welcome: "¿Querés que te ayude a ver patrones en tus huellas?",
      actions: [
        { label: "Patrones en mi diario", kind: "prefill", target: "¿Qué patrones ves en mis últimas entradas de diario?" },
      ],
    },
  },
  {
    prefix: "/diario/cartas",
    ctx: {
      screenTitle: "Cartas no enviadas",
      screenPurpose: "El usuario está escribiendo cartas que no va a enviar (herramienta terapéutica).",
      welcome: "Escribir sin enviar libera. ¿Te ayudo a arrancar?",
      actions: [
        { label: "Ayudame a empezar", kind: "prefill", target: "Ayudame a empezar una carta no enviada para descargar lo que siento." },
      ],
    },
  },
  {
    prefix: "/diario/sueños",
    ctx: {
      screenTitle: "Registro de sueños",
      screenPurpose: "El usuario está registrando un sueño.",
      welcome: "¿Querés hablar de lo que soñaste?",
      actions: [
        { label: "¿Qué me puede decir?", kind: "prefill", target: "¿Qué me puede estar diciendo mi sueño reciente?" },
      ],
    },
  },
  {
    prefix: "/diario/dialogo-interno",
    ctx: {
      screenTitle: "Diálogo interno",
      screenPurpose: "El usuario está trabajando su voz interna crítica.",
      welcome: "¿Te ayudo a suavizar la voz crítica?",
      actions: [
        { label: "Voz compasiva", kind: "prefill", target: "Ayudame a responderle a mi voz crítica desde la autocompasión." },
      ],
    },
  },
  {
    prefix: "/diario/relaciones",
    ctx: {
      screenTitle: "Relaciones",
      screenPurpose: "El usuario está registrando una interacción con otra persona.",
      welcome: "¿Querés desarmar esta interacción?",
      actions: [
        { label: "Ayudame a entender", kind: "prefill", target: "Ayudame a entender qué pasó en esta interacción." },
      ],
    },
  },
  {
    prefix: "/diario/alimentacion-consciente",
    ctx: {
      screenTitle: "Alimentación consciente",
      screenPurpose: "El usuario está en mindful eating.",
      welcome: "¿Cómo venís con tu relación con la comida hoy?",
      actions: [
        { label: "Guía de mindful eating", kind: "prefill", target: "Guiame en una comida consciente ahora." },
      ],
    },
  },
  {
    prefix: "/diario-inteligente/gestion-pensamientos",
    ctx: {
      screenTitle: "Gestión de pensamientos",
      screenPurpose: "El usuario está en el módulo CBT de pensamientos automáticos.",
      welcome: "Podés apoyarte en mí para desarmar el pensamiento paso a paso.",
      actions: [
        { label: "¿Qué es una distorsión?", kind: "prefill", target: "Explicame en simple qué es una distorsión cognitiva." },
        { label: "Ayudame a reformular", kind: "prefill", target: "Ayudame a reformular el pensamiento de manera más equilibrada." },
      ],
    },
  },
  {
    prefix: "/diario",
    ctx: {
      screenTitle: "Diario",
      screenPurpose: "El usuario está en su diario emocional.",
      welcome: "¿Querés que te ayude a ordenar lo que sentís hoy?",
      actions: [
        { label: "Ayudame a escribir", kind: "prefill", target: "Sugerime una pregunta guía para escribir en mi diario ahora." },
        { label: "Resumí mi semana", kind: "prefill", target: "¿Qué patrones ves en mi última semana de diario?" },
      ],
    },
  },

  // ---------- Herramientas ----------
  {
    prefix: "/herramientas/regulacion-emocional",
    ctx: {
      screenTitle: "Regulación emocional",
      screenPurpose: "El usuario está regulando una emoción intensa (STOP, TIP, hielo).",
      welcome: "Si la emoción está alta, arrancá con algo corto. ¿Te guío?",
      actions: [
        { label: "Guiame paso a paso", kind: "prefill", target: "Guiame paso a paso para bajar la intensidad emocional ahora." },
        { label: "¿Qué técnica me conviene?", kind: "prefill", target: "¿Qué técnica de regulación me conviene según lo que estoy sintiendo?" },
      ],
    },
  },
  {
    prefix: "/herramientas/regulacion-dbt",
    ctx: {
      screenTitle: "Regulación DBT",
      screenPurpose: "El usuario está en la ficha DBT de regulación emocional.",
      welcome: "Estoy con vos en DBT. ¿Te explico algún paso de la ficha?",
      actions: [
        { label: "Explicame la ficha 8", kind: "prefill", target: "Explicame en simple para qué sirve la ficha 8 de DBT." },
        { label: "Acción opuesta", kind: "prefill", target: "Ayudame a pensar una acción opuesta a la emoción que tengo." },
      ],
    },
  },
  {
    prefix: "/herramientas/mindfulness",
    ctx: {
      screenTitle: "Mindfulness",
      screenPurpose: "El usuario está en el hub de mindfulness (respirar, observar, describir).",
      welcome: "¿Buscás una práctica corta o algo específico para ahora?",
      actions: [
        { label: "Práctica de 3 minutos", kind: "prefill", target: "Sugerime una práctica de mindfulness de 3 minutos." },
        { label: "Describir lo que siento", kind: "prefill", target: "Ayudame a describir sin juzgar lo que estoy sintiendo." },
      ],
    },
  },
  {
    prefix: "/herramientas/mente-emocion",
    ctx: {
      screenTitle: "Mente & Emoción",
      screenPurpose: "El usuario está eligiendo entre trabajar pensamientos (CBT) o regular emociones (DBT).",
      welcome: "¿Querés trabajar un pensamiento o regular una emoción?",
      actions: [
        { label: "¿Cuál me conviene ahora?", kind: "prefill", target: "Según cómo estoy, ¿me conviene trabajar un pensamiento o regular una emoción?" },
      ],
    },
  },
  {
    prefix: "/herramientas/pack",
    ctx: {
      screenTitle: "Pack de Activación Conductual",
      screenPurpose: "El usuario está en el programa de Activación Conductual (BA).",
      welcome: "Estoy acá para ayudarte con tu plan de activación.",
      actions: [
        { label: "¿Qué es activación conductual?", kind: "prefill", target: "Explicame en simple qué es la activación conductual." },
        { label: "Destrabar una actividad", kind: "prefill", target: "Estoy trabado con una actividad, ayudame a destrabarla." },
      ],
    },
  },
  {
    prefix: "/herramientas/grounding",
    ctx: {
      screenTitle: "Grounding",
      screenPurpose: "El usuario está en técnicas de grounding (5-4-3-2-1) para ansiedad/disociación.",
      welcome: "Vamos a anclar en el presente. ¿Te guío el 5-4-3-2-1?",
      actions: [
        { label: "Guiame el 5-4-3-2-1", kind: "prefill", target: "Guiame paso a paso el ejercicio 5-4-3-2-1 ahora." },
      ],
    },
  },
  {
    prefix: "/herramientas/rumiacion",
    ctx: {
      screenTitle: "Rumiación",
      screenPurpose: "El usuario está trabajando pensamientos rumiantes.",
      welcome: "¿Te ayudo a cortar la rumiación?",
      actions: [
        { label: "Técnica para frenar", kind: "prefill", target: "Dame una técnica corta para frenar la rumiación ahora." },
      ],
    },
  },
  {
    prefix: "/herramientas/autocuidado",
    ctx: {
      screenTitle: "Autocuidado",
      screenPurpose: "El usuario está en su lista de autocuidado.",
      welcome: "¿Qué necesitás hoy?",
      actions: [
        { label: "Sugerime autocuidado", kind: "prefill", target: "Sugerime una actividad de autocuidado según cómo me siento." },
      ],
    },
  },
  {
    prefix: "/herramientas/valores",
    ctx: {
      screenTitle: "Mis valores",
      screenPurpose: "El usuario está explorando/reflexionando sus valores (ACT).",
      welcome: "¿Querés que te ayude a conectar con tus valores?",
      actions: [
        { label: "¿Cómo vivo mis valores?", kind: "prefill", target: "¿Cómo puedo vivir más alineado a mis valores esta semana?" },
      ],
    },
  },
  {
    prefix: "/herramientas/reflexion-semanal",
    ctx: {
      screenTitle: "Reflexión semanal",
      screenPurpose: "El usuario está cerrando su semana.",
      welcome: "Vamos a cerrar la semana. ¿Por dónde arrancamos?",
      actions: [
        { label: "Ayudame a reflexionar", kind: "prefill", target: "Guiame con preguntas para reflexionar mi semana." },
      ],
    },
  },
  {
    prefix: "/herramientas/metas-semanales",
    ctx: {
      screenTitle: "Metas semanales",
      screenPurpose: "El usuario está planificando metas de la semana.",
      welcome: "¿Te ayudo a armar metas realistas?",
      actions: [
        { label: "Meta pequeña y realista", kind: "prefill", target: "Ayudame a definir una meta pequeña y realista para esta semana." },
      ],
    },
  },
  {
    prefix: "/herramientas",
    ctx: {
      screenTitle: "Recursos",
      screenPurpose: "El usuario está eligiendo un recurso o técnica.",
      welcome: "¿Buscás algo puntual? Puedo sugerirte según cómo estés.",
      actions: [
        { label: "Recomendame según cómo estoy", kind: "prefill", target: "Recomendame un recurso según cómo me siento hoy." },
      ],
    },
  },

  // ---------- Mindfulness sub ----------
  {
    prefix: "/mindfulness/respirar",
    ctx: {
      screenTitle: "Respiración",
      screenPurpose: "El usuario está en ejercicios de respiración.",
      welcome: "¿Qué patrón te sirve ahora?",
      actions: [
        { label: "Recomendame un patrón", kind: "prefill", target: "Recomendame un patrón de respiración según cómo me siento." },
      ],
    },
  },
  {
    prefix: "/mindfulness/observar",
    ctx: {
      screenTitle: "Observar",
      screenPurpose: "El usuario está en prácticas de observación mindful.",
      welcome: "¿Te guío una observación corta?",
      actions: [
        { label: "Práctica de 3 minutos", kind: "prefill", target: "Guiame una observación mindful de 3 minutos." },
      ],
    },
  },
  {
    prefix: "/mindfulness/describir",
    ctx: {
      screenTitle: "Describir",
      screenPurpose: "El usuario está describiendo sensaciones/emociones sin juzgar.",
      welcome: "¿Empezamos por el cuerpo o por la emoción?",
      actions: [
        { label: "Describir sin juzgar", kind: "prefill", target: "Ayudame a describir sin juzgar lo que estoy sintiendo." },
      ],
    },
  },

  // ---------- Mi Proceso ----------
  {
    prefix: "/mi-proceso/medicacion",
    ctx: {
      screenTitle: "Medicación",
      screenPurpose: "El usuario está en su seguimiento de medicación.",
      welcome: "Puedo ayudarte con dudas generales sobre adherencia. No reemplazo a tu médicx.",
      actions: [
        { label: "¿Por qué importa la adherencia?", kind: "prefill", target: "¿Por qué es importante mantener la adherencia a la medicación?" },
      ],
    },
  },
  {
    prefix: "/mi-proceso/tests",
    ctx: {
      screenTitle: "Tests clínicos",
      screenPurpose: "El usuario está en la sección de tests psicológicos.",
      welcome: "¿Querés que te explique algún test o qué mide?",
      actions: [
        { label: "¿Cuál test me sirve hoy?", kind: "prefill", target: "¿Qué test me recomendás hacer hoy según mi proceso?" },
      ],
    },
  },
  {
    prefix: "/mi-proceso/inventarios",
    ctx: {
      screenTitle: "Inventarios",
      screenPurpose: "El usuario está en inventarios de personalidad/sintomatología.",
      welcome: "¿Querés que te explique algún inventario?",
      actions: [
        { label: "Explicame los inventarios", kind: "prefill", target: "Explicame para qué sirven los inventarios que puedo hacer." },
      ],
    },
  },
  {
    prefix: "/mi-proceso/notas-sesion",
    ctx: {
      screenTitle: "Notas de sesión",
      screenPurpose: "El usuario está viendo/anotando notas post-sesión terapéutica.",
      welcome: "¿Te ayudo a organizar lo que trabajaste en sesión?",
      actions: [
        { label: "Organizame la nota", kind: "prefill", target: "Ayudame a organizar mis notas de la última sesión." },
      ],
    },
  },
  {
    prefix: "/mi-proceso/preparacion-sesion",
    ctx: {
      screenTitle: "Preparación de sesión",
      screenPurpose: "El usuario está preparando temas para llevar a terapia.",
      welcome: "¿Qué querés llevar a tu próxima sesión?",
      actions: [
        { label: "Sugerime temas", kind: "prefill", target: "Sugerime temas que podría llevar a mi próxima sesión de terapia." },
      ],
    },
  },
  {
    prefix: "/mi-proceso/correlaciones",
    ctx: {
      screenTitle: "Correlaciones",
      screenPurpose: "El usuario está viendo correlaciones entre su actividad y su bienestar.",
      welcome: "¿Querés que te ayude a leer las correlaciones?",
      actions: [
        { label: "Interpretá mis datos", kind: "prefill", target: "Ayudame a interpretar las correlaciones de mi actividad y bienestar." },
      ],
    },
  },
  {
    prefix: "/mi-proceso",
    ctx: {
      screenTitle: "Mi Proceso",
      screenPurpose: "El usuario está revisando su evolución clínica y progreso.",
      welcome: "¿Querés que te ayude a leer tu progreso?",
      actions: [
        { label: "Resumime cómo vengo", kind: "prefill", target: "Resumime cómo vengo evolucionando en las últimas semanas." },
      ],
    },
  },

  // ---------- Psicoeducación ----------
  {
    prefix: "/psicoeducacion",
    ctx: {
      screenTitle: "Psicoeducación",
      screenPurpose: "El usuario está aprendiendo sobre salud mental.",
      welcome: "¿Querés que te explique algún concepto?",
      actions: [
        { label: "Explicame ansiedad", kind: "prefill", target: "Explicame en simple qué es la ansiedad y cómo funciona." },
        { label: "Explicame depresión", kind: "prefill", target: "Explicame en simple qué es la depresión." },
      ],
    },
  },

  // ---------- Rituales ----------
  {
    prefix: "/sintonia-manana",
    ctx: {
      screenTitle: "Sintonía de la mañana",
      screenPurpose: "El usuario está en su ritual matutino.",
      welcome: "Buen día. ¿Arrancamos con una intención?",
      actions: [
        { label: "Fijar una intención", kind: "prefill", target: "Ayudame a fijar una intención breve para hoy." },
      ],
    },
  },
  {
    prefix: "/balance-nocturno",
    ctx: {
      screenTitle: "Balance nocturno",
      screenPurpose: "El usuario está cerrando el día con su ritual nocturno.",
      welcome: "¿Cerramos el día juntes?",
      actions: [
        { label: "Ayudame a soltar el día", kind: "prefill", target: "Ayudame a soltar el día antes de dormir." },
      ],
    },
  },

  // ---------- Otros ----------
  {
    prefix: "/perfil",
    ctx: {
      screenTitle: "Perfil",
      screenPurpose: "El usuario está en su perfil personal.",
      welcome: "¿Buscás algo en particular en tu perfil?",
      actions: [],
    },
  },
  {
    prefix: "/favoritos",
    ctx: {
      screenTitle: "Favoritos",
      screenPurpose: "El usuario está viendo su contenido guardado.",
      welcome: "¿Retomamos algo de lo que guardaste?",
      actions: [
        { label: "¿Por dónde sigo?", kind: "prefill", target: "Según lo que tengo guardado, ¿por dónde me sugerís seguir?" },
      ],
    },
  },
  {
    prefix: "/biblioteca",
    ctx: {
      screenTitle: "Biblioteca",
      screenPurpose: "El usuario está explorando contenido psicoeducativo.",
      welcome: "¿Buscás algún tema puntual?",
      actions: [
        { label: "Recomendame contenido", kind: "prefill", target: "Recomendame contenido según cómo me siento hoy." },
      ],
    },
  },
];

const HIDDEN_PREFIXES = [
  "/onboarding",
  "/auth",
  "/reset-password",
  "/admin",
  "/ajustes",
  "/herramientas/plan-seguridad",
  "/cuestionario",
  "/pack/ba/day",
];

export function isResmitaHidden(pathname: string): boolean {
  return HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function getResmitaContext(pathname: string): ResmitaScreenContext {
  const found = MAP.find(
    (m) => pathname === m.prefix || pathname.startsWith(m.prefix + "/") || pathname.startsWith(m.prefix),
  );
  return found?.ctx ?? DEFAULT;
}
