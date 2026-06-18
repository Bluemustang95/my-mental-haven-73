import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Save, Loader2, Play, Plus, Trash2, Clock, MapPin } from "lucide-react";
import { MINDFULNESS_TREE, type ScriptLeaf, type ScriptNode } from "@/lib/mindfulnessTree";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { speak as ttsSpeak, stopSpeak } from "@/lib/elevenLabsTTS";

const ZONE_OPTIONS = [
  { value: "cabeza", label: "Cabeza" },
  { value: "mandibula", label: "Mandíbula" },
  { value: "cuello_hombros", label: "Cuello y hombros" },
  { value: "pecho", label: "Pecho" },
  { value: "abdomen", label: "Abdomen" },
  { value: "brazos", label: "Brazos" },
  { value: "manos", label: "Manos" },
  { value: "piernas", label: "Piernas" },
  { value: "pies", label: "Pies" },
];

type Marker = { id: string; second: number; zone: string };

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function NodeButton({
  node,
  depth,
  expanded,
  onToggle,
  onPickLeaf,
  selectedLeafId,
}: {
  node: ScriptNode;
  depth: number;
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

export function MindfulnessCategoryEditor({ category }: { category: string }) {
  const rootNode = useMemo(
    () => MINDFULNESS_TREE.find((n) => n.id === category || n.id === category.replace("_", "")) ??
      MINDFULNESS_TREE.find((n) => n.id === (category === "body_scan" ? "body_scan" : category)) ??
      MINDFULNESS_TREE[0],
    [category]
  );
  const tree = rootNode?.children ?? [];

  const [expanded, setExpanded] = useState<Set<string>>(new Set(tree.map((n) => n.id)));
  const [selected, setSelected] = useState<ScriptLeaf | null>(null);
  const [script, setScript] = useState<string>("");
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [markerDraft, setMarkerDraft] = useState({ minute: 0, second: 0, zone: ZONE_OPTIONS[0].value });

  const toggle = (id: string) =>
    setExpanded((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Determine if this is a Body Scan duration leaf (timeline-with-markers)
  const isBodyScanDuration =
    !!selected &&
    selected.category === "body_scan" &&
    selected.subKey === null &&
    selected.durationMin !== null;

  useEffect(() => {
    if (!selected) {
      setScript("");
      setMarkers([]);
      return;
    }
    setLoading(true);
    (async () => {
      let q = supabase
        .from("mindfulness_scripts")
        .select("script, markers")
        .eq("category", selected.category);
      q = selected.subKey ? q.eq("sub_key", selected.subKey) : q.is("sub_key", null);
      q =
        selected.durationMin !== null
          ? q.eq("duration_min", selected.durationMin)
          : q.is("duration_min", null);
      const { data } = await q.maybeSingle();
      setScript(data?.script ?? "");
      const m = Array.isArray((data as any)?.markers) ? ((data as any).markers as Marker[]) : [];
      setMarkers(m);
      setLoading(false);
    })();
  }, [selected]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const row: Record<string, unknown> = {
      category: selected.category,
      sub_key: selected.subKey,
      duration_min: selected.durationMin,
      script,
    };
    if (isBodyScanDuration) row.markers = markers;
    const { error } = await supabase
      .from("mindfulness_scripts")
      .upsert(row as any, { onConflict: "category,sub_key,duration_min" });
    setSaving(false);
    if (error) toast.error("No se pudo guardar: " + error.message);
    else toast.success("Guardado");
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

  const addMarker = () => {
    if (!selected?.durationMin) return;
    const max = selected.durationMin * 60;
    const sec = markerDraft.minute * 60 + markerDraft.second;
    if (sec < 0 || sec > max) {
      toast.error(`El segundo debe estar entre 0 y ${max}`);
      return;
    }
    const next = [
      ...markers,
      { id: crypto.randomUUID(), second: sec, zone: markerDraft.zone },
    ].sort((a, b) => a.second - b.second);
    setMarkers(next);
    setMarkerDraft({ minute: 0, second: 0, zone: ZONE_OPTIONS[0].value });
  };

  const removeMarker = (id: string) => setMarkers((p) => p.filter((m) => m.id !== id));

  const headerLabel = selected?.label ?? "Elegí un script";

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-3xl border border-white/60 bg-white/70 p-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.2)] backdrop-blur-xl">
        <div className="max-h-[70vh] overflow-y-auto py-1">
          {tree.map((n) => (
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

      <section className="space-y-4 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.2)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
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
            className="min-h-[45vh] resize-y rounded-2xl bg-white text-sm leading-relaxed"
          />
        )}

        {isBodyScanDuration && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-800">
                  <MapPin size={14} className="mr-1 inline" /> Marcadores del timeline
                </h3>
                <p className="text-[11px] text-slate-500">
                  Iluminá cada zona del cuerpo en el segundo indicado durante los {selected!.durationMin} min.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-3">
              <div>
                <Label className="text-[10px] uppercase text-slate-500">Min</Label>
                <Input
                  type="number"
                  min={0}
                  max={selected!.durationMin!}
                  value={markerDraft.minute}
                  onChange={(e) =>
                    setMarkerDraft((p) => ({ ...p, minute: Math.max(0, parseInt(e.target.value || "0", 10)) }))
                  }
                  className="h-9 w-20"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase text-slate-500">Seg</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={markerDraft.second}
                  onChange={(e) =>
                    setMarkerDraft((p) => ({
                      ...p,
                      second: Math.min(59, Math.max(0, parseInt(e.target.value || "0", 10))),
                    }))
                  }
                  className="h-9 w-20"
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <Label className="text-[10px] uppercase text-slate-500">Zona</Label>
                <select
                  value={markerDraft.zone}
                  onChange={(e) => setMarkerDraft((p) => ({ ...p, zone: e.target.value }))}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                >
                  {ZONE_OPTIONS.map((z) => (
                    <option key={z.value} value={z.value}>
                      {z.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addMarker}
                className="flex h-9 items-center gap-1 rounded-md bg-[#6B4EFF] px-3 text-xs font-semibold text-white hover:brightness-110"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>

            {markers.length === 0 ? (
              <p className="mt-3 text-center text-xs text-slate-400">Sin marcadores todavía.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {markers.map((m) => {
                  const zoneLabel = ZONE_OPTIONS.find((z) => z.value === m.zone)?.label ?? m.zone;
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-slate-700">
                        <Clock size={12} className="text-slate-400" />
                        <span className="font-mono text-xs">{fmt(m.second)}</span>
                        <span className="text-slate-300">·</span>
                        <span>{zoneLabel}</span>
                      </span>
                      <button
                        onClick={() => removeMarker(m.id)}
                        className="text-slate-300 hover:text-rose-500"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-[10px] text-slate-400">
              Recordá pulsar <strong>Guardar</strong> para persistir los marcadores junto al script.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
