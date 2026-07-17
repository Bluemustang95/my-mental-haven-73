import { supabase } from "@/integrations/supabase/client";

let cache: { slugs: Set<string>; ts: number } | null = null;
const TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Devuelve el conjunto de slugs de `resource_tools` cuya visibilidad está
 * desactivada (`is_published = false`) desde el panel de admin.
 * Los agregadores (bienestar, resumen psico, actividad) descartan las filas
 * cuyo `exercise_type`/`tool_slug` matchee alguno de estos slugs.
 */
export async function getHiddenToolSlugs(): Promise<Set<string>> {
  if (cache && Date.now() - cache.ts < TTL) return cache.slugs;
  try {
    const { data } = await supabase
      .from("resource_tools")
      .select("slug")
      .eq("is_published", false);
    const slugs = new Set<string>((data ?? []).map((r: any) => String(r.slug ?? "").toLowerCase()).filter(Boolean));
    cache = { slugs, ts: Date.now() };
    return slugs;
  } catch {
    return new Set<string>();
  }
}

export function invalidateHiddenToolsCache() {
  cache = null;
}

/** Descarta filas cuyo `field` (por defecto `exercise_type`) esté en el set de ocultos. */
export function filterOutHidden<T extends Record<string, any>>(rows: T[] | null | undefined, hidden: Set<string>, field: keyof T = "exercise_type" as keyof T): T[] {
  if (!rows || hidden.size === 0) return rows ?? [];
  return rows.filter((r) => {
    const v = String(r?.[field] ?? "").toLowerCase();
    return !v || !hidden.has(v);
  });
}
