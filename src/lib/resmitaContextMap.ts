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
];

const HIDDEN_PREFIXES = [
  "/onboarding",
  "/auth",
  "/reset-password",
  "/admin",
  "/herramientas/plan-seguridad",
  "/cuestionario",
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
