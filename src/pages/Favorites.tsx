import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ArrowLeft, BookOpen } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

type FavContent = {
  id: string;
  content_id: string;
  title: string;
  category: string;
  content_type: string;
};

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("content_favorites")
        .select("id, content_id, psychoeducation_content(title, category, content_type)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const mapped = (data ?? []).map((d: any) => ({
        id: d.id,
        content_id: d.content_id,
        title: d.psychoeducation_content?.title ?? "Sin título",
        category: d.psychoeducation_content?.category ?? "",
        content_type: d.psychoeducation_content?.content_type ?? "",
      }));
      setFavorites(mapped);
      setLoading(false);
    })();
  }, [user]);

  const removeFav = async (id: string) => {
    await supabase.from("content_favorites").delete().eq("id", id);
    setFavorites((f) => f.filter((x) => x.id !== id));
  };

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <button onClick={() => navigate("/herramientas")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Herramientas
      </button>
      <h1 className="mb-2 font-display text-xl font-semibold">Mi Botiquín</h1>
      <p className="mb-6 text-sm text-muted-foreground">Tus contenidos favoritos para acceso rápido.</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Star size={32} weight="duotone" className="mx-auto mb-3 text-accent" />
          <p className="font-display text-sm font-medium">Aún no tenés favoritos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Marcá contenidos con ★ desde Psicoeducación para verlos acá.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {favorites.map((fav) => (
              <motion.div
                key={fav.id}
                layout
                exit={{ opacity: 0, x: -40 }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <BookOpen size={20} weight="duotone" className="text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-medium truncate">{fav.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{fav.category} · {fav.content_type}</p>
                </div>
                <button onClick={() => removeFav(fav.id)} className="p-1 text-accent active:scale-90 transition-transform">
                  <Star size={20} weight="fill" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
