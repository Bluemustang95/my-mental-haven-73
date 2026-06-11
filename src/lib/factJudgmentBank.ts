export type Statement = {
  id: string;
  text: string;
  kind: "fact" | "judgment";
  explain: string;
};

export const STATEMENT_BANK: Statement[] = [
  { id: "1", text: "Mi pareja no respondió mi mensaje en 3 horas.", kind: "fact", explain: "Es un dato observable: tiempo y ausencia de respuesta." },
  { id: "2", text: "A mi pareja no le importo nada.", kind: "judgment", explain: "Es una interpretación sobre los sentimientos del otro." },
  { id: "3", text: "Soy un desastre, nunca hago nada bien.", kind: "judgment", explain: "Etiqueta global + 'nunca' (generalización)." },
  { id: "4", text: "Hoy llegué 15 minutos tarde a la reunión.", kind: "fact", explain: "Hecho con tiempo concreto." },
  { id: "5", text: "Mi jefe me odia.", kind: "judgment", explain: "Atribución de emociones sin evidencia directa." },
  { id: "6", text: "Mi jefe me hizo dos correcciones por escrito esta semana.", kind: "fact", explain: "Cantidad observable y comprobable." },
  { id: "7", text: "Siento opresión en el pecho.", kind: "fact", explain: "Sensación corporal nombrada sin juicio." },
  { id: "8", text: "Esta ansiedad es insoportable.", kind: "judgment", explain: "'Insoportable' es una valoración." },
  { id: "9", text: "Me temblaron las manos durante la presentación.", kind: "fact", explain: "Descripción corporal observable." },
  { id: "10", text: "Hice el ridículo en la presentación.", kind: "judgment", explain: "Etiqueta evaluativa sobre uno mismo." },
  { id: "11", text: "Mi amiga canceló dos planes en el último mes.", kind: "fact", explain: "Conducta + tiempo concreto." },
  { id: "12", text: "Mi amiga ya no me quiere.", kind: "judgment", explain: "Interpretación absoluta de un patrón." },
  { id: "13", text: "Dormí 4 horas anoche.", kind: "fact", explain: "Dato medible." },
  { id: "14", text: "Estoy hecho mierda.", kind: "judgment", explain: "Valoración global sobre uno mismo." },
  { id: "15", text: "Tengo el corazón acelerado.", kind: "fact", explain: "Sensación física observable." },
  { id: "16", text: "Esto es un fracaso total.", kind: "judgment", explain: "Etiqueta absoluta sin datos." },
  { id: "17", text: "Lloré tres veces hoy.", kind: "fact", explain: "Frecuencia observable." },
  { id: "18", text: "Soy débil por llorar tanto.", kind: "judgment", explain: "Juicio moral sobre una conducta." },
  { id: "19", text: "Mi terapeuta me pidió que escriba 15 minutos por día.", kind: "fact", explain: "Indicación concreta." },
  { id: "20", text: "Mi terapeuta cree que estoy peor.", kind: "judgment", explain: "Suposición sobre lo que el otro piensa." },
];

export function pickDeck(n = 10): Statement[] {
  const arr = [...STATEMENT_BANK];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
