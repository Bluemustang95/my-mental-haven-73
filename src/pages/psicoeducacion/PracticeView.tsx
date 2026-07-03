import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { PracticeAnswers, PracticeBlock } from "@/lib/practiceTypes";
import { InstructionsBlock } from "@/components/practice/blocks/InstructionsBlock";
import { ExampleBlock } from "@/components/practice/blocks/ExampleBlock";
import { ProsConsBlock } from "@/components/practice/blocks/ProsConsBlock";
import { ColumnsBlock } from "@/components/practice/blocks/ColumnsBlock";
import { SudsBlock } from "@/components/practice/blocks/SudsBlock";
import { FreeTextBlock } from "@/components/practice/blocks/FreeTextBlock";
import { ChecklistBlock } from "@/components/practice/blocks/ChecklistBlock";

type Content = {
  id: string;
  title: string;
  description: string | null;
  practice_intro: string | null;
  practice_blocks: PracticeBlock[] | null;
  category_id: string | null;
};

export default function PracticeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [content, setContent] = useState<Content | null>(null);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [answers, setAnswers] = useState<PracticeAnswers>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("psychoeducation_content")
        .select("id,title,description,practice_intro,practice_blocks,category_id")
        .eq("id", id)
        .maybeSingle();
      setContent((data as any) ?? null);
      if ((data as any)?.category_id) {
        const { data: c } = await supabase
          .from("psychoeducation_categories" as any)
          .select("title")
          .eq("id", (data as any).category_id)
          .maybeSingle();
        setCategoryTitle((c as any)?.title ?? "");
      }
      if (user) {
        const { data: r } = await supabase
          .from("practice_responses")
          .select("data")
          .eq("user_id", user.id)
          .eq("content_id", id)
          .maybeSingle();
        if (r?.data) setAnswers(r.data as PracticeAnswers);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const scheduleSave = (next: PracticeAnswers, completed = false) => {
    if (!user || !id) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      await supabase.from("practice_responses").upsert(
        { user_id: user.id, content_id: id, data: next, completed },
        { onConflict: "user_id,content_id" }
      );
      setSaving(false);
    }, 800);
  };

  const updateBlock = (blockId: string, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [blockId]: value };
      scheduleSave(next);
      return next;
    });
  };

  const finish = async () => {
    if (!user || !id) {
      navigate(-1);
      return;
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await supabase.from("practice_responses").upsert(
      { user_id: user.id, content_id: id, data: answers, completed: true },
      { onConflict: "user_id,content_id" }
    );
    toast.success("Práctica guardada");
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="resma-bg-gradient flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0f766e] border-t-transparent" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="resma-bg-gradient min-h-screen p-6 text-[#101927]">
        <button onClick={() => navigate(-1)} className="text-[#101927]/70">
          <ArrowLeft size={22} />
        </button>
        <p className="mt-10 text-center text-[#101927]/60">Práctica no encontrada.</p>
      </div>
    );
  }

  const blocks = (content.practice_blocks ?? []) as PracticeBlock[];

  return (
    <div className="resma-bg-gradient relative min-h-screen overflow-hidden pb-28 safe-area-top">
      <div className="glow-blob" style={{ background: "#7cc2c8", width: 260, height: 260, top: -80, left: -80, opacity: 0.3 }} />
      <div className="glow-blob" style={{ background: "#facb60", width: 240, height: 240, top: 220, right: -80, opacity: 0.25 }} />

      <div className="sticky top-0 z-10 border-b border-black/5 bg-[#FDFCFB]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">
          <button onClick={() => navigate(-1)} className="text-[#101927]" aria-label="Volver">
            <ArrowLeft size={22} />
          </button>
          <h2 className="font-display text-sm font-semibold text-[#101927]/80">
            {categoryTitle || "Práctica"}
          </h2>
          {saving && <span className="ml-auto text-[10px] text-[#101927]/50">Guardando…</span>}
        </div>
      </div>

      <div className="relative mx-auto max-w-md px-5 pt-6">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#7cc2c8]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0f766e]">
          <Sparkles size={12} /> Práctico
        </div>
        <h1 className="font-mindful text-3xl leading-tight text-[#101927]">{content.title}</h1>
        {content.practice_intro && (
          <p className="mt-3 text-sm leading-relaxed text-[#101927]/70">{content.practice_intro}</p>
        )}

        <PracticeBlocks
          contentId={content.id}
          blocks={blocks}
          answers={answers}
          onUpdate={updateBlock}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/5 bg-[#FDFCFB]/90 p-4 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <button
            onClick={finish}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7cc2c8] py-4 font-display text-sm font-semibold text-[#0f172a] transition active:scale-[0.98]"
          >
            <CheckCircle2 size={16} /> Guardar y finalizar
          </button>
        </div>
      </div>
    </div>
  );
}

