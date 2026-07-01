import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PremiumLock } from "@/components/PremiumLock";

type Category = {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  accent_color: string | null;
  sort_order: number;
  is_premium?: boolean | null;
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
    <div className="resma-bg-gradient relative min-h-screen overflow-hidden pb-32 safe-area-top">
      <div className="glow-blob" style={{ background: "#7cc2c8", width: 260, height: 260, top: -80, left: -80, opacity: 0.35 }} />
      <div className="glow-blob" style={{ background: "#facb60", width: 240, height: 240, top: 180, right: -80, opacity: 0.3 }} />

      <div className="relative mx-auto max-w-md px-5 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-3 -ml-2 flex h-9 w-9 items-center justify-center text-[#0f172a]/60"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>

        <p className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.22em] text-[#b45309]">
          Aprende y comprende
        </p>
        <h1 className="mt-1 font-display text-[32px] font-bold leading-[1.05] text-[#0f172a]">
          Psicoeducación
        </h1>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0f172a]/20 border-t-transparent" />
          </div>
        ) : (
          <>
            {featured && (
              <motion.button
                onClick={() => openLesson(featured.id)}
                whileTap={{ scale: 0.98 }}
                className="glass-premium mt-6 block w-full overflow-hidden rounded-3xl text-left"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#7cc2c8]/60 via-[#c5b8e8]/60 to-[#facb60]/60">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/75 shadow-lg ring-1 ring-white">
                      <Play size={26} className="text-[#0f172a]" fill="currentColor" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0f172a]">
                    VIDEO{featured.duration_minutes ? ` · ${featured.duration_minutes} MIN` : featured.duration ? ` · ${featured.duration}` : ""}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-lg font-semibold text-[#0f172a]">{featured.title}</h2>
                  {featured.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-[#64748b] line-clamp-3">
                      {featured.description}
                    </p>
                  )}
                </div>
              </motion.button>
            )}

            <div className="mt-8">
              <h3 className="mb-3 px-1 font-display text-base font-semibold text-[#0f172a]">
                Seguir conociendo
              </h3>
              <div className="space-y-3">
                {courseCats.map((cat) => {
                  const accent = cat.accent_color ?? "#7cc2c8";
                  const prog = progressByCat[cat.id] ?? 0;
                  const card = (
                    <motion.button
                      key={cat.id}
                      onClick={() => openCategory(cat.id)}
                      whileTap={{ scale: 0.98 }}
                      className="glass-premium flex w-full items-center gap-3 rounded-2xl p-4 text-left"
                      style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.18)}, rgba(255,255,255,0.85))` }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold text-[#0f172a] line-clamp-1">
                          {cat.title}
                        </p>
                        {cat.description && (
                          <p className="mt-0.5 text-xs leading-snug text-[#64748b] line-clamp-2">
                            {cat.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${prog}%`, background: accent }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums text-[#0f172a]/60">
                            {prog}%
                          </span>
                        </div>
                      </div>
                      <div className="text-4xl">{cat.emoji ?? "📘"}</div>
                    </motion.button>
                  );
                  if (!cat.is_premium) return card;
                  return (
                    <PremiumLock key={cat.id} featureName={cat.title} variant="card">
                      {card}
                    </PremiumLock>
                  );
                })}
                {courseCats.length === 0 && (
                  <p className="py-6 text-center text-sm text-[#94a3b8]">Pronto sumaremos categorías.</p>
                )}
              </div>
            </div>

            {podcasts.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-3 flex items-center gap-2 px-1 font-display text-base font-semibold text-[#0f172a]">
                  <Headphones size={18} className="text-[#b45309]" /> Podcasts
                </h3>
                <PremiumLock featureName="Podcasts Premium" variant="section">
                  <div className="space-y-2">
                    {podcasts.map((p) => (
                      <motion.button
                        key={p.id}
                        onClick={() => openLesson(p.id)}
                        whileTap={{ scale: 0.98 }}
                        className="glass-premium flex w-full items-center gap-3 rounded-2xl p-3 text-left"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#facb60]/20 text-[#b45309]">
                          <Play size={18} fill="currentColor" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-semibold text-[#0f172a] line-clamp-1">
                            {p.title}
                          </p>
                          <p className="text-xs text-[#64748b]">
                            {p.duration_minutes ? `${p.duration_minutes} min.` : p.duration ?? ""}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </PremiumLock>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

