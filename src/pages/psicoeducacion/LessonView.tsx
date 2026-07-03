import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { RichContent } from "@/components/psico/RichContent";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  body_html: string | null;
  media_url: string | null;
  content_url: string | null;
  category_id: string | null;
};

function spotifyEmbed(url: string) {
  return url.replace("episode/", "embed/episode/").replace("show/", "embed/show/");
}

function youTubeEmbed(url: string) {
  // returns YT embed url if recognized, else null
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {}
  return null;
}

export default function LessonView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [categoryTitle, setCategoryTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [alreadyRead, setAlreadyRead] = useState(false);
  const [autoMarked, setAutoMarked] = useState(false);
  const reachedEndRef = useRef(false);
  const timeReachedRef = useRef(false);
  const endSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("psychoeducation_content")
        .select("id,title,description,content_type,body_html,media_url,content_url,category_id")
        .eq("id", id)
        .maybeSingle();
      setLesson((data as any) ?? null);
      if ((data as any)?.category_id) {
        const { data: c } = await supabase
          .from("psychoeducation_categories" as any)
          .select("title")
          .eq("id", (data as any).category_id)
          .maybeSingle();
        setCategoryTitle((c as any)?.title ?? "");
      }
      if (user && (data as any)?.id) {
        const { data: p } = await supabase
          .from("content_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("content_id", (data as any).id)
          .maybeSingle();
        if ((p as any)?.completed) setAlreadyRead(true);
      }
      setLoading(false);
    })();
  }, [id, user]);

  // Auto-mark as read: scroll-to-end + 20s minimum reading time (both conditions)
  useEffect(() => {
    if (loading || alreadyRead || autoMarked || !lesson || !user) return;
    if (lesson.content_type !== "text") return;

    const tryComplete = async () => {
      if (!reachedEndRef.current || !timeReachedRef.current) return;
      if (autoMarked) return;
      setAutoMarked(true);
      await supabase.from("content_progress").upsert(
        {
          user_id: user.id,
          content_id: lesson.id,
          completed: true,
          progress_percent: 100,
          last_accessed: new Date().toISOString(),
        },
        { onConflict: "user_id,content_id" }
      );
      setAlreadyRead(true);
      toast.success("Marcado como leído");
    };

    const t = window.setTimeout(() => {
      timeReachedRef.current = true;
      tryComplete();
    }, 20000);

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reachedEndRef.current = true;
          tryComplete();
        }
      },
      { rootMargin: "0px 0px -5% 0px" }
    );
    if (endSentinelRef.current) obs.observe(endSentinelRef.current);
    return () => {
      window.clearTimeout(t);
      obs.disconnect();
    };
  }, [loading, alreadyRead, autoMarked, lesson, user]);

  const markDone = async () => {
    if (!lesson || !user) {
      navigate(-1);
      return;
    }
    if (!alreadyRead) {
      await supabase.from("content_progress").upsert(
        {
          user_id: user.id,
          content_id: lesson.id,
          completed: true,
          progress_percent: 100,
          last_accessed: new Date().toISOString(),
        },
        { onConflict: "user_id,content_id" }
      );
      toast.success("Marcado como completado");
    }
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="resma-bg-gradient flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#101927]/30 border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="resma-bg-gradient min-h-screen p-6 text-[#101927]">
        <button onClick={() => navigate(-1)} className="text-[#101927]/70">
          <ArrowLeft size={22} />
        </button>
        <p className="mt-10 text-center text-[#101927]/60">Contenido no encontrado.</p>
      </div>
    );
  }

  const url = lesson.media_url ?? lesson.content_url ?? "";

  return (
    <div className="resma-bg-gradient relative min-h-screen overflow-hidden pb-28 safe-area-top">
      <div className="glow-blob" style={{ background: "#7cc2c8", width: 260, height: 260, top: -80, left: -80, opacity: 0.3 }} />
      <div className="glow-blob" style={{ background: "#facb60", width: 240, height: 240, top: 220, right: -80, opacity: 0.25 }} />

      <div className="sticky top-0 z-10 border-b border-black/5 bg-[#FDFCFB]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">
          <button onClick={() => navigate(-1)} className="text-[#101927]" aria-label="Volver">
            <ArrowLeft size={22} />
          </button>
          <h2 className="font-display text-sm font-semibold text-[#101927]/80">{categoryTitle || "Lección"}</h2>
        </div>
      </div>

      <div className="relative mx-auto max-w-md px-5 pt-6">
        {lesson.content_type === "text" && (
          <>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#c5b8e8]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#6B4EFF]">
              Teórico
              {alreadyRead && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7cc2c8] text-white">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>
            <h1 className="font-mindful text-3xl leading-tight text-[#101927]">{lesson.title}</h1>
            {lesson.body_html ? (
              <div className="mt-6">
                <RichContent html={lesson.body_html} />
              </div>
            ) : (
              <p className="mt-6 text-[#101927]/60">Sin contenido.</p>
            )}
            <div ref={endSentinelRef} className="h-1" />
          </>
        )}

        {lesson.content_type === "video" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-bold text-[#101927]">{lesson.title}</h1>
            {(() => {
              const yt = youTubeEmbed(url);
              if (yt) {
                return (
                  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                    <iframe
                      src={yt}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              return (
                <video controls className="w-full overflow-hidden rounded-2xl bg-black" src={url} />
              );
            })()}
            {lesson.description && <p className="mt-4 text-sm text-[#101927]/70">{lesson.description}</p>}
          </>
        )}

        {lesson.content_type === "podcast" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-bold text-[#101927]">{lesson.title}</h1>
            <iframe
              style={{ borderRadius: 12 }}
              src={spotifyEmbed(url)}
              width="100%"
              height={352}
              frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
            {lesson.description && <p className="mt-4 text-sm text-[#101927]/70">{lesson.description}</p>}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/5 bg-[#FDFCFB]/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <button
            onClick={markDone}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-sm font-semibold transition active:scale-[0.98] ${
              alreadyRead ? "bg-[#7cc2c8] text-[#0f172a]" : "bg-[#7cc2c8] text-[#0f172a]"
            }`}
          >
            {alreadyRead ? (
              <>
                <Check size={16} strokeWidth={3} /> Leído · Volver
              </>
            ) : (
              "Entendido, continuar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

