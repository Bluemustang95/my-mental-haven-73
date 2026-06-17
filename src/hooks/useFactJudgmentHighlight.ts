import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Result {
  judgments: string[];
  reformulated: string;
}

/**
 * Hook que detecta juicios/interpretaciones en un texto con IA, con debounce.
 * Devuelve fragmentos a resaltar + una reformulación factual.
 */
export function useFactJudgmentHighlight(text: string, enabled: boolean) {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const trimmed = text.trim();
    if (trimmed.length < 25) {
      setData(null);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: err } = await supabase.functions.invoke("dbt-ai", {
          body: { task: "highlight-judgments", payload: { text: trimmed } },
        });
        if (err) throw err;
        if (res?.error) throw new Error(res.error);
        const raw = String(res?.result || "").trim();
        // Strip optional ```json fences
        const cleaned = raw.replace(/^```(json)?\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(cleaned) as Result;
        if (parsed && Array.isArray(parsed.judgments)) setData(parsed);
      } catch (e: any) {
        setError(e?.message || "No se pudo analizar el texto");
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 800);
    return () => clearTimeout(handle);
  }, [text, enabled]);

  return { data, loading, error };
}

/**
 * Devuelve el texto con cada juicio envuelto en una marca highlighted.
 * Útil para mostrar al usuario una vista anotada.
 */
export function annotateJudgments(text: string, judgments: string[]): { type: "text" | "mark"; value: string }[] {
  if (!judgments?.length) return [{ type: "text", value: text }];
  const escapes = judgments
    .filter((j) => j && j.length > 2)
    .sort((a, b) => b.length - a.length)
    .map((j) => j.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escapes.length) return [{ type: "text", value: text }];
  const re = new RegExp(`(${escapes.join("|")})`, "gi");
  const out: { type: "text" | "mark"; value: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ type: "text", value: text.slice(last, i) });
    out.push({ type: "mark", value: m[0] });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}
