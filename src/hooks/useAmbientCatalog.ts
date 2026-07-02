// Dynamic ambient catalog: merges static builders + admin-managed DB rows.
// Any row in ambient_audio_overrides whose sound_id is NOT in the static
// catalog is treated as a "custom" ambiente (MP3-only, admin-added).

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AMBIENT_CATALOG,
  CATALOG_CATEGORY_LABELS,
  type CatalogCategory,
  type CatalogEntry,
  findCatalogEntry,
} from "@/lib/ambientCatalog";

export type DynamicEntry = CatalogEntry & { custom?: boolean; overridden?: boolean };

let cache: { data: DynamicEntry[]; at: number } | null = null;
const TTL = 60_000;
let inflight: Promise<DynamicEntry[]> | null = null;

async function fetchAll(): Promise<DynamicEntry[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("ambient_audio_overrides")
      .select("sound_id, label, category, active")
      .eq("active", true);

    const rows = (data ?? []) as { sound_id: string; label: string; category: string; active: boolean }[];
    const known = new Set(AMBIENT_CATALOG.map((e) => e.id));
    const overridden = new Set(rows.filter((r) => known.has(r.sound_id)).map((r) => r.sound_id));

    const customs: DynamicEntry[] = rows
      .filter((r) => !known.has(r.sound_id))
      .map((r) => ({
        id: r.sound_id,
        label: r.label,
        category: (r.category as CatalogCategory) ?? "abstractos",
        custom: true,
      }));

    const merged: DynamicEntry[] = [
      ...AMBIENT_CATALOG.map((e) => ({ ...e, overridden: overridden.has(e.id) })),
      ...customs,
    ];
    cache = { data: merged, at: Date.now() };
    inflight = null;
    return merged;
  })();
  return inflight;
}

export function invalidateAmbientCatalog() {
  cache = null;
  try { window.dispatchEvent(new Event("ambient-catalog-changed")); } catch { /* noop */ }
}

export function useAmbientCatalog() {
  const [entries, setEntries] = useState<DynamicEntry[]>(() =>
    AMBIENT_CATALOG.map((e) => ({ ...e }))
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => fetchAll().then((d) => { if (alive) { setEntries(d); setLoaded(true); } });
    load();
    const onChange = () => { cache = null; load(); };
    window.addEventListener("ambient-catalog-changed", onChange);
    window.addEventListener("ambient-overrides-changed", onChange);
    return () => {
      alive = false;
      window.removeEventListener("ambient-catalog-changed", onChange);
      window.removeEventListener("ambient-overrides-changed", onChange);
    };
  }, []);

  return { entries, loaded };
}

export { CATALOG_CATEGORY_LABELS, findCatalogEntry, type CatalogCategory, type CatalogEntry };
