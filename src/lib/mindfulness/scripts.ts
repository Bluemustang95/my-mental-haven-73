/**
 * Guiones de narración por ejercicio de mindfulness.
 *
 * Filosofía:
 * - No es una guía "inhalá / exhalá". Es una voz que acompaña mientras la
 *   pantalla ya hace su trabajo (orb que crece, hoja que cae, escáner que baja).
 * - Rioplatense, tuteo, tono suave y sensorial.
 * - Cada segmento es corto (≤ ~20 palabras) para que ElevenLabs cierre la
 *   entonación limpio.
 * - `pauseMs` = silencio real entre segmentos.
 * - `<break time="Xms"/>` embebido = pausas cortas dentro de una misma frase
 *   (soportado por eleven_multilingual_v2).
 */

export type NarrationSegment = { text: string; pauseMs: number };

export type MindfulScript = {
  id: string;
  /** Se reproduce una vez al arrancar la práctica. */
  intro: NarrationSegment[];
  /** Se cicla mientras dura la práctica (opcional). */
  loop?: NarrationSegment[];
  /** Se reproduce al cerrar (opcional). */
  outro?: NarrationSegment[];
};

// ── RESPIRACIÓN ────────────────────────────────────────────────────────

const breath478: MindfulScript = {
  id: "478",
  intro: [
    { text: "Bienvenida a esta pausa. <break time=\"400ms\"/> No hay nada que hacer bien.", pauseMs: 1200 },
    { text: "Vas a ver un círculo que se expande y se contrae en la pantalla.", pauseMs: 900 },
    { text: "Dejá que tu respiración siga ese ritmo, sin forzar.", pauseMs: 1500 },
    { text: "Cuando el círculo crece, entra aire. <break time=\"500ms\"/> Cuando se detiene, sostenés.", pauseMs: 1400 },
    { text: "Cuando se achica, dejás salir el aire, un poquito más largo que la inhalación.", pauseMs: 1800 },
  ],
  loop: [
    { text: "Sentí el aire fresco en la nariz al entrar.", pauseMs: 3800 },
    { text: "Y sentí cómo la exhalación afloja los hombros.", pauseMs: 3800 },
    { text: "Si aparecen pensamientos, dejalos pasar. <break time=\"400ms\"/> Volvé al círculo.", pauseMs: 4200 },
    { text: "Nada urgente ahora. <break time=\"400ms\"/> Solo esta respiración.", pauseMs: 4200 },
  ],
  outro: [
    { text: "Muy bien. Empezá a soltar la atención del círculo.", pauseMs: 900 },
    { text: "Notá tu cuerpo. <break time=\"500ms\"/> Cómo está ahora.", pauseMs: 1500 },
  ],
};

const breathSigh: MindfulScript = {
  id: "sigh",
  intro: [
    { text: "Esto es un suspiro fisiológico. <break time=\"400ms\"/> Sirve para bajar la marcha, rápido.", pauseMs: 1200 },
    { text: "Vas a tomar dos inhalaciones por la nariz, una arriba de la otra.", pauseMs: 1000 },
    { text: "Y después vas a soltar todo el aire, largo, por la boca.", pauseMs: 1500 },
    { text: "Dejate llevar por el visual. <break time=\"400ms\"/> El cuerpo ya sabe.", pauseMs: 1800 },
  ],
  loop: [
    { text: "Primera entrada de aire por la nariz.", pauseMs: 1800 },
    { text: "Una segunda, más chiquita, para terminar de llenarte.", pauseMs: 2000 },
    { text: "Y ahora, suspiro. <break time=\"400ms\"/> Sacá todo por la boca.", pauseMs: 3500 },
    { text: "Notá cómo baja la intensidad de a poco.", pauseMs: 3500 },
  ],
  outro: [
    { text: "Ya. <break time=\"500ms\"/> Un par de suspiros alcanzan para regular.", pauseMs: 1500 },
  ],
};

