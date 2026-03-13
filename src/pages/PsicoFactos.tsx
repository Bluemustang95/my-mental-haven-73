import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Facto = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[] | null;
};

const RELEVANCE_KEYWORDS: Record<string, string[]> = {
  Sueño: ["insomnio", "dormir", "sueño", "descanso", "noche", "pesadilla"],
  Ansiedad: ["ansiedad", "nervios", "preocup", "pánico", "miedo", "angustia"],
  Depresión: ["triste", "depresión", "anhedonia", "vacío", "desmotiv", "llanto"],
  Estrés: ["estrés", "tensión", "agota", "burnout", "presión", "sobrecarga"],
  Vínculos: ["vínculo", "relación", "pareja", "familia", "amigo", "conflicto"],
  Emociones: ["emoción", "enojo", "ira", "frustración", "culpa", "vergüenza"],
  Cognición: ["pensamiento", "rumiación", "negativo", "distorsión", "catastro"],
};

export default function PsicoFactos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [factos, setFactos] = useState<Facto[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [userKeywords, setUserKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user activity keywords for smart filtering
  useEffect(() => {
    if (!user) return;
    const fetchContext = async () => {
      const [journalRes, dreamRes, checkinRes] = await Promise.all([
        supabase.from("journal_entries").select("content, emotion_tags").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("dream_log").select("description, emotions").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("daily_checkins").select("note").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      const keywords: string[] = [];
      (journalRes.data ?? []).forEach((e) => {
        if (e.content) keywords.push(e.content.toLowerCase());
        (e.emotion_tags ?? []).forEach((t: string) => keywords.push(t.toLowerCase()));
      });
      (dreamRes.data ?? []).forEach((e) => {
        if (e.description) keywords.push(e.description.toLowerCase());
        (e.emotions ?? []).forEach((t: string) => keywords.push(t.toLowerCase()));
      });
      (checkinRes.data ?? []).forEach((e) => {
        if (e.note) keywords.push(e.note.toLowerCase());
      });
      setUserKeywords(keywords);
    };
    fetchContext();
  }, [user]);

  // Fetch factos and favorites
  useEffect(() => {
    const fetchAll = async () => {
      const [contentRes, favRes] = await Promise.all([
        supabase.from("psychoeducation_content").select("id, title, description, category, tags").eq("content_type", "facto").eq("is_published", true).order("sort_order", { ascending: true }),
        user ? supabase.from("content_favorites").select("content_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      ]);
      setFactos(contentRes.data ?? []);
      setFavorites(new Set((favRes.data ?? []).map((f: any) => f.content_id)));
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  // Smart sort: prioritize categories matching user activity
  const sorted = useMemo(() => {
    if (!factos.length) return [];
    if (!userKeywords.length) return factos;

    const scored = factos.map((f) => {
      let score = 0;
      const catKeywords = RELEVANCE_KEYWORDS[f.category] ?? [];
      for (const kw of catKeywords) {
        for (const text of userKeywords) {
          if (text.includes(kw)) score += 1;
        }
      }
      return { ...f, score };
    });
    return scored.sort((a, b) => b.score - a.score);
  }, [factos, userKeywords]);

  const toggleFavorite = async (id: string) => {
    if (!user) return;
    if (favorites.has(id)) {
      await supabase.from("content_favorites").delete().eq("user_id", user.id).eq("content_id", id);
      setFavorites((p) => { const n = new Set(p); n.delete(id); return n; });
      toast("Eliminado de guardados");
    } else {
      await supabase.from("content_favorites").insert({ user_id: user.id, content_id: id });
      setFavorites((p) => new Set(p).add(id));
      toast("Guardado en Conceptos Clave");
    }
  };

  const goTo = (dir: number) => {
    setDirection(dir);
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return sorted.length - 1;
      if (next >= sorted.length) return 0;
      return next;
    });
  };

  const current = sorted[currentIndex];

  const swipeVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/herramientas/contenido")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold">Psico-Factos</h1>
          <p className="text-xs text-muted-foreground">Conceptos clínicos esenciales</p>
        </div>
      </div>

      {/* Counter */}
      <div className="mb-4 text-center">
        <span className="font-display text-xs tracking-wider text-muted-foreground">
          {currentIndex + 1} / {sorted.length}
        </span>
      </div>

      {/* Flashcard */}
      <div className="relative mx-auto min-h-[340px] max-w-sm">
        <AnimatePresence custom={direction} mode="wait">
          {current && (
            <motion.div
              key={current.id}
              custom={direction}
              variants={swipeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (info.offset.x > 80) goTo(-1);
                else if (info.offset.x < -80) goTo(1);
              }}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              {/* Category badge */}
              <div className="mb-4">
                <span className="rounded-full border border-border px-3 py-1 font-display text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {current.category}
                </span>
              </div>

              {/* Title */}
              <h2 className="mb-4 font-display text-base font-semibold leading-snug">
                {current.title}
              </h2>

              {/* Description */}
              <p className="mb-6 font-body text-sm leading-relaxed text-muted-foreground">
                {current.description}
              </p>

              {/* Tags */}
              {current.tags && current.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {current.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Save button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleFavorite(current.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-[11px] font-medium transition-all",
                    favorites.has(current.id)
                      ? "border-destructive/30 bg-destructive/5 text-destructive"
                      : "border-border text-muted-foreground"
                  )}
                >
                  <Heart size={14} weight={favorites.has(current.id) ? "fill" : "regular"} />
                  {favorites.has(current.id) ? "Guardado" : "Guardar"}
                </button>
              </div>

              {/* Legal disclaimer */}
              <p className="mt-5 border-t border-border pt-3 text-center text-[9px] leading-tight text-muted-foreground/60">
                Contenido estrictamente psicoeducativo. No constituye diagnóstico clínico.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <div className="mt-6 flex items-center justify-center gap-8">
        <button
          onClick={() => goTo(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors active:bg-muted"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <button
          onClick={() => goTo(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors active:bg-muted"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}
