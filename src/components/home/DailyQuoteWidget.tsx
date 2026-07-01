import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Q = { text: string; author: string | null };

export function DailyQuoteWidget() {
  const [q, setQ] = useState<Q | null>(null);

  useEffect(() => {
    supabase.rpc("get_daily_quote").then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : data;
      if (row && (row as any).text) setQ({ text: (row as any).text, author: (row as any).author ?? null });
    });
  }, []);

  return (
    <div className="glass-premium relative overflow-hidden rounded-3xl p-5">
      <span aria-hidden className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#c5b8e8]/40 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#c5b8e8]/30 text-[#5b4b8a]">
          <Quote size={18} />
        </div>
        <div className="flex-1">
          <p className="font-[Montserrat] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
            Frase del día
          </p>
          {q ? (
            <>
              <p className="mt-1 font-display text-[15px] font-semibold leading-snug text-[#0f172a]">
                "{q.text}"
              </p>
              {q.author && (
                <p className="mt-1 text-[11.5px] text-[#64748b]">— {q.author}</p>
              )}
            </>
          ) : (
            <p className="mt-1 text-[13px] text-[#94a3b8]">Cargando…</p>
          )}
        </div>
      </div>
    </div>
  );
}
