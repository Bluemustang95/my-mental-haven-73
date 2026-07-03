import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import {
  BLOCK_LABELS,
  newBlock,
  type PracticeBlock,
  type PracticeBlockType,
} from "@/lib/practiceTypes";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export function PracticeBuilder({
  value,
  onChange,
}: {
  value: PracticeBlock[];
  onChange: (v: PracticeBlock[]) => void;
}) {
  const [type, setType] = useState<PracticeBlockType>("instructions");

  const add = () => onChange([...(value ?? []), newBlock(type)]);
  const update = (idx: number, b: PracticeBlock) => {
    const next = [...value];
    next[idx] = b;
    onChange(next);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 rounded-lg border bg-slate-50 p-3">
        <div className="flex-1">
          <Label className="text-xs">Agregar bloque</Label>
          <Select value={type} onValueChange={(v) => setType(v as PracticeBlockType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(BLOCK_LABELS) as PracticeBlockType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {BLOCK_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={add} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Agregar
        </Button>
      </div>

      {(!value || value.length === 0) && (
        <p className="rounded-lg border border-dashed bg-white p-6 text-center text-xs text-slate-500">
          Sin bloques. Agregá el primero arriba.
        </p>
      )}

      {value?.map((b, idx) => (
        <div key={b.id} className="rounded-lg border bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              {BLOCK_LABELS[b.type]}
            </span>
            <div className="flex gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={() => move(idx, -1)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => move(idx, 1)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => remove(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <BlockEditor block={b} onChange={(nb) => update(idx, nb)} />
        </div>
      ))}
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
}: {
  block: PracticeBlock;
  onChange: (b: PracticeBlock) => void;
}) {
  switch (block.type) {
    case "instructions":
    case "example":
      return (
        <RichTextEditor
          value={block.html}
          onChange={(html) => onChange({ ...block, html })}
        />
      );
    case "pros_cons":
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Fila A</Label>
            <Input
              value={block.labels?.rowA ?? ""}
              onChange={(e) =>
                onChange({ ...block, labels: { ...block.labels, rowA: e.target.value } })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Fila B</Label>
            <Input
              value={block.labels?.rowB ?? ""}
              onChange={(e) =>
                onChange({ ...block, labels: { ...block.labels, rowB: e.target.value } })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Columna Pros</Label>
            <Input
              value={block.labels?.colPros ?? ""}
              onChange={(e) =>
                onChange({ ...block, labels: { ...block.labels, colPros: e.target.value } })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Columna Contras</Label>
            <Input
              value={block.labels?.colCons ?? ""}
              onChange={(e) =>
                onChange({ ...block, labels: { ...block.labels, colCons: e.target.value } })
              }
            />
          </div>
        </div>
      );
    case "columns":
      return (
        <div className="space-y-2">
          {block.columns.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={c.title}
                onChange={(e) => {
                  const cols = [...block.columns];
                  cols[i] = { title: e.target.value };
                  onChange({ ...block, columns: cols });
                }}
                placeholder={`Título columna ${i + 1}`}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() =>
                  onChange({ ...block, columns: block.columns.filter((_, j) => j !== i) })
                }
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                columns: [...block.columns, { title: `Columna ${block.columns.length + 1}` }],
              })
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Columna
          </Button>
        </div>
      );
    case "suds":
      return (
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-3">
            <Label className="text-xs">Pregunta / etiqueta</Label>
            <Input value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Mín</Label>
            <Input
              value={block.minLabel ?? ""}
              onChange={(e) => onChange({ ...block, minLabel: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Máx</Label>
            <Input
              value={block.maxLabel ?? ""}
              onChange={(e) => onChange({ ...block, maxLabel: e.target.value })}
            />
          </div>
        </div>
      );
    case "free_text":
      return (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Prompt</Label>
            <Input value={block.prompt} onChange={(e) => onChange({ ...block, prompt: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Placeholder</Label>
            <Input
              value={block.placeholder ?? ""}
              onChange={(e) => onChange({ ...block, placeholder: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Mínimo de caracteres (opcional)</Label>
            <Input
              type="number"
              value={block.minChars ?? 0}
              onChange={(e) => onChange({ ...block, minChars: Number(e.target.value) || undefined })}
            />
          </div>
        </div>
      );
    case "checklist":
      return (
        <div className="space-y-2">
          <Textarea
            rows={4}
            value={block.items.join("\n")}
            onChange={(e) =>
              onChange({ ...block, items: e.target.value.split("\n").filter((s) => s.length > 0) })
            }
            placeholder="Un ítem por línea"
          />
        </div>
      );
    case "more":
      return (
        <div className="space-y-1">
          <Label className="text-xs">Etiqueta del botón</Label>
          <Input
            value={block.label ?? ""}
            placeholder="Más"
            onChange={(e) => onChange({ ...block, label: e.target.value })}
          />
          <p className="text-[11px] text-slate-500">
            Todo lo que venga después de este bloque queda oculto hasta que el usuario apriete el botón.
          </p>
        </div>
      );
  }
}
