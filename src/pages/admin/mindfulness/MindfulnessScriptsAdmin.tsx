import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Save, Loader2, Play } from "lucide-react";
import { MINDFULNESS_TREE, type ScriptLeaf, type ScriptNode } from "@/lib/mindfulnessTree";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { speak as ttsSpeak, stopSpeak } from "@/lib/elevenLabsTTS";

function NodeButton({ node, depth, expanded, onToggle, onPickLeaf, selectedLeafId }: {
  node: ScriptNode; depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onPickLeaf: (leaf: ScriptLeaf) => void;
  selectedLeafId: string | null;
}) {
  const isOpen = expanded.has(node.id);
  const isLeaf = !!node.leaf && !node.children;

  return (
    <div>
      <button
        onClick={() => {
          if (isLeaf && node.leaf) onPickLeaf(node.leaf);
          else onToggle(node.id);
        }}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
          isLeaf && selectedLeafId === node.leaf?.id
            ? "bg-[#6B4EFF]/10 text-[#4338CA]"
            : "hover:bg-slate-100 text-slate-700"
        }`}
        style={{ paddingLeft: 12 + depth * 14 }}
      >
        {!isLeaf && (
          <ChevronRight
            size={14}
            className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
        )}
        {isLeaf && <FileText size={13} className="shrink-0 text-slate-400" />}
        <span className={`truncate ${depth === 0 ? "font-semibold" : ""}`}>{node.label}</span>
      </button>
      {isOpen && node.children && (
        <div>
          {node.children.map((c) => (
            <NodeButton
              key={c.id}
              node={c}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onPickLeaf={onPickLeaf}
              selectedLeafId={selectedLeafId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MindfulnessScriptsAdmin() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(MINDFULNESS_TREE.map((n) => n.id)));
  const [selected, setSelected] = useState<ScriptLeaf | null>(null);
  const [script, setScript] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const toggle = (id: string) =>
    setExpanded((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  useEffect(() => {
    if (!selected) {
      setScript("");
      return;
    }
    setLoading(true);
    (async () => {
      let q = supabase
        .from("mindfulness_scripts")
        .select("script")
        .eq("category", selected.category);
      q = selected.subKey ? q.eq("sub_key", selected.subKey) : q.is("sub_key", null);
      q = selected.durationMin !== null ? q.eq("duration_min", selected.durationMin) : q.is("duration_min", null);
      const { data } = await q.maybeSingle();
      setScript(data?.script ?? "");
      setLoading(false);
    })();
  }, [selected]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const row = {
      category: selected.category,
      sub_key: selected.subKey,
      duration_min: selected.durationMin,
      script,
    };
    const { error } = await supabase
      .from("mindfulness_scripts")
      .upsert(row, { onConflict: "category,sub_key,duration_min" });
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar: " + error.message);
    } else {
      toast.success("Script guardado");
    }
  };

  const togglePreview = async () => {
    if (previewing) {
      stopSpeak();
      setPreviewing(false);
      return;
    }
    if (!script.trim()) {
      toast.error("Escribí un script primero");
      return;
    }
    setPreviewing(true);
    await ttsSpeak(script.slice(0, 1000));
    setPreviewing(false);
  };

  const headerLabel = useMemo(() => selected?.label ?? "Elegí un script", [selected]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-semibold text-slate-800">Mindfulness · Scripts</h1>
        <p className="text-sm text-slate-500">
          Organizado por <strong>categoría → sub-categoría → duración o zona</strong>. Lo que escribís acá
          se lee con la voz global en la app.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-white/60 bg-white/70 p-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.2)] backdrop-blur-xl">
          <div className="max-h-[70vh] overflow-y-auto py-1">
            {MINDFULNESS_TREE.map((n) => (
              <NodeButton
                key={n.id}
                node={n}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                onPickLeaf={setSelected}
                selectedLeafId={selected?.id ?? null}
              />
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.2)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-800">{headerLabel}</h2>
              {selected && (
                <p className="text-xs text-slate-500">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                    {selected.category}
                    {selected.subKey ? ` · ${selected.subKey}` : ""}
                    {selected.durationMin !== null ? ` · ${selected.durationMin}min` : ""}
                  </code>
                </p>
              )}
            </div>
            {selected && (
              <div className="flex gap-2">
                <button
                  onClick={togglePreview}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Play size={12} /> {previewing ? "Detener" : "Probar voz"}
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-[#6B4EFF] px-3 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Guardar
                </button>
              </div>
            )}
          </div>

          {!selected && (
            <div className="grid place-items-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-16 text-center text-sm text-slate-400">
              Seleccioná un ejercicio de la izquierda para editar su script.
            </div>
          )}

          {selected && (
            <Textarea
              value={loading ? "Cargando…" : script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Escribí el guion que va a leer la voz guía. Usá pausas naturales (…) y frases cortas."
              disabled={loading}
              className="min-h-[55vh] resize-y rounded-2xl bg-white text-sm leading-relaxed"
            />
          )}
        </section>
      </div>
    </div>
  );
}
