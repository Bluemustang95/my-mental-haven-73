import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WidgetShell, WIDGET_IDENTITY } from "@/components/home/WidgetVisual";

type N = { title: string; summary: string | null; url: string | null; image_url: string | null; published_at: string };

export function PsyNewsWidget() {
  const [news, setNews] = useState<N | null>(null);
  const ink = WIDGET_IDENTITY.psy_news.ink;

  useEffect(() => {
    supabase
      .from("psychology_news")
      .select("title, summary, url, image_url, published_at")
      .eq("active", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setNews(data as N | null));
  }, []);

  const inner = (
    <>
      <div className="mt-1 flex items-center gap-1.5">
        <p className="font-display text-[13px] font-bold" style={{ color: ink }}>
          Noticias de psicología
        </p>
        {news?.url && <ExternalLink size={11} style={{ color: ink, opacity: 0.7 }} />}
      </div>
      {news ? (
        <>
          <p className="mt-1 font-display text-[13.5px] font-semibold leading-snug line-clamp-2" style={{ color: ink }}>
            {news.title}
          </p>
          {news.summary && (
            <p className="mt-1 text-[11px] leading-snug line-clamp-2" style={{ color: ink, opacity: 0.75 }}>
              {news.summary}
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-[12px]" style={{ color: ink, opacity: 0.7 }}>
          Sin noticias por ahora.
        </p>
      )}
    </>
  );

  if (news?.url) {
    return (
      <a href={news.url} target="_blank" rel="noreferrer" className="block">
        <WidgetShell id="psy_news">{inner}</WidgetShell>
      </a>
    );
  }
  return <WidgetShell id="psy_news">{inner}</WidgetShell>;
}
