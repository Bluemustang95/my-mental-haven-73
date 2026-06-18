import { useCallback, useEffect, useState } from "react";

const KEY = "mindfulness:favorites:v1";

export type FavKind = "breathing-intention" | "breathing-pattern" | "observar" | "describir";

export interface Favorite {
  id: string;        // unique stable id, e.g. `breathing-intention:dormir:5`
  kind: FavKind;
  label: string;     // human readable
  payload: Record<string, any>;
}

function read(): Favorite[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: Favorite[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  } catch {}
}

export function useMindfulnessFavorites() {
  const [favs, setFavs] = useState<Favorite[]>([]);

  useEffect(() => {
    setFavs(read());
  }, []);

  const has = useCallback((id: string) => favs.some((f) => f.id === id), [favs]);

  const toggle = useCallback((fav: Favorite) => {
    setFavs((prev) => {
      const next = prev.some((f) => f.id === fav.id)
        ? prev.filter((f) => f.id !== fav.id)
        : [fav, ...prev];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setFavs((prev) => {
      const next = prev.filter((f) => f.id !== id);
      write(next);
      return next;
    });
  }, []);

  return { favs, has, toggle, remove };
}
