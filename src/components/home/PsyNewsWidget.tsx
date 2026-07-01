import { useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type N = { title: string; summary: string | null; url: string | null; image_url: string | null; published_at: string };

export function PsyNewsWidget() {
  const [news, setNews] = useState<N | null>(null);

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

  const content = (
    <>
      <span aria-hidden className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#7cc2c8]/35 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#7cc2c8]/25 text-[#3d8a90]">
          <Newspaper size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-[Montserrat] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
              Noticias de psicología
            </p>
            {news?.url && <ExternalLink size={11} className="text-[#94a3b8]" />}
          </div>
          {news ? (
            <>
              <p className="mt-1 font-display text-[14.5px] font-semibold leading-snug text-[#0f172a] line-clamp-2">
                {news.title}
              </p>
              {news.summary && (
                <p className="mt-1 text-[11.5px] leading-snug text-[#64748b] line-clamp-2">
                  {news.summary}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-[13px] text-[#94a3b8]">Sin noticias por ahora.</p>
          )}
        </div>
      </div>
    </>
  );

  const className = "glass-premium relative overflow-hidden rounded-3xl p-5 block w-full text-left";

  if (news?.url) {
    return (
      <a href={news.url} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}
