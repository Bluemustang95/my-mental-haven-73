import { supabase } from "@/integrations/supabase/client";

let toolCache: { slugs: Set<string>; ts: number } | null = null;
let categoryCache: { slugs: Set<string>; ts: number } | null = null;
const TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Slugs de `resource_tools` con `is_published = false`. Los agregadores clínicos
 * (bienestar, resumen psico, actividad) descartan filas cuyo `exercise_type` /
 * `tool_slug` coincida con este set.
 */
export async function getHiddenToolSlugs(): Promise<Set<string>> {
  if (toolCache && Date.now() - toolCache.ts < TTL) return toolCache.slugs;
  try {
    const { data } = await supabase
      .from("resource_tools")
      .select("slug, is_published");
    const slugs = new Set<string>(
      (data ?? [])
        .filter((r: any) => r.is_published === false)
        .map((r: any) => String(r.slug ?? "").toLowerCase())
        .filter(Boolean),
    );
    toolCache = { slugs, ts: Date.now() };
    return slugs;
  } catch {
    return new Set<string>();
  }
}

/**
 * Slugs de `resource_categories` con `is_published = false`. Se usa para ocultar
 * tarjetas en el Bento, filtrar widgets de home, silenciar notificaciones y
 * limitar los recursos que Resmita puede sugerir.
 */
export async function getHiddenCategorySlugs(): Promise<Set<string>> {
  if (categoryCache && Date.now() - categoryCache.ts < TTL) return categoryCache.slugs;
  try {
    const { data } = await supabase
      .from("resource_categories")
      .select("slug, is_published");
    const slugs = new Set<string>(
      (data ?? [])
        .filter((r: any) => r.is_published === false)
        .map((r: any) => String(r.slug ?? "").toLowerCase())
        .filter(Boolean),
    );
    categoryCache = { slugs, ts: Date.now() };
    return slugs;
  } catch {
    return new Set<string>();
  }
}

/** Devuelve los slugs de categorías publicadas (útil para Resmita). */
export async function getEnabledCategorySlugs(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("resource_categories")
      .select("slug, is_published");
    return (data ?? [])
      .filter((r: any) => r.is_published !== false)
      .map((r: any) => String(r.slug ?? "").toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function invalidateHiddenToolsCache() {
  toolCache = null;
  categoryCache = null;
}

/** Descarta filas cuyo `field` esté en el set de ocultos. */
export function filterOutHidden<T extends Record<string, any>>(rows: T[] | null | undefined, hidden: Set<string>, field: keyof T = "exercise_type" as keyof T): T[] {
  if (!rows || hidden.size === 0) return rows ?? [];
  return rows.filter((r) => {
    const v = String(r?.[field] ?? "").toLowerCase();
    return !v || !hidden.has(v);
  });
}
