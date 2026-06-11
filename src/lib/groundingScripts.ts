import { useEffect, useState } from "react";

export type GroundingScripts = {
  see: string;
  touch: string;
  hear: string;
  smell: string;
  taste: string;
};

const KEY = "resma:admin:54321:scripts";

export const DEFAULT_GROUNDING_SCRIPTS: GroundingScripts = {
  see: "Mirá lo que anotaste. Esas cinco cosas están acá, ahora, con vos. Notá cómo el simple acto de mirarlas te trae al presente.",
  touch: "Sentí cada textura que escribiste. Tu cuerpo está en contacto con el mundo. Estás acá.",
  hear: "Escuchá los sonidos que anotaste. El mundo sigue su ritmo alrededor tuyo. Vos sos parte de esto.",
  smell: "Inhalá despacio. Los olores que registraste te conectan con este momento, con este lugar.",
  taste: "Notá el sabor presente en tu boca. Es la prueba de que estás vivo, acá, ahora.",
};

export function getGroundingScripts(): GroundingScripts {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_GROUNDING_SCRIPTS;
    return { ...DEFAULT_GROUNDING_SCRIPTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GROUNDING_SCRIPTS;
  }
}

export function setGroundingScripts(s: GroundingScripts) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function useGroundingScripts(): GroundingScripts {
  const [s, setS] = useState<GroundingScripts>(() => getGroundingScripts());
  useEffect(() => {
    const fn = (e: StorageEvent) => {
      if (e.key === KEY) setS(getGroundingScripts());
    };
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);
  return s;
}
