import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Pencil, Trash2, Info, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { invalidateHiddenToolsCache } from "@/lib/hiddenTools";
import ToolEditor from "./ToolEditor";

const colorMap: Record<string, string> = {
  accent: "bg-accent/15 border-accent/30",
  primary: "bg-primary/10 border-primary/20",
  secondary: "bg-secondary/60 border-secondary",
  success: "bg-emerald-50 border-emerald-200",
  muted: "bg-muted/60 border-muted",
  rose: "bg-rose-50 border-rose-200",
  orange: "bg-orange-50 border-orange-200",
  purple: "bg-purple-50 border-purple-200",
};

export default function ResourceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);

  const { data: category } = useQuery({
    queryKey: ["admin-category", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("resource_categories").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => { if (category) setMeta(category); }, [category]);

  const { data: tools = [] } = useQuery({
    queryKey: ["admin-tools", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("resource_tools").select("*").eq("category_id", category!.id).order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!category?.id,
  });

  const updateMeta = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("resource_categories").update({
        name: meta.name, description: meta.description, icon: meta.icon, color: meta.color, is_published: meta.is_published, sort_order: meta.sort_order,
      }).eq("id", meta.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Guardado"); qc.invalidateQueries({ queryKey: ["admin-resource-categories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async (tool: any) => {
      const { error } = await supabase.from("resource_tools").update({ is_published: !tool.is_published }).eq("id", tool.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateHiddenToolsCache();
      qc.invalidateQueries({ queryKey: ["admin-tools", category?.id] });
    },
  });

  const deleteTool = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resource_tools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Eliminada"); qc.invalidateQueries({ queryKey: ["admin-tools", category?.id] }); },
  });

  if (!category || !meta) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const colorClass = colorMap[category.color] || colorMap.muted;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/admin/recursos")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a Recursos
      </button>

      <div className={`rounded-3xl border p-6 ${colorClass}`}>
        <h1 className="font-display text-2xl font-semibold">{category.name}</h1>
        <p className="mt-1 text-sm opacity-80">{category.description}</p>
      </div>

      <section className="rounded-3xl border bg-card p-5">
        <h2 className="font-display text-lg font-semibold mb-3">Editar categoría</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Nombre</Label>
            <Input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
          </div>
          <div>
            <Label>Icono</Label>
            <Input value={meta.icon} onChange={(e) => setMeta({ ...meta, icon: e.target.value })} />
          </div>
          <div>
            <Label>Color</Label>
            <Input value={meta.color} onChange={(e) => setMeta({ ...meta, color: e.target.value })} />
          </div>
          <div>
            <Label>Orden</Label>
            <Input type="number" value={meta.sort_order} onChange={(e) => setMeta({ ...meta, sort_order: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <Label>Descripción</Label>
            <Textarea value={meta.description || ""} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <Switch checked={meta.is_published} onCheckedChange={(v) => setMeta({ ...meta, is_published: v })} />
            <Label>Publicado</Label>
          </div>
        </div>
        <Button className="mt-4" onClick={() => updateMeta.mutate()}>Guardar cambios</Button>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Herramientas ({tools.length})</h2>
          <Button onClick={() => { setEditingTool(null); setEditorOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nueva herramienta
          </Button>
        </div>

        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Las actividades <span className="font-semibold text-foreground">ocultas</span> no aparecen en Recursos, Home ni Resumen Psico, y no cuentan en el Índice de Bienestar.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {tools.map((tool: any) => (
            <div key={tool.id} className={`rounded-3xl border p-4 ${colorClass} ${!tool.is_published ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-display font-semibold">{tool.name}</h3>
                  <p className="mt-0.5 text-xs opacity-70">{tool.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{tool.tool_type}</Badge>
                    {!tool.is_published && (
                      <Badge variant="secondary" className="gap-1">
                        <EyeOff className="h-3 w-3" /> Oculto
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button size="icon" variant="ghost" onClick={() => { setEditingTool(tool); setEditorOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("¿Eliminar?")) deleteTool.mutate(tool.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border bg-background/50 px-3 py-2">
                <Label htmlFor={`pub-${tool.id}`} className="cursor-pointer text-xs font-medium">
                  Visible en la app
                </Label>
                <Switch
                  id={`pub-${tool.id}`}
                  checked={!!tool.is_published}
                  onCheckedChange={() => togglePublish.mutate(tool)}
                />
              </div>
            </div>
          ))}
          {tools.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aún no hay herramientas. Creá la primera.
            </p>
          )}
        </div>
      </section>


      <ToolEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        categoryId={category.id}
        tool={editingTool}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin-tools", category.id] })}
      />
    </div>
  );
}
