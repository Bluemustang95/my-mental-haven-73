export type Statement = {
  id: string;
  text: string;
  kind: "fact" | "judgment";
  explain: string;
  /** 1 = fácil, 2 = mixto, 3 = sutil */
  difficulty: 1 | 2 | 3;
};

export type Difficulty = 1 | 2 | 3;

export const STATEMENT_BANK: Statement[] = [
  { id: "1", text: "Mi pareja no respondió mi mensaje en 3 horas.", kind: "fact", difficulty: 1, explain: "Es un dato observable: tiempo y ausencia de respuesta." },
  { id: "2", text: "A mi pareja no le importo nada.", kind: "judgment", difficulty: 1, explain: "Es una interpretación sobre los sentimientos del otro." },
  { id: "3", text: "Soy un desastre, nunca hago nada bien.", kind: "judgment", difficulty: 1, explain: "Etiqueta global + 'nunca' (generalización)." },
  { id: "4", text: "Hoy llegué 15 minutos tarde a la reunión.", kind: "fact", difficulty: 1, explain: "Hecho con tiempo concreto." },
  { id: "5", text: "Mi jefe me odia.", kind: "judgment", difficulty: 1, explain: "Atribución de emociones sin evidencia directa." },
  { id: "6", text: "Mi jefe me hizo dos correcciones por escrito esta semana.", kind: "fact", difficulty: 1, explain: "Cantidad observable y comprobable." },
  { id: "7", text: "Siento opresión en el pecho.", kind: "fact", difficulty: 2, explain: "Sensación corporal nombrada sin juicio." },
  { id: "8", text: "Esta ansiedad es insoportable.", kind: "judgment", difficulty: 2, explain: "'Insoportable' es una valoración." },
  { id: "9", text: "Me temblaron las manos durante la presentación.", kind: "fact", difficulty: 1, explain: "Descripción corporal observable." },
  { id: "10", text: "Hice el ridículo en la presentación.", kind: "judgment", difficulty: 2, explain: "Etiqueta evaluativa sobre uno mismo." },
  { id: "11", text: "Mi amiga canceló dos planes en el último mes.", kind: "fact", difficulty: 1, explain: "Conducta + tiempo concreto." },
  { id: "12", text: "Mi amiga ya no me quiere.", kind: "judgment", difficulty: 2, explain: "Interpretación absoluta de un patrón." },
  { id: "13", text: "Dormí 4 horas anoche.", kind: "fact", difficulty: 1, explain: "Dato medible." },
  { id: "14", text: "Estoy hecho mierda.", kind: "judgment", difficulty: 1, explain: "Valoración global sobre uno mismo." },
  { id: "15", text: "Tengo el corazón acelerado.", kind: "fact", difficulty: 1, explain: "Sensación física observable." },
  { id: "16", text: "Esto es un fracaso total.", kind: "judgment", difficulty: 1, explain: "Etiqueta absoluta sin datos." },
  { id: "17", text: "Lloré tres veces hoy.", kind: "fact", difficulty: 1, explain: "Frecuencia observable." },
  { id: "18", text: "Soy débil por llorar tanto.", kind: "judgment", difficulty: 2, explain: "Juicio moral sobre una conducta." },
  { id: "19", text: "Mi terapeuta me pidió que escriba 15 minutos por día.", kind: "fact", difficulty: 1, explain: "Indicación concreta." },
  { id: "20", text: "Mi terapeuta cree que estoy peor.", kind: "judgment", difficulty: 2, explain: "Suposición sobre lo que el otro piensa." },
  // Dificultad 3 — sutiles
  { id: "21", text: "Mi cuerpo se tensa cuando él entra al cuarto.", kind: "fact", difficulty: 3, explain: "Es una reacción corporal observable. No describe a la otra persona." },
  { id: "22", text: "Él me genera tensión a propósito.", kind: "judgment", difficulty: 3, explain: "Atribución de intención. No es comprobable solo con el dato." },
  { id: "23", text: "Hablé tres veces en la reunión.", kind: "fact", difficulty: 3, explain: "Conducta contable." },
  { id: "24", text: "Hablé poco en la reunión.", kind: "judgment", difficulty: 3, explain: "'Poco' es relativo y valorativo." },
  { id: "25", text: "Mi mamá levantó la voz dos veces durante la cena.", kind: "fact", difficulty: 3, explain: "Conducta observable y contable." },
  { id: "26", text: "Mi mamá estaba enojada conmigo en la cena.", kind: "judgment", difficulty: 3, explain: "Interpretación del estado emocional ajeno." },
  { id: "27", text: "Pensé en quedarme en la cama 20 minutos antes de levantarme.", kind: "fact", difficulty: 3, explain: "Conducta y tiempo observables." },
  { id: "28", text: "Me cuesta todo, no puedo con nada.", kind: "judgment", difficulty: 2, explain: "Generalización con etiqueta absoluta." },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Toma un deck progresivo: empieza con cartas fáciles, sube a mixtas, termina en sutiles.
 * `level` define el techo de dificultad (1 = sólo fácil, 2 = fácil+mixto, 3 = todo).
 */
export function pickDeck(n = 10, level: Difficulty = 3): Statement[] {
  const easy = shuffle(STATEMENT_BANK.filter((s) => s.difficulty === 1));
  const mid = shuffle(STATEMENT_BANK.filter((s) => s.difficulty === 2));
  const hard = shuffle(STATEMENT_BANK.filter((s) => s.difficulty === 3));

  if (level === 1) return easy.slice(0, n);
  if (level === 2) {
    const half = Math.ceil(n / 2);
    return [...easy.slice(0, half), ...mid.slice(0, n - half)];
  }
  const a = Math.ceil(n * 0.4);
  const b = Math.ceil(n * 0.35);
  const c = n - a - b;
  return [...easy.slice(0, a), ...mid.slice(0, b), ...hard.slice(0, c)];
}
