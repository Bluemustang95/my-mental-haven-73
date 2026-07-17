import { useEffect, useState } from "react";
import { getHiddenCategorySlugs } from "@/lib/hiddenTools";

/** Devuelve el set (memoizado) de slugs de categorías ocultas por admin. */
export function useHiddenCategories() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    getHiddenCategorySlugs().then((s) => {
      if (alive) setHidden(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  return hidden;
}
