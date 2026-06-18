export type DistortionKey =
  | "dicotomico" | "catastrofico" | "descalificar" | "razonamiento_emocional"
  | "catalogar" | "magnificar" | "abstraccion_selectiva" | "leer_mente"
  | "sobregeneralizacion" | "personalizacion" | "debo_tengo_que";

type Rule = {
  key: DistortionKey;
  label: string;
  description: string;
  patterns: RegExp[];
};

const RULES: Rule[] = [
  {
    key: "dicotomico",
    label: "Pensamiento Dicotómico (todo o nada)",
    description:
      "Estás viendo la situación en blanco y negro, sin matices. Casi nada en la vida real es 100% o 0% — el matiz es lo que vuelve manejable la experiencia.",
    patterns: [/\b(todo|nada|siempre perfecto|completo fracaso|absolutamente|jamás|jamas)\b/i],
  },
  {
    key: "catastrofico",
    label: "Catastrofismo",
    description:
      "Estás anticipando el peor escenario posible como si fuera el único. La probabilidad real suele ser mucho menor que la imaginada.",
    patterns: [/\b(catástrofe|catastrofe|desastre|terrible|horrible|peor cosa|me voy a morir|insoportable|no voy a poder)\b/i],
  },
  {
    key: "leer_mente",
    label: "Leer la Mente",
    description:
      "Estás asumiendo que sabés lo que la otra persona piensa o siente, sin evidencia directa. No podés verificar lo que ocurre en otra cabeza.",
    patterns: [/\b(seguro (que )?(piensa|cree|opina)|sé que (piensa|cree)|me odia|le caigo mal|piensa que soy)\b/i],
  },
  {
    key: "sobregeneralizacion",
    label: "Sobregeneralización",
    description:
      "Estás tomando un hecho puntual y convirtiéndolo en una regla universal. Un episodio no define todos los demás.",
    patterns: [/\b(siempre|nunca|nadie|todos me|ninguno|cada vez que)\b/i],
  },
  {
    key: "debo_tengo_que",
    label: "Debo / Tengo que",
    description:
      "Te estás exigiendo con reglas rígidas. Cambiar el “debería” por “me gustaría” afloja la auto-presión sin perder el objetivo.",
    patterns: [/\b(debería|deberia|tendría que|tendria que|tengo que|debo|hay que)\b/i],
  },
  {
    key: "catalogar",
    label: "Etiquetar (Catalogar)",
    description:
      "Estás reduciendo a una persona (o a vos) a una etiqueta global. La conducta puntual no es la identidad completa.",
    patterns: [/\bsoy un[ao]? (inútil|inutil|fracasad|tont|idiot|desastre|perdedor|pésim|pesim)/i],
  },
  {
    key: "razonamiento_emocional",
    label: "Razonamiento Emocional",
    description:
      "Estás tratando una emoción como prueba de los hechos. Sentir algo no lo convierte automáticamente en verdadero.",
    patterns: [/\bsiento que (soy|es|va a)|si me siento|me siento mal entonces\b/i],
  },
  {
    key: "personalizacion",
    label: "Personalización",
    description:
      "Estás cargando con responsabilidad por algo que no controlás del todo. Otros factores también intervienen.",
    patterns: [/\b(es mi culpa|por mi culpa|todo por mí|todo por mi|me pasa a mí|me pasa a mi solo)\b/i],
  },
  {
    key: "magnificar",
    label: "Magnificar / Minimizar",
    description:
      "Estás agrandando lo negativo o achicando lo positivo. La proporción real está en algún punto intermedio.",
    patterns: [/\b(no sirve para nada|fue una pavada lo que hice bien|gigantesco|enorme problema)\b/i],
  },
  {
    key: "abstraccion_selectiva",
    label: "Abstracción Selectiva (filtro mental)",
    description:
      "Estás enfocándote sólo en el detalle negativo y dejando fuera el resto del cuadro. Ampliá el zoom.",
    patterns: [/\b(lo único malo|lo único que importa|sólo me fijo en|solo me fijo en)\b/i],
  },
  {
    key: "descalificar",
    label: "Descalificar lo Positivo",
    description:
      "Estás descartando lo bueno como si no contara. Lo positivo también es información válida.",
    patterns: [/\b(no cuenta|fue suerte|cualquiera lo hace|no fue para tanto)\b/i],
  },
];

export type DistortionResult = {
  key: DistortionKey;
  label: string;
  description: string;
};

export function detectDistortion(text: string): DistortionResult | null {
  if (!text || text.trim().length < 4) return null;
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      return { key: rule.key, label: rule.label, description: rule.description };
    }
  }
  // fallback to a generic "Magnificar" if nothing matched but text is intense
  if (/[!]{1,}|nunca|nadie/i.test(text)) {
    const r = RULES.find((r) => r.key === "magnificar")!;
    return { key: r.key, label: r.label, description: r.description };
  }
  return null;
}
