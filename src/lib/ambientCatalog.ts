// Unified catalog of ambient sounds available to the app.
// Combines the 18 synthesized sounds from ambientLibrary + extra IDs used by
// Diario Zen and Sleep so admin can override any of them with a real MP3.

import { AMBIENT_SOUNDS, type AmbientSound, type AmbientCategory } from "./ambientLibrary";

export type CatalogCategory = AmbientCategory | "zen" | "sueño";

export interface CatalogEntry {
  id: string;
  label: string;
  category: CatalogCategory;
  synth?: AmbientSound; // fallback synthesized builder (undefined for MP3-only ids)
}

// Base catalog: everything from ambientLibrary (skip "off")
const BASE: CatalogEntry[] = AMBIENT_SOUNDS
  .filter((s) => s.id !== "off")
  .map((s) => ({ id: s.id, label: s.label, category: s.category, synth: s }));

// Extra entries specific to Diario Zen / Sueño (no default synth in the base library)
const EXTRAS: CatalogEntry[] = [
  { id: "solfeggio_528", label: "528 Hz — Solfeggio", category: "zen" },
  { id: "zen_click", label: "Click meditativo", category: "zen" },
  { id: "sleep_rain", label: "Lluvia para dormir", category: "sueño" },
  { id: "sleep_waves", label: "Olas para dormir", category: "sueño" },
];

export const AMBIENT_CATALOG: CatalogEntry[] = [...BASE, ...EXTRAS];

export const CATALOG_CATEGORY_LABELS: Record<CatalogCategory, string> = {
  ninguno: "Silencio",
  lluvia: "Lluvia",
  viento: "Viento",
  agua: "Agua",
  naturaleza: "Naturaleza",
  abstractos: "Abstractos",
  zen: "Zen (Diario)",
  sueño: "Sueño",
};

export function findCatalogEntry(id: string): CatalogEntry | undefined {
  return AMBIENT_CATALOG.find((e) => e.id === id);
}
