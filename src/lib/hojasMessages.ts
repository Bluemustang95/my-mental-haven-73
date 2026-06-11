import { useEffect, useState } from "react";

export type HojasMessages = { pre: string; post: string };

const KEY = "resma:admin:hojas:messages";

export const DEFAULT_HOJAS_MESSAGES: HojasMessages = {
  pre: "Observá tus pensamientos como si fueran hojas que caen, nubes que pasan o vagones de un tren. No los pares, no los discutas. Solo dejá que crucen.",
  post: "Notaste cómo los pensamientos vienen y van. Vos no sos tus pensamientos: sos quien los observa. Llevate esa calma con vos.",
};

export function getHojasMessages(): HojasMessages {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_HOJAS_MESSAGES;
    return { ...DEFAULT_HOJAS_MESSAGES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_HOJAS_MESSAGES;
  }
}

export function setHojasMessages(m: HojasMessages) {
  localStorage.setItem(KEY, JSON.stringify(m));
}

export function useHojasMessages(): HojasMessages {
  const [m, setM] = useState<HojasMessages>(() => getHojasMessages());
  useEffect(() => {
    const fn = (e: StorageEvent) => {
      if (e.key === KEY) setM(getHojasMessages());
    };
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);
  return m;
}
