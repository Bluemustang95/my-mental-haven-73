import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Sparkles, Wind, Flower2, Hand, Leaf, BookOpen, Heart, Brain, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Sparkles, Wind, Flower2, Hand, Leaf, BookOpen, Heart, Brain, Music,
};

const colorMap: Record<string, string> = {
  accent: "bg-accent/15 border-accent/30 text-accent-foreground",
  primary: "bg-primary/10 border-primary/20 text-primary",
  secondary: "bg-secondary/60 border-secondary text-secondary-foreground",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  muted: "bg-muted/60 border-muted text-foreground",
  rose: "bg-rose-50 border-rose-200 text-rose-900",
  orange: "bg-orange-50 border-orange-200 text-orange-900",
  purple: "bg-purple-50 border-purple-200 text-purple-900",
};

export default function ResourcesManager() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "", description: "", icon: "Sparkles", color: "muted", is_published: true });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-resource-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_categories")
        .select("*, resource_tools(id)")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("resource_categories").insert({
        ...form,
        sort_order: categories.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoría creada");
      qc.invalidateQueries({ queryKey: ["admin-resource-categories"] });
      setOpen(false);
      setForm({ slug: "", name: "", description: "", icon: "Sparkles", color: "muted", is_published: true });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Recursos</h1>
          <p className="text-sm text-muted-foreground">Gestioná las categorías y herramientas del front.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva categoría
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat: any) => {
            const Icon = iconMap[cat.icon] || Sparkles;
            const colorClass = colorMap[cat.color] || colorMap.muted;
            const toolCount = cat.resource_tools?.length || 0;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/admin/recursos/${cat.slug}`)}
                className={`rounded-3xl border p-5 text-left transition-all hover:shadow-md ${colorClass}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/60">
                    <Icon className="h-6 w-6" />
                  </div>
                  {!cat.is_published && <Badge variant="outline">Borrador</Badge>}
                </div>
                <h3 className="font-display text-lg font-semibold">{cat.name}</h3>
                {cat.description && <p className="mt-1 text-xs opacity-80 line-clamp-2">{cat.description}</p>}
                <p className="mt-3 text-xs font-medium">{toolCount} {toolCount === 1 ? "herramienta" : "herramientas"}</p>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="ej: meditacion" />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Icono (Lucide)</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Sparkles" />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="accent | primary | rose…" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Publicado</Label>
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
            </div>
            <Button className="w-full" onClick={() => createMut.mutate()} disabled={!form.slug || !form.name}>
              Crear categoría
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
