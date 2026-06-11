import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Category = {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  accent_color: string | null;
  sort_order: number;
};

type Item = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  duration: string | null;
  duration_minutes: number | null;
  content_url: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  is_featured: boolean | null;
};

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export default function Psicoeducacion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [progressByCat, setProgressByCat] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, i] = await Promise.all([
        supabase
          .from("psychoeducation_categories" as any)
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("psychoeducation_content")
          .select("id,title,description,content_type,duration,duration_minutes,content_url,media_url,thumbnail_url,category_id,is_featured")
          .eq("is_published", true)
          .order("is_featured", { ascending: false })
          .order("sort_order", { ascending: true }),
      ]);
      const categories = (c.data as any) ?? [];
      const its = (i.data as any) ?? [];
      setCats(categories);
      setItems(its);

      if (user) {
        const { data: prog } = await supabase
          .from("content_progress")
          .select("content_id, completed")
          .eq("user_id", user.id);
        const completedIds = new Set((prog ?? []).filter((p: any) => p.completed).map((p: any) => p.content_id));
        const map: Record<string, number> = {};
        categories.forEach((cat: Category) => {
          const inCat = its.filter((x: Item) => x.category_id === cat.id);
          if (!inCat.length) return (map[cat.id] = 0);
          const done = inCat.filter((x: Item) => completedIds.has(x.id)).length;
          map[cat.id] = Math.round((done / inCat.length) * 100);
        });
        setProgressByCat(map);
      }
      setLoading(false);
    })();
  }, [user]);

  const featured = items.find((i) => i.is_featured && i.content_type === "video") || items.find((i) => i.content_type === "video");
  const podcasts = items.filter((i) => i.content_type === "podcast");
  const courseCats = cats.filter((c: any) => (c.content_type ?? "video") !== "podcast");

  const openLesson = (id: string) => navigate(`/herramientas/contenido/leccion/${id}`);
  const openCategory = (id: string) => navigate(`/herramientas/contenido/categoria/${id}`);

  return (
    <div className="min-h-screen bg-[#0B0B10] pb-32 text-white safe-area-top">
      <div className="mx-auto max-w-md px-5 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 -ml-2 flex h-9 w-9 items-center justify-center text-white/70"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>

        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8A365]">Aprende y comprende</p>
        <h1 className="mt-1 font-mindful text-4xl leading-[1.05] text-white">Psicoeducación</h1>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : (
          <>
            {featured && (
              <motion.button
                onClick={() => openLesson(featured.id)}
                whileTap={{ scale: 0.98 }}
                className="mt-6 block w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] text-left shadow-[0_8px_28px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-indigo-400/40 blur-3xl" />
                    <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30">
                      <Play size={28} className="text-white" fill="white" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    VIDEO{featured.duration_minutes ? ` · ${featured.duration_minutes} MIN` : featured.duration ? ` · ${featured.duration}` : ""}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-lg font-semibold text-white">{featured.title}</h2>
                  {featured.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60 line-clamp-3">{featured.description}</p>
                  )}
                </div>
              </motion.button>
            )}

            <div className="mt-8">
              <h3 className="mb-3 px-1 font-display text-base font-semibold text-white">Seguir conociendo</h3>
              <div className="space-y-3">
                {courseCats.map((cat) => {
                  const accent = cat.accent_color ?? "#A78BFA";
                  const prog = progressByCat[cat.id] ?? 0;
                  return (
                    <motion.button
                      key={cat.id}
                      onClick={() => openCategory(cat.id)}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] p-4 text-left"
                      style={{ background: hexToRgba(accent, 0.14) }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold text-white line-clamp-1">{cat.title}</p>
                        {cat.description && (
                          <p className="mt-0.5 text-xs leading-snug text-white/65 line-clamp-2">{cat.description}</p>
                        )}
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                          <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, background: accent }} />
                        </div>
                      </div>
                      <div className="text-4xl">{cat.emoji ?? "📘"}</div>
                    </motion.button>
                  );
                })}
                {courseCats.length === 0 && (
                  <p className="py-6 text-center text-sm text-white/55">Pronto sumaremos categorías.</p>
                )}
              </div>
            </div>

            {podcasts.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-3 flex items-center gap-2 px-1 font-display text-base font-semibold text-white">
                  <Headphones size={18} className="text-[#E8A365]" /> Podcasts
                </h3>
                <div className="space-y-2">
                  {podcasts.map((p) => (
                    <motion.button
                      key={p.id}
                      onClick={() => openLesson(p.id)}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3 text-left"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[#E8A365]">
                        <Play size={18} fill="currentColor" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-semibold text-white line-clamp-1">{p.title}</p>
                        <p className="text-xs text-white/55">
                          {p.duration_minutes ? `${p.duration_minutes} min.` : p.duration ?? ""}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
