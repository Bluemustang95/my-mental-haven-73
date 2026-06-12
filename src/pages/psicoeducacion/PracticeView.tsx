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
      <div className="flex min-h-screen items-center justify-center bg-[#0B0B10]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-[#0B0B10] p-6 text-white">
        <button onClick={() => navigate(-1)} className="text-white/70">
          <ArrowLeft size={22} />
        </button>
        <p className="mt-10 text-center text-white/60">Práctica no encontrada.</p>
      </div>
    );
  }

  const blocks = (content.practice_blocks ?? []) as PracticeBlock[];

  return (
    <div className="min-h-screen bg-[#0B0B10] pb-28 text-white safe-area-top">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0B0B10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">
          <button onClick={() => navigate(-1)} className="text-white/80" aria-label="Volver">
            <ArrowLeft size={22} />
          </button>
          <h2 className="font-display text-sm font-semibold text-white/80">
            {categoryTitle || "Práctica"}
          </h2>
          {saving && <span className="ml-auto text-[10px] text-white/45">Guardando…</span>}
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
          <Sparkles size={12} /> Práctico
        </div>
        <h1 className="font-mindful text-3xl leading-tight text-white">{content.title}</h1>
        {content.practice_intro && (
          <p className="mt-3 text-sm leading-relaxed text-white/70">{content.practice_intro}</p>
        )}

        <div className="mt-6 space-y-5">
          {blocks.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/55">
              Esta práctica aún no tiene bloques configurados.
            </p>
          )}
          {blocks.map((b) => {
            switch (b.type) {
              case "instructions":
                return <InstructionsBlock key={b.id} html={b.html} />;
              case "example":
                return <ExampleBlock key={b.id} html={b.html} />;
              case "pros_cons":
                return (
                  <ProsConsBlock
                    key={b.id}
                    labels={b.labels}
                    value={answers[b.id]}
                    onChange={(v) => updateBlock(b.id, v)}
                  />
                );
              case "columns":
                return (
                  <ColumnsBlock
                    key={b.id}
                    columns={b.columns}
                    value={answers[b.id] ?? []}
                    onChange={(v) => updateBlock(b.id, v)}
                  />
                );
              case "suds":
                return (
                  <SudsBlock
                    key={b.id}
                    label={b.label}
                    minLabel={b.minLabel}
                    maxLabel={b.maxLabel}
                    value={answers[b.id] ?? 0}
                    onChange={(v) => updateBlock(b.id, v)}
                  />
                );
              case "free_text":
                return (
                  <FreeTextBlock
                    key={b.id}
                    prompt={b.prompt}
                    placeholder={b.placeholder}
                    minChars={b.minChars}
                    value={answers[b.id] ?? ""}
                    onChange={(v) => updateBlock(b.id, v)}
                  />
                );
              case "checklist":
                return (
                  <ChecklistBlock
                    key={b.id}
                    items={b.items}
                    value={answers[b.id] ?? []}
                    onChange={(v) => updateBlock(b.id, v)}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-[#0B0B10]/95 p-4 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <button
            onClick={finish}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-display text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            <CheckCircle2 size={16} /> Guardar y finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
