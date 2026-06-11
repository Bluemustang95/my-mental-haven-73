import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, BookOpen, Brain, Heart, Sparkles, Flower2, Wind, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { toast } from "sonner";

type PsychoItem = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  duration: string | null;
  category: string | null;
  content_url: string | null;
  is_featured?: boolean | null;
};

const pastels = [
  { bg: "bg-[#E8F1FB]", fg: "text-[#3A77B8]", icon: BookOpen },
  { bg: "bg-[#E9F6EC]", fg: "text-[#3F8F58]", icon: Flower2 },
  { bg: "bg-[#FDECE2]", fg: "text-[#B8612C]", icon: Heart },
  { bg: "bg-[#F0EAFB]", fg: "text-[#6E55B0]", icon: Brain },
  { bg: "bg-[#FEF4D6]", fg: "text-[#9A7A1E]", icon: Sun },
  { bg: "bg-[#EAF5F7]", fg: "text-[#3E8896]", icon: Wind },
];

export default function Psicoeducacion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<PsychoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("psychoeducation_content")
        .select("id, title, description, content_type, duration, category, content_url, is_featured")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });
      setItems((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const featured =
    items.find((i) => i.is_featured) ||
    items.find((i) => i.content_type === "video") ||
    items[0];
  const articles = items.filter((i) => i.id !== featured?.id);

  const markCompleted = async (item: PsychoItem) => {
    if (!user) return;
    await supabase.from("content_progress").upsert(
      {
        user_id: user.id,
        content_id: item.id,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,content_id" }
    );
    if (item.content_url) window.open(item.content_url, "_blank", "noopener");
    else toast.success("Marcado como leído ✓");
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-28 safe-area-top">
      <div className="mx-auto max-w-md px-5 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2 flex h-9 w-9 items-center justify-center text-[#101927]/70"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>

        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B8612C]">
          Aprende y comprende
        </p>
        <h1 className="mt-1 font-serif text-4xl leading-[1.05] text-[#101927]">
          Psicoeducación
        </h1>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#B8612C] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Featured video card */}
            {featured && (
              <motion.button
                onClick={() => markCompleted(featured)}
                whileTap={{ scale: 0.98 }}
                className="mt-6 block w-full overflow-hidden rounded-3xl border border-white/60 bg-white/65 text-left shadow-[0_8px_28px_-12px_rgba(16,25,39,0.18)] backdrop-blur-xl"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-amber-300/40 blur-3xl" />
                    <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-orange-400/30 blur-3xl" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30">
                      <Play size={28} className="text-white" fill="white" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                    {featured.content_type === "video" ? "Video" : featured.content_type}
                    {featured.duration ? ` · ${featured.duration}` : ""}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-lg font-semibold leading-snug text-[#101927]">
                    {featured.title}
                  </h2>
                  {featured.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {featured.description}
                    </p>
                  )}
                </div>
              </motion.button>
            )}

            {/* Articles list */}
            <div className="mt-7">
              <h3 className="mb-3 px-1 font-display text-base font-semibold text-[#101927]">
                Artículos recomendados
              </h3>
              <div className="space-y-3">
                {articles.map((item, i) => {
                  const p = pastels[i % pastels.length];
                  const Icon = p.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => markCompleted(item)}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/65 p-3 text-left shadow-[0_4px_16px_-10px_rgba(16,25,39,0.15)] backdrop-blur-xl"
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${p.bg} ${p.fg}`}
                      >
                        <Icon size={22} strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-semibold text-[#101927] line-clamp-1">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
                {articles.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Pronto sumaremos más contenido.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
