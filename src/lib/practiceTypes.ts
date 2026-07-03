export type PracticeBlockType =
  | "instructions"
  | "example"
  | "pros_cons"
  | "columns"
  | "suds"
  | "free_text"
  | "checklist"
  | "more";

export type PracticeBlock =
  | { id: string; type: "instructions"; html: string }
  | { id: string; type: "example"; html: string }
  | {
      id: string;
      type: "pros_cons";
      labels?: { rowA?: string; rowB?: string; colPros?: string; colCons?: string };
    }
  | { id: string; type: "columns"; columns: { title: string }[] }
  | { id: string; type: "suds"; label: string; minLabel?: string; maxLabel?: string }
  | { id: string; type: "free_text"; prompt: string; placeholder?: string; minChars?: number }
  | { id: string; type: "checklist"; items: string[] }
  | { id: string; type: "more"; label?: string };

export type ProsConsCell = { text: string; suds: number };
export type ProsConsAnswer = {
  prosA: ProsConsCell;
  consA: ProsConsCell;
  prosB: ProsConsCell;
  consB: ProsConsCell;
};

export type PracticeAnswers = Record<string, any>;

export const BLOCK_LABELS: Record<PracticeBlockType, string> = {
  instructions: "Instrucciones",
  example: "Ejemplo",
  pros_cons: "Tabla Pros y Contras",
  columns: "Columnas libres",
  suds: "Escala 0–100",
  free_text: "Texto libre",
  checklist: "Checklist",
  more: "Punto 'Más' (ocultar lo siguiente)",
};

export function newBlock(type: PracticeBlockType): PracticeBlock {
  const id = `b_${Math.random().toString(36).slice(2, 9)}`;
  switch (type) {
    case "instructions":
      return { id, type, html: "" };
    case "example":
      return { id, type, html: "" };
    case "pros_cons":
      return {
        id,
        type,
        labels: { rowA: "Practicar", rowB: "No practicar", colPros: "Pros", colCons: "Contras" },
      };
    case "columns":
      return { id, type, columns: [{ title: "Columna 1" }, { title: "Columna 2" }] };
    case "suds":
      return { id, type, label: "¿Cuánto malestar sentís ahora?", minLabel: "Nada", maxLabel: "Máximo" };
    case "free_text":
      return { id, type, prompt: "Escribí tu reflexión", placeholder: "" };
    case "checklist":
      return { id, type, items: ["Paso 1", "Paso 2"] };
    case "more":
      return { id, type, label: "Más" };
  }
}
