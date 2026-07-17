import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Star, BookOpen, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type News = {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  image_url: string | null;
  source: string | null;
  author: string | null;
  tags: string[] | null;
  featured: boolean;
  published_at: string;
};

export default function ResmaResearch() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("psychology_news")
      .select("*")
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(80);
    setRows((data as News[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => (r.tags ?? []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = tag === "all" ? rows : rows.filter(r => (r.tags ?? []).includes(tag));
  const featured = filtered.filter(r => r.featured);
  const rest = filtered.filter(r => !r.featured);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-[#FDFCFB]/90 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate("/herramientas")} className="rounded-full p-2 hover:bg-black/5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-[19px] font-bold text-[#101927]">Resma Research</h1>
          <p className="text-[11px] text-[#101927]/55">Investigación en psicología y salud mental</p>
        </div>
        <button onClick={load} className="rounded-full p-2 hover:bg-black/5" aria-label="Recargar">
          <RefreshCw size={16} />
        </button>
      </header>

      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 scrollbar-hide">
          <button
            onClick={() => setTag("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${tag === "all" ? "bg-[#101927] text-white" : "bg-white text-[#101927]/70 border border-black/10"}`}
          >Todas</button>
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${tag === t ? "bg-[#7cc2c8] text-[#101927]" : "bg-white text-[#101927]/70 border border-black/10"}`}
            >#{t}</button>
          ))}
        </div>
      )}

      <div className="px-4 pt-4 space-y-6">
        {loading && <p className="text-center text-sm text-[#101927]/50 py-10">Cargando…</p>}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center">
            <BookOpen className="mx-auto mb-2 text-[#7cc2c8]" size={28} />
            <p className="font-semibold text-[#101927]">Todavía no hay noticias</p>
            <p className="mt-1 text-sm text-[#101927]/55">
              Cuando el admin publique investigaciones aparecerán acá.
            </p>
          </div>
        )}

        {featured.length > 0 && (
          <section>
            <p className="mb-2 font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">
              Destacadas
            </p>
            <div className="grid gap-3">
              {featured.map(n => <NewsCard key={n.id} n={n} big />)}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <p className="mb-2 font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">
              Últimas publicaciones
            </p>
            <div className="grid gap-3">
              {rest.map(n => <NewsCard key={n.id} n={n} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function NewsCard({ n, big = false }: { n: News; big?: boolean }) {
  const content = (
    <motion.article
      whileTap={{ scale: 0.98 }}
      className={`overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_10px_30px_-14px_rgba(16,25,39,0.10)] ${big ? "" : ""}`}
    >
      {n.image_url && (
        <div className={`${big ? "h-44" : "h-32"} w-full overflow-hidden bg-[#101927]/5`}>
          <img src={n.image_url} alt={n.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#101927]/50">
          {n.featured && <Star size={12} className="text-[#facb60]" />}
          {n.source && <span>{n.source}</span>}
          {n.source && <span>·</span>}
          <span>{new Date(n.published_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
        <h3 className={`mt-2 font-serif font-bold leading-tight text-[#101927] ${big ? "text-[18px]" : "text-[15px]"}`}>
          {n.title}
        </h3>
        {n.summary && (
          <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[#101927]/70">{n.summary}</p>
        )}
        {(n.tags ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(n.tags ?? []).slice(0, 4).map(t => (
              <span key={t} className="rounded-full bg-[#7cc2c8]/15 px-2 py-0.5 text-[10px] font-semibold text-[#3d8a90]">#{t}</span>
            ))}
          </div>
        )}
        {n.url && (
          <div className="mt-3 flex items-center gap-1 text-[12px] font-bold text-[#7cc2c8]">
            Leer nota completa <ExternalLink size={12} />
          </div>
        )}
      </div>
    </motion.article>
  );

  if (n.url) return <a href={n.url} target="_blank" rel="noreferrer noopener">{content}</a>;
  return content;
}
