import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
      setLoading(false);
    })();
  }, [id]);

  const markDone = async () => {
    if (!lesson || !user) {
      navigate(-1);
      return;
    }
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
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0B10]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#0B0B10] p-6 text-white">
        <button onClick={() => navigate(-1)} className="text-white/70">
          <ArrowLeft size={22} />
        </button>
        <p className="mt-10 text-center text-white/60">Contenido no encontrado.</p>
      </div>
    );
  }

  const url = lesson.media_url ?? lesson.content_url ?? "";

  return (
    <div className="min-h-screen bg-[#0B0B10] pb-40 text-white safe-area-top">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0B0B10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">
          <button onClick={() => navigate(-1)} className="text-white/80" aria-label="Volver">
            <ArrowLeft size={22} />
          </button>
          <h2 className="font-display text-sm font-semibold text-white/80">{categoryTitle || "Lección"}</h2>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-6">
        {lesson.content_type === "text" && (
          <>
            <h1 className="font-mindful text-3xl leading-tight text-white">{lesson.title}</h1>
            {lesson.body_html ? (
              <div
                className="prose prose-invert prose-slate mt-6 max-w-none prose-headings:font-display prose-strong:text-white prose-a:text-[#8B7CF6]"
                dangerouslySetInnerHTML={{ __html: lesson.body_html }}
              />
            ) : (
              <p className="mt-6 text-white/60">Sin contenido.</p>
            )}
          </>
        )}

        {lesson.content_type === "video" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-bold text-white">{lesson.title}</h1>
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
            {lesson.description && <p className="mt-4 text-sm text-white/70">{lesson.description}</p>}
          </>
        )}

        {lesson.content_type === "podcast" && (
          <>
            <h1 className="mb-4 font-display text-2xl font-bold text-white">{lesson.title}</h1>
            <iframe
              style={{ borderRadius: 12 }}
              src={spotifyEmbed(url)}
              width="100%"
              height={352}
              frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
            {lesson.description && <p className="mt-4 text-sm text-white/70">{lesson.description}</p>}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-[#0B0B10]/95 p-4 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <button
            onClick={markDone}
            className="w-full rounded-2xl bg-[#6B4EFF] py-4 font-display text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            Entendido, continuar
          </button>
        </div>
      </div>
    </div>
  );
}
