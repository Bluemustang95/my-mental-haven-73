import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WidgetShell, WIDGET_IDENTITY } from "@/components/home/WidgetVisual";

type Q = { text: string; author: string | null };

export function DailyQuoteWidget() {
  const [q, setQ] = useState<Q | null>(null);
  const ink = WIDGET_IDENTITY.daily_quote.ink;

  useEffect(() => {
    supabase.rpc("get_daily_quote").then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : data;
      if (row && (row as any).text) setQ({ text: (row as any).text, author: (row as any).author ?? null });
    });
  }, []);

  return (
    <WidgetShell id="daily_quote">
      <p className="mt-1 font-display text-[13px] font-bold" style={{ color: ink }}>
        Frase del día
      </p>
      {q ? (
        <>
          <p className="mt-1 font-serifElegant text-[14.5px] italic leading-snug" style={{ color: ink }}>
            "{q.text}"
          </p>
          {q.author && (
            <p className="mt-1 text-[11px]" style={{ color: ink, opacity: 0.75 }}>
              — {q.author}
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-[12px]" style={{ color: ink, opacity: 0.6 }}>
          Cargando…
        </p>
      )}
    </WidgetShell>
  );
}
