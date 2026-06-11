import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ContentType = "video" | "text" | "podcast";

type Cat = {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  accent_color: string | null;
  sort_order: number;
  is_published: boolean;
  content_type: ContentType;
};

const TYPE_LABEL: Record<ContentType, string> = {
  video: "Videos",
  text: "Textos",
  podcast: "Podcasts",
};

const empty = {
  title: "",
  description: "",
  emoji: "📘",
  accent_color: "#A78BFA",
  sort_order: 0,
  is_published: true,
  content_type: "video" as ContentType,
};

export default function CategoriesManager({ defaultType }: { defaultType?: ContentType } = {}) {
  const [filter, setFilter] = useState<ContentType>(defaultType ?? "video");
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty, content_type: defaultType ?? ("video" as ContentType) });

  const fetchAll = async () => {
    const { data } = await supabase
      .from("psychoeducation_categories" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, content_type: filter });
    setOpen(true);
  };
  const openEdit = (c: Cat) => {
    setEditing(c.id);
    setForm({
      title: c.title,
      description: c.description ?? "",
      emoji: c.emoji ?? "📘",
      accent_color: c.accent_color ?? "#A78BFA",
      sort_order: c.sort_order ?? 0,
      is_published: c.is_published,
      content_type: (c.content_type ?? "video") as ContentType,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Falta el título");
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from("psychoeducation_categories" as any)
        .update(form)
        .eq("id", editing);
      if (error) return toast.error(error.message);
      toast.success("Categoría actualizada");
    } else {
      const { error } = await supabase.from("psychoeducation_categories" as any).insert(form);
      if (error) return toast.error(error.message);
      toast.success("Categoría creada");
    }
    setOpen(false);
    fetchAll();
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los contenidos quedarán sin categoría.")) return;
    const { error } = await supabase.from("psychoeducation_categories" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    fetchAll();
  };

  const filtered = items.filter((c) => (c.content_type ?? "video") === filter);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-800">Categorías</h2>
          <p className="text-xs text-slate-500">Cada tipo de contenido tiene sus propias categorías.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nueva
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ContentType)} className="mb-4">
        <TabsList>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="text">Textos</TabsTrigger>
          <TabsTrigger value="podcast">Podcasts</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Icono</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-20">Color</TableHead>
              <TableHead className="w-20">Orden</TableHead>
              <TableHead className="w-24">Estado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Aún no hay categorías de {TYPE_LABEL[filter]}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-2xl">{c.emoji ?? "📘"}</TableCell>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="max-w-sm truncate text-sm text-slate-600">{c.description}</TableCell>
                  <TableCell>
                    <div
                      className="h-6 w-6 rounded-full ring-1 ring-slate-300"
                      style={{ backgroundColor: c.accent_color ?? "#A78BFA" }}
                    />
                  </TableCell>
                  <TableCell>{c.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_published ? "default" : "outline"}>
                      {c.is_published ? "Publicada" : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de contenido</Label>
              <Select
                value={form.content_type}
                onValueChange={(v) => setForm({ ...form, content_type: v as ContentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="text">Textos</SelectItem>
                  <SelectItem value="podcast">Podcasts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Conceptos básicos"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Todo lo necesario sobre la metodología"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emoji</Label>
                <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🏔️" />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label>Publicada</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
