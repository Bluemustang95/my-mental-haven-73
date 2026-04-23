import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

type ToolType = "breathing" | "grounding" | "mindfulness_timer" | "selfcare_list" | "content_link" | "custom";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoryId: string;
  tool: any | null;
  onSaved: () => void;
}

const defaultConfigs: Record<ToolType, any> = {
  breathing: { inhale: 4, hold: 0, exhale: 4, holdAfter: 0 },
  mindfulness_timer: { durations: [{ label: "5 min", seconds: 300 }] },
  grounding: { steps: [{ count: 5, sense: "ver", placeholder: "Cosas que ves" }] },
  selfcare_list: { suggestions: [""] },
  content_link: { url: "" },
  custom: {},
};

export default function ToolEditor({ open, onOpenChange, categoryId, tool, onSaved }: Props) {
  const [form, setForm] = useState<any>({
    slug: "", name: "", description: "", tool_type: "breathing" as ToolType,
    config: defaultConfigs.breathing, sort_order: 0, is_published: true,
  });

  useEffect(() => {
    if (tool) setForm({ ...tool });
    else setForm({ slug: "", name: "", description: "", tool_type: "breathing", config: defaultConfigs.breathing, sort_order: 0, is_published: true });
  }, [tool, open]);

  const handleTypeChange = (t: ToolType) => {
    setForm({ ...form, tool_type: t, config: defaultConfigs[t] });
  };

  const save = async () => {
    try {
      const payload = {
        category_id: categoryId,
        slug: form.slug,
        name: form.name,
        description: form.description,
        tool_type: form.tool_type,
        config: form.config,
        sort_order: form.sort_order,
        is_published: form.is_published,
      };
      if (tool?.id) {
        const { error } = await supabase.from("resource_tools").update(payload).eq("id", tool.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("resource_tools").insert(payload);
        if (error) throw error;
      }
      toast.success("Herramienta guardada");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tool ? "Editar herramienta" : "Nueva herramienta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tool_type} onValueChange={(v) => handleTypeChange(v as ToolType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breathing">Respiración</SelectItem>
                  <SelectItem value="mindfulness_timer">Mindfulness Timer</SelectItem>
                  <SelectItem value="grounding">Grounding</SelectItem>
                  <SelectItem value="selfcare_list">Lista Autocuidado</SelectItem>
                  <SelectItem value="content_link">Enlace</SelectItem>
                  <SelectItem value="custom">Personalizado (JSON)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Orden</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-3">
            <p className="mb-3 text-sm font-medium">Configuración</p>
            <ConfigEditor type={form.tool_type} config={form.config} onChange={(c) => setForm({ ...form, config: c })} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
            <Label>Publicado</Label>
          </div>

          <Button className="w-full" onClick={save} disabled={!form.slug || !form.name}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfigEditor({ type, config, onChange }: { type: ToolType; config: any; onChange: (c: any) => void }) {
  if (type === "breathing") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {(["inhale", "hold", "exhale", "holdAfter"] as const).map((k) => (
          <div key={k}>
            <Label className="text-xs capitalize">{k} (seg)</Label>
            <Input type="number" value={config[k] ?? 0} onChange={(e) => onChange({ ...config, [k]: Number(e.target.value) })} />
          </div>
        ))}
      </div>
    );
  }
  if (type === "mindfulness_timer") {
    const durations = config.durations || [];
    return (
      <div className="space-y-2">
        {durations.map((d: any, i: number) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Etiqueta" value={d.label} onChange={(e) => { const next = [...durations]; next[i] = { ...d, label: e.target.value }; onChange({ durations: next }); }} />
            <Input type="number" placeholder="Segundos" value={d.seconds} onChange={(e) => { const next = [...durations]; next[i] = { ...d, seconds: Number(e.target.value) }; onChange({ durations: next }); }} />
            <Button size="icon" variant="ghost" onClick={() => onChange({ durations: durations.filter((_: any, j: number) => j !== i) })}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onChange({ durations: [...durations, { label: "", seconds: 60 }] })}><Plus className="mr-1 h-3 w-3" /> Agregar</Button>
      </div>
    );
  }
  if (type === "grounding") {
    const steps = config.steps || [];
    return (
      <div className="space-y-2">
        {steps.map((s: any, i: number) => (
          <div key={i} className="grid grid-cols-[60px_1fr_1fr_auto] gap-2">
            <Input type="number" value={s.count} onChange={(e) => { const next = [...steps]; next[i] = { ...s, count: Number(e.target.value) }; onChange({ steps: next }); }} />
            <Input placeholder="Sentido" value={s.sense} onChange={(e) => { const next = [...steps]; next[i] = { ...s, sense: e.target.value }; onChange({ steps: next }); }} />
            <Input placeholder="Placeholder" value={s.placeholder} onChange={(e) => { const next = [...steps]; next[i] = { ...s, placeholder: e.target.value }; onChange({ steps: next }); }} />
            <Button size="icon" variant="ghost" onClick={() => onChange({ steps: steps.filter((_: any, j: number) => j !== i) })}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onChange({ steps: [...steps, { count: 1, sense: "", placeholder: "" }] })}><Plus className="mr-1 h-3 w-3" /> Paso</Button>
      </div>
    );
  }
  if (type === "selfcare_list") {
    return (
      <Textarea
        rows={6}
        placeholder="Una sugerencia por línea"
        value={(config.suggestions || []).join("\n")}
        onChange={(e) => onChange({ suggestions: e.target.value.split("\n").filter(Boolean) })}
      />
    );
  }
  if (type === "content_link") {
    return (
      <div>
        <Label className="text-xs">URL</Label>
        <Input value={config.url || ""} onChange={(e) => onChange({ ...config, url: e.target.value })} placeholder="/herramientas/contenido" />
      </div>
    );
  }
  return (
    <Textarea
      rows={6}
      value={JSON.stringify(config, null, 2)}
      onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch {} }}
    />
  );
}
