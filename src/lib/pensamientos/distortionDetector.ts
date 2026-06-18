export type DistortionKey =
  | "dicotomico" | "catastrofico" | "descalificar" | "razonamiento_emocional"
  | "catalogar" | "magnificar" | "abstraccion_selectiva" | "leer_mente"
  | "sobregeneralizacion" | "personalizacion" | "debo_tengo_que";

export type DistortionInfo = {
  key: DistortionKey;
  label: string;
  description: string;
  example: string;
};

type Rule = DistortionInfo & { patterns: RegExp[] };

const RULES: Rule[] = [
  {
    key: "dicotomico",
    label: "Pensamiento Dicotómico",
    description:
      "La situación se ve en solo dos categorías en lugar de considerar toda una gama de posibilidades.",
    example: "Si no soy un triunfador absoluto, soy un fracasado.",
    patterns: [/\b(todo o nada|siempre perfecto|completo fracaso|absolutamente|jamás|jamas|o (todo|nada))\b/i],
  },
  {
    key: "catastrofico",
    label: "Catastrófico",
    description:
      "Se realiza una predicción del futuro negativamente, sin tener en cuenta otras posibilidades.",
    example: "Voy a estar tan molesto que no podré hacer nada.",
    patterns: [/\b(catástrofe|catastrofe|desastre|terrible|horrible|peor cosa|me voy a morir|insoportable|no voy a poder|no podré)\b/i],
  },
  {
    key: "descalificar",
    label: "Descalificar lo positivo",
    description:
      "Se considera que las experiencias, logros o cualidades positivas no valen nada.",
    example: "Hice bien ese proyecto pero solamente fue suerte.",
    patterns: [/\b(no cuenta|fue suerte|cualquiera lo hace|no fue para tanto|no vale)\b/i],
  },
  {
    key: "razonamiento_emocional",
    label: "Razonamiento Emocional",
    description:
      "Algo debe ser real porque lo siento, dejando de lado la posibilidad de evaluarlo objetivamente.",
    example: "Sé que hago muchas cosas bien en el trabajo pero igualmente me siento un fracasado.",
    patterns: [/\b(siento que (soy|es|va a)|si me siento|me siento mal entonces)\b/i],
  },
  {
    key: "catalogar",
    label: "Catalogar (Etiquetar)",
    description:
      "Colocarse a uno mismo o a los demás una etiqueta global, sin tener en cuenta otros aspectos que llevan a conclusiones menos desastrosas.",
    example: "Soy un perdedor. Él es un inútil.",
    patterns: [/\bsoy un[ao]? (inútil|inutil|fracasad|tont|idiot|desastre|perdedor|pésim|pesim)/i],
  },
  {
    key: "magnificar",
    label: "Magnificar / Minimizar",
    description:
      "Al evaluarse a uno mismo, a otra persona o una situación, se magnifica enormemente lo negativo y/o se minimiza en gran medida lo positivo.",
    example: "El hecho de que obtuve una calificación mediocre demuestra que soy inútil.",
    patterns: [/\b(no sirve para nada|fue una pavada lo que hice bien|gigantesco|enorme problema|demuestra que soy)\b/i],
  },
  {
    key: "abstraccion_selectiva",
    label: "Abstracción Selectiva (filtro mental)",
    description:
      "Se presta mucha atención a un detalle negativo en lugar de tener en cuenta todo el contexto.",
    example: "Como me saqué un puntaje bajo en la evaluación laboral quiere decir que soy un inútil.",
    patterns: [/\b(lo único malo|lo único que importa|sólo me fijo en|solo me fijo en)\b/i],
  },
  {
    key: "leer_mente",
    label: "Leer la Mente",
    description:
      "Creer que se sabe lo que los demás están pensando y no se es capaz de tener en cuenta otras posibilidades.",
    example: "Él está pensando mal de mí. Ella piensa que no sé nada sobre este proyecto.",
    patterns: [/\b(seguro (que )?(piensa|cree|opina)|sé que (piensa|cree)|me odia|le caigo mal|piensa que soy|está pensando)\b/i],
  },
  {
    key: "sobregeneralizacion",
    label: "Sobregeneralización",
    description:
      "Llegar a una conclusión negativa que va mucho más allá de lo que sugiere la situación.",
    example: "Como no me sentí cómodo en esta reunión quiere decir que no tengo capacidad para hacer amistades.",
    patterns: [/\b(siempre|nunca|nadie|todos me|ninguno|cada vez que)\b/i],
  },
  {
    key: "personalizacion",
    label: "Personalización",
    description:
      "Creer que los otros tienen una actitud negativa dirigida hacia usted, sin tener en cuenta otras explicaciones de los comportamientos.",
    example: "El técnico fue parco conmigo porque yo hice algo incorrecto.",
    patterns: [/\b(es mi culpa|por mi culpa|todo por mí|todo por mi|me pasa a mí|me pasa a mi solo|conmigo porque)\b/i],
  },
  {
    key: "debo_tengo_que",
    label: "Debo / Tengo que",
    description:
      "Idea precisa y rígida respecto del comportamiento que hay que observar y sobrestima lo negativo de no cumplir con esas expectativas.",
    example: "Es horrible cometer errores. Siempre debo hacer lo mejor que puedo.",
    patterns: [/\b(debería|deberia|tendría que|tendria que|tengo que|debo|hay que|siempre debo)\b/i],
  },
];

export const ALL_DISTORTIONS: DistortionInfo[] = RULES.map(
  ({ key, label, description, example }) => ({ key, label, description, example })
);

export function getDistortion(key: string | null | undefined): DistortionInfo | null {
  if (!key) return null;
  const r = RULES.find((r) => r.key === key);
  return r ? { key: r.key, label: r.label, description: r.description, example: r.example } : null;
}

export function detectDistortion(text: string): DistortionInfo | null {
  if (!text || text.trim().length < 4) return null;
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      return { key: rule.key, label: rule.label, description: rule.description, example: rule.example };
    }
  }
  return null;
}
