import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Headphones, FileText, ArrowRight, BookOpen, Heart, Lightning } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [filter, setFilter] = useState<"all" | "video" | "audio" | "pdf" | "favorites">("all");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [contentRes, favRes] = await Promise.all([
        supabase
          .from("psychoeducation_content")
          .select("id, title, description, content_type, category, duration, tags, content_url, is_premium")
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
        user
          ? supabase.from("content_favorites").select("content_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);
      setContent(contentRes.data ?? []);
      setFavorites(new Set((favRes.data ?? []).map((f: any) => f.content_id)));
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const toggleFavorite = async (contentId: string) => {
    if (!user) return;
    if (favorites.has(contentId)) {
      await supabase.from("content_favorites").delete().eq("user_id", user.id).eq("content_id", contentId);
      setFavorites((prev) => { const n = new Set(prev); n.delete(contentId); return n; });
    } else {
      await supabase.from("content_favorites").insert({ user_id: user.id, content_id: contentId });
      setFavorites((prev) => new Set(prev).add(contentId));
    }
  };

  const categories = ["Todos", ...Array.from(new Set(content.map((c) => c.category)))];

  const filtered = content.filter((c) => {
    if (filter === "favorites") return favorites.has(c.id);
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

      {/* Psico-Factos CTA */}
      <button
        onClick={() => navigate("/herramientas/contenido/psico-factos")}
        className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left transition-colors active:bg-accent/10"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
          <Lightning size={18} weight="duotone" className="text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-medium">Psico-Factos</p>
          <p className="text-xs text-muted-foreground">Conceptos clínicos en tarjetas</p>
        </div>
        <ArrowRight size={14} className="text-muted-foreground" />
      </button>

      {/* Type filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {(["all", "video", "audio", "pdf", "favorites"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 font-display text-[10px] font-medium uppercase tracking-wider transition-all",
              filter === t ? "border-accent bg-accent/10" : "border-border text-muted-foreground"
            )}
          >
            {t === "all" ? "Todos" : t === "video" ? "Videos" : t === "audio" ? "Audios" : t === "pdf" ? "Lecturas" : "♥ Guardados"}
          </button>
        ))}
      </div>

      {/* Category scroll */}
      {filter !== "favorites" && (
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
      )}

      {/* Content list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon = typeIcons[item.content_type] || BookOpen;
            const isFav = favorites.has(item.id);
            return (
              <div
                key={item.id}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors"
              >
                <a
                  href={item.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <Icon size={18} weight="duotone" className="text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    <p className="mt-1 font-display text-[10px] text-muted-foreground">{item.duration}</p>
                  </div>
                </a>
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className="shrink-0 p-1"
                >
                  <Heart
                    size={18}
                    weight={isFav ? "fill" : "regular"}
                    className={isFav ? "text-destructive" : "text-muted-foreground"}
                  />
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {filter === "favorites" ? "No tenés contenido guardado aún." : "No hay contenido en esta categoría."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
