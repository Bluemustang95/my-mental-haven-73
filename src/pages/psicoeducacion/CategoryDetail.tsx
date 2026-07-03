import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Video, Headphones, Clock, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Category = {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  accent_color: string | null;
};

type Item = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  text_kind: string | null;
  duration: string | null;
  duration_minutes: number | null;
  sort_order: number | null;
};

function metaFor(item: Item) {
  if (item.content_type === "video")
    return { label: "VIDEO", Icon: Video, color: "#8B7CF6" };
  if (item.content_type === "podcast")
    return { label: "PODCAST", Icon: Headphones, color: "#4FD1C5" };
  if (item.content_type === "text" && item.text_kind === "practice")
    return { label: "PRÁCTICO", Icon: Sparkles, color: "#10B981" };
  return { label: "TEÓRICO", Icon: BookOpen, color: "#8B7CF6" };
}

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cat, setCat] = useState<Category | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [c, i] = await Promise.all([
        supabase.from("psychoeducation_categories" as any).select("*").eq("id", id).maybeSingle(),
        supabase
          .from("psychoeducation_content")
          .select("id,title,description,content_type,text_kind,duration,duration_minutes,sort_order")
          .eq("category_id", id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
      ]);
      setCat((c.data as any) ?? null);
      const list = (i.data as any[]) ?? [];
      setItems(list);

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (uid && list.length) {
        const ids = list.map((x) => x.id);
        const { data: prog } = await supabase
          .from("content_progress")
          .select("content_id, completed")
          .eq("user_id", uid)
          .in("content_id", ids);
        setDoneIds(new Set((prog ?? []).filter((p: any) => p.completed).map((p: any) => p.content_id)));
      }
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="resma-bg-gradient relative min-h-screen overflow-hidden pb-32 safe-area-top">
      <div className="glow-blob" style={{ background: "#7cc2c8", width: 260, height: 260, top: -80, left: -80, opacity: 0.35 }} />
      <div className="glow-blob" style={{ background: "#facb60", width: 240, height: 240, top: 180, right: -80, opacity: 0.3 }} />

      <div className="sticky top-0 z-10 bg-[#FDFCFB]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">
          <button onClick={() => navigate(-1)} className="text-[#101927]" aria-label="Volver">
            <ArrowLeft size={22} />
          </button>
          <h2 className="font-display text-base font-semibold text-[#101927]">Aprender</h2>
        </div>
      </div>

      <div className="relative mx-auto max-w-md px-5 pt-2">
        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#101927]/20 border-t-transparent" />
          </div>
        ) : cat ? (
          <>
            <div
              className="-mx-5 flex flex-col items-center px-5 py-8"
              style={{
                background: `linear-gradient(180deg, ${cat.accent_color ?? "#A78BFA"}22 0%, transparent 100%)`,
              }}
            >
              <div className="text-7xl">{cat.emoji ?? "📘"}</div>
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold text-[#101927]">{cat.title}</h1>
            {cat.description && <p className="mt-2 text-sm text-[#101927]/70">{cat.description}</p>}

            <div className="mt-6 space-y-3">
              {items.map((it, idx) => {
                const meta = metaFor(it);
                const Icon = meta.Icon;
                const isPractice = it.content_type === "text" && it.text_kind === "practice";
                const route = isPractice
                  ? `/herramientas/contenido/practica/${it.id}`
                  : `/herramientas/contenido/leccion/${it.id}`;
                const done = doneIds.has(it.id);
                const isLast = idx === items.length - 1;
                const stepNum = it.sort_order ?? idx + 1;
                return (
                  <div key={it.id} className="relative grid grid-cols-[1fr_40px] items-center gap-3">
                    <motion.button
                      onClick={() => navigate(route)}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center gap-3 rounded-xl border bg-white/80 p-3 text-left shadow-sm ring-1 ring-black/[0.03] backdrop-blur"
                      style={{ borderColor: done ? "#7cc2c866" : `${meta.color}33` }}
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${meta.color}1f`, color: meta.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>
                          {meta.label}
                        </p>
                        <p className="mt-0.5 font-display text-sm font-semibold text-[#101927] line-clamp-2">{it.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#101927]/60">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} />
                            {it.duration_minutes ? `${it.duration_minutes} min.` : it.duration ?? "—"}
                          </span>
                          {done && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#0f766e]">
                              <Check size={11} strokeWidth={3} />
                              {isPractice ? "Hecho" : "Leído"}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>

                    {/* Nodo del camino */}
                    <div className="relative flex h-full items-center justify-center">
                      {!isLast && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-1/2 top-[calc(50%+18px)] h-[calc(100%-18px)] -translate-x-1/2 border-l-2 border-dashed border-[#101927]/20"
                        />
                      )}
                      <div
                        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full font-display text-xs font-bold ${
                          done
                            ? "bg-[#7cc2c8] text-[#0f172a] ring-2 ring-[#7cc2c8]/40"
                            : "bg-white text-[#101927]"
                        }`}
                        style={done ? undefined : { border: `2px dashed ${meta.color}66` }}
                      >
                        {done ? <Check size={14} strokeWidth={3} /> : stepNum}
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <p className="py-6 text-center text-sm text-[#101927]/60">Aún no hay lecciones.</p>}
            </div>
          </>
        ) : (
          <p className="mt-10 text-center text-[#101927]/60">Categoría no encontrada.</p>
        )}
      </div>
    </div>
  );
}

