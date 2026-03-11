import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Headphones, FileText, ArrowRight, BookOpen } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type ContentItem = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  category: string;
  duration: string | null;
  tags: string[] | null;
  content_url: string;
  is_premium: boolean | null;
};

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  audio: Headphones,
  pdf: FileText,
};

export default function ContentLibrary() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [filter, setFilter] = useState<"all" | "video" | "audio" | "pdf">("all");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("psychoeducation_content")
      .select("id, title, description, content_type, category, duration, tags, content_url, is_premium")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setContent(data ?? []);
        setLoading(false);
      });
  }, []);

  const categories = ["Todos", ...Array.from(new Set(content.map((c) => c.category)))];

  const filtered = content.filter((c) => {
    if (activeCategory !== "Todos" && c.category !== activeCategory) return false;
    if (filter !== "all" && c.content_type !== filter) return false;
    return true;
  });

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate("/herramientas")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Psicoeducación</h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Material para aprender sobre tu salud mental.</p>

      {/* Type filter */}
      <div className="mb-4 flex gap-2">
        {(["all", "video", "audio", "pdf"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-display text-[10px] font-medium uppercase tracking-wider transition-all",
              filter === t ? "border-accent bg-accent/10" : "border-border text-muted-foreground"
            )}
          >
            {t === "all" ? "Todos" : t === "video" ? "Videos" : t === "audio" ? "Audios" : "Lecturas"}
          </button>
        ))}
      </div>

      {/* Category scroll */}
      <div className="mb-5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 font-display text-[10px] font-medium transition-all shrink-0",
              activeCategory === cat ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon = typeIcons[item.content_type] || BookOpen;
            return (
              <a
                key={item.id}
                href={item.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Icon size={18} weight="duotone" className="text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  <p className="mt-1 font-display text-[10px] text-muted-foreground">{item.duration}</p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
              </a>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay contenido en esta categoría.</p>
          )}
        </div>
      )}
    </div>
  );
}
