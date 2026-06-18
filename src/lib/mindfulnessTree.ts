/**
 * Catálogo jerárquico de scripts de mindfulness para el admin.
 * Category → Sub → Sub-sub (duration|zone). Cada hoja tiene una clave
 * (category, sub_key, duration_min) que mapea a la tabla mindfulness_scripts.
 */

export type ScriptLeaf = {
  id: string; // unique within tree
  label: string;
  category: string;
  subKey: string | null;
  durationMin: number | null;
};

export type ScriptNode = {
  id: string;
  label: string;
  description?: string;
  children?: ScriptNode[];
  leaf?: ScriptLeaf;
};

const RESPIRACION_INTENCIONES = [
  { key: "dormir", label: "Dormir mejor (4-7-8)" },
  { key: "ansiedad", label: "Bajar ansiedad (suspiro)" },
  { key: "concentrarme", label: "Concentrarme (caja)" },
  { key: "equilibrar", label: "Equilibrar (coherencia)" },
];
const RESP_DURACIONES = [2, 5, 10, 15];

const BODY_SCAN_DURACIONES = [5, 15, 30];
const BODY_SCAN_ZONAS = [
  "cabeza",
  "mandibula",
  "cuello_hombros",
  "pecho",
  "abdomen",
  "brazos",
  "manos",
  "piernas",
  "pies",
];
const ZONA_LABEL: Record<string, string> = {
  cabeza: "Cabeza",
  mandibula: "Mandíbula",
  cuello_hombros: "Cuello y hombros",
  pecho: "Pecho",
  abdomen: "Abdomen",
  brazos: "Brazos",
  manos: "Manos",
  piernas: "Piernas",
  pies: "Pies",
};

const OBSERVAR_DURACIONES = [3, 5, 10];
const OBSERVAR_SENTIDOS = [
  { key: "vista", label: "Vista (5 cosas que ves)" },
  { key: "oido", label: "Oído (4 cosas que oís)" },
  { key: "tacto", label: "Tacto (3 cosas que tocás)" },
  { key: "olfato", label: "Olfato (2 cosas que olés)" },
  { key: "gusto", label: "Gusto (1 cosa que saboreás)" },
];

const DESCRIBIR_NIVELES = [
  { key: "suave", label: "Nivel suave" },
  { key: "mixto", label: "Nivel mixto" },
  { key: "desafiante", label: "Nivel desafiante" },
];
const DESCRIBIR_DURACIONES = [3, 5, 10];

export const MINDFULNESS_TREE: ScriptNode[] = [
  {
    id: "respiracion",
    label: "Respiración (Orbe)",
    description: "Patrones de respiración por intención.",
    children: RESPIRACION_INTENCIONES.map((it) => ({
      id: `respiracion:${it.key}`,
      label: it.label,
      children: RESP_DURACIONES.map((d) => ({
        id: `respiracion:${it.key}:${d}`,
        label: `${d} min`,
        leaf: {
          id: `respiracion:${it.key}:${d}`,
          label: `${it.label} · ${d} min`,
          category: "respiracion",
          subKey: it.key,
          durationMin: d,
        },
      })),
    })),
  },
  {
    id: "body_scan",
    label: "Body Scan",
    description: "Script general por duración + bloques por zona del cuerpo.",
    children: [
      {
        id: "body_scan:durations",
        label: "Scripts generales por duración",
        children: BODY_SCAN_DURACIONES.map((d) => ({
          id: `body_scan::${d}`,
          label: `${d} min`,
          leaf: {
            id: `body_scan::${d}`,
            label: `Body Scan · ${d} min`,
            category: "body_scan",
            subKey: null,
            durationMin: d,
          },
        })),
      },
      {
        id: "body_scan:zonas",
        label: "Bloques por zona",
        description: "Texto que la voz lee al llegar a cada parte del cuerpo.",
        children: BODY_SCAN_ZONAS.map((z) => ({
          id: `body_scan:${z}`,
          label: ZONA_LABEL[z],
          leaf: {
            id: `body_scan:${z}`,
            label: `Body Scan · ${ZONA_LABEL[z]}`,
            category: "body_scan",
            subKey: z,
            durationMin: null,
          },
        })),
      },
    ],
  },
  {
    id: "observar",
    label: "Observar — Mira el presente (5-4-3-2-1)",
    description: "Anclaje sensorial. Un script por sentido y duración.",
    children: OBSERVAR_DURACIONES.map((d) => ({
      id: `observar:${d}`,
      label: `${d} min`,
      children: OBSERVAR_SENTIDOS.map((s) => ({
        id: `observar:${s.key}:${d}`,
        label: s.label,
        leaf: {
          id: `observar:${s.key}:${d}`,
          label: `${s.label} · ${d} min`,
          category: "observar",
          subKey: s.key,
          durationMin: d,
        },
      })),
    })),
  },
  {
    id: "describir",
    label: "Describir — Poner en palabras",
    description: "Scripts didácticos para los 3 ejercicios.",
    children: [
      {
        id: "describir:hechos",
        label: "Hechos vs Juicios",
        children: DESCRIBIR_NIVELES.map((n) => ({
          id: `describir:hechos_juicios:${n.key}`,
          label: n.label,
          leaf: {
            id: `describir:hechos_juicios:${n.key}`,
            label: `Hechos vs Juicios · ${n.label}`,
            category: "describir",
            subKey: `hechos_juicios_${n.key}`,
            durationMin: null,
          },
        })),
      },
      {
        id: "describir:escaner",
        label: "Escáner Neutral",
        children: DESCRIBIR_DURACIONES.map((d) => ({
          id: `describir:escaner:${d}`,
          label: `${d} min`,
          leaf: {
            id: `describir:escaner:${d}`,
            label: `Escáner Neutral · ${d} min`,
            category: "describir",
            subKey: "escaner",
            durationMin: d,
          },
        })),
      },
      {
        id: "describir:anatomia",
        label: "Anatomía de la Emoción",
        children: DESCRIBIR_DURACIONES.map((d) => ({
          id: `describir:anatomia:${d}`,
          label: `${d} min`,
          leaf: {
            id: `describir:anatomia:${d}`,
            label: `Anatomía de la Emoción · ${d} min`,
            category: "describir",
            subKey: "anatomia",
            durationMin: d,
          },
        })),
      },
    ],
  },
];

export function findAllLeaves(nodes: ScriptNode[] = MINDFULNESS_TREE): ScriptLeaf[] {
  const out: ScriptLeaf[] = [];
  const walk = (ns: ScriptNode[]) => {
    for (const n of ns) {
      if (n.leaf) out.push(n.leaf);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}