const breathBox: MindfulScript = {
  id: "box",
  intro: [
    { text: "Respiración en caja. <break time=\"400ms\"/> Cuatro lados iguales.", pauseMs: 1100 },
    { text: "Inhalás. <break time=\"400ms\"/> Sostenés. <break time=\"400ms\"/> Exhalás. <break time=\"400ms\"/> Sostenés.", pauseMs: 1500 },
    { text: "Todo del mismo tiempo. <break time=\"400ms\"/> El cuadrado en pantalla te va guiando.", pauseMs: 1800 },
    { text: "Este ritmo estabiliza. Se usa mucho para volver a foco.", pauseMs: 1800 },
  ],
  loop: [
    { text: "Entra el aire. <break time=\"400ms\"/> Sin apuro.", pauseMs: 4500 },
    { text: "Sostenelo, sin apretar.", pauseMs: 4500 },
    { text: "Soltalo despacio.", pauseMs: 4500 },
    { text: "Y esperá el próximo, tranquila.", pauseMs: 4500 },
  ],
  outro: [
    { text: "Cerrá el último lado. <break time=\"500ms\"/> Y quedate un momento en silencio.", pauseMs: 1500 },
  ],
};

const breathCoherence: MindfulScript = {
  id: "coherence",
  intro: [
    { text: "Coherencia cardíaca. <break time=\"400ms\"/> Cinco segundos entra, cinco segundos sale.", pauseMs: 1200 },
    { text: "Es un ritmo muy suave. <break time=\"400ms\"/> Sincroniza corazón y respiración.", pauseMs: 1500 },
    { text: "Seguí la onda de la pantalla. <break time=\"400ms\"/> No hace falta pensar los tiempos.", pauseMs: 1800 },
  ],
  loop: [
    { text: "Aire adentro, parejo.", pauseMs: 5200 },
    { text: "Y afuera, con la misma calma.", pauseMs: 5200 },
    { text: "Que la mente se apoye en este vaivén.", pauseMs: 5500 },
  ],
  outro: [
    { text: "Muy bien. <break time=\"400ms\"/> Sostené el ritmo unos segundos más, sin la voz.", pauseMs: 2000 },
  ],
};

const breathBodyScan: MindfulScript = {
  id: "bodyScan",
  intro: [
    { text: "Vamos a hacer un escaneo del cuerpo, de la cabeza a los pies.", pauseMs: 1200 },
    { text: "La pantalla te va marcando cada zona. Vos solo notás lo que hay.", pauseMs: 1500 },
    { text: "No hay que relajar nada a la fuerza. Solo observar.", pauseMs: 1800 },
  ],
  loop: [
    { text: "Cabeza. <break time=\"500ms\"/> Frente, sienes, cuero cabelludo. <break time=\"400ms\"/> ¿Hay tensión?", pauseMs: 4500 },
    { text: "Mandíbula. <break time=\"500ms\"/> Aflojá los dientes apenas.", pauseMs: 4500 },
    { text: "Cuello y hombros. <break time=\"500ms\"/> Dejá que caigan un centímetro.", pauseMs: 4500 },
    { text: "Pecho. <break time=\"500ms\"/> Sentí el aire entrando y saliendo.", pauseMs: 4500 },
    { text: "Abdomen. <break time=\"500ms\"/> ¿Hay un nudo? No lo cambies, solo notalo.", pauseMs: 4500 },
    { text: "Piernas. <break time=\"500ms\"/> Sentí su peso sobre la superficie.", pauseMs: 4500 },
    { text: "Pies. <break time=\"500ms\"/> Los dedos, los talones. <break time=\"400ms\"/> Estás acá.", pauseMs: 4000 },
  ],
  outro: [
    { text: "Ahora sentí todo el cuerpo, entero, como una sola cosa.", pauseMs: 2500 },
    { text: "Y volvé a la respiración natural.", pauseMs: 1500 },
  ],
};

// ── OBSERVAR ───────────────────────────────────────────────────────────

const observClouds: MindfulScript = {
  id: "clouds",
  intro: [
    { text: "Este ejercicio se llama hojas en el arroyo. <break time=\"400ms\"/> O nubes en el cielo.", pauseMs: 1500 },
    { text: "Vas a imaginar que cada pensamiento que aparece es una hoja que flota.", pauseMs: 1800 },
    { text: "No hay que empujarlas, ni pelearlas. <break time=\"400ms\"/> Solo mirarlas irse.", pauseMs: 2000 },
    { text: "Escribí lo que aparece, tocá el más, y dejálo ir en la pantalla.", pauseMs: 1500 },
  ],
  loop: [
    { text: "Un pensamiento no es una orden. <break time=\"400ms\"/> Es solo una hoja.", pauseMs: 6000 },
    { text: "Si te enganchás con alguno, no pasa nada. <break time=\"400ms\"/> Volvé al arroyo.", pauseMs: 6000 },
    { text: "Notá que vos no sos el pensamiento. <break time=\"400ms\"/> Vos sos quien lo mira pasar.", pauseMs: 7000 },
  ],
  outro: [
    { text: "Muy bien. <break time=\"400ms\"/> Todo lo que soltaste, ya no lo estás cargando.", pauseMs: 2500 },
  ],
};

const observSenses: MindfulScript = {
  id: "senses",
  intro: [
    { text: "Vamos con el cinco cuatro tres dos uno. <break time=\"400ms\"/> Un anclaje sensorial.", pauseMs: 1500 },
    { text: "Sirve para volver al presente cuando la cabeza se dispara.", pauseMs: 1800 },
    { text: "En cada paso, no hace falta acertar. Solo notar.", pauseMs: 1800 },
  ],
  outro: [
    { text: "Notá cómo estás ahora, comparado con hace un rato.", pauseMs: 1800 },
  ],
};

const observLeafPile: MindfulScript = {
  id: "leafPile",
  intro: [
    { text: "Mirá cómo se apilan las hojas que soltaste.", pauseMs: 1800 },
    { text: "Cada una fue un pensamiento que dejó de tironearte.", pauseMs: 2000 },
    { text: "No desaparecieron. <break time=\"400ms\"/> Están, pero ya no las estás cargando.", pauseMs: 2500 },
  ],
};

// ── DESCRIBIR ──────────────────────────────────────────────────────────

const descAnatomia: MindfulScript = {
  id: "anatomiaEmocion",
  intro: [
    { text: "Vamos a mapear una emoción. <break time=\"400ms\"/> A ver dónde vive en el cuerpo.", pauseMs: 1500 },
    { text: "No hay que arreglar nada. <break time=\"400ms\"/> Es cartografía, no cirugía.", pauseMs: 2000 },
    { text: "Vas a elegir la emoción, después dónde la sentís, después qué tan fuerte.", pauseMs: 2200 },
  ],
};

const descEscaner: MindfulScript = {
  id: "escanerNeutral",
  intro: [
    { text: "Vas a escribir algo que te pasó, con las palabras que te salen.", pauseMs: 1800 },
    { text: "Yo te lo voy a devolver sin las etiquetas ni los juicios.", pauseMs: 2000 },
    { text: "No es para negar lo que sentís. <break time=\"400ms\"/> Es para verlo más claro.", pauseMs: 2500 },
  ],
};

const descHechos: MindfulScript = {
  id: "hechosJuicios",
  intro: [
    { text: "Un hecho es algo que se puede filmar. <break time=\"400ms\"/> Un juicio es una interpretación.", pauseMs: 2000 },
    { text: "Vas a ver frases y decidir cuál es cuál. <break time=\"400ms\"/> No hay que hacerlo perfecto.", pauseMs: 2200 },
    { text: "El músculo que estamos entrenando es el de distinguir.", pauseMs: 2000 },
  ],
};

// ── Registro ───────────────────────────────────────────────────────────

export const SCRIPTS: Record<string, MindfulScript> = {
  "478": breath478,
  sigh: breathSigh,
  box: breathBox,
  coherence: breathCoherence,
  bodyScan: breathBodyScan,
  clouds: observClouds,
  senses: observSenses,
  leafPile: observLeafPile,
  anatomiaEmocion: descAnatomia,
  escanerNeutral: descEscaner,
  hechosJuicios: descHechos,
};

export function getScript(id: string): MindfulScript | null {
  return SCRIPTS[id] ?? null;
}
