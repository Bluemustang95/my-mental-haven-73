import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Content = Tables<"psychoeducation_content">;

const emptyForm = {
  title: "",
  description: "",
  content_type: "video",
  content_url: "",
  category: "",
  tags: [] as string[],
  duration: "",
  is_premium: false,
  is_published: true,
  sort_order: 0,
  thumbnail_url: "",
};

export default function ContentManager() {
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tagsInput, setTagsInput] = useState("");

  const fetchContent = async () => {
    const { data } = await supabase
      .from("psychoeducation_content")
      .select("*")
      .order("sort_order", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTagsInput("");
    setDialogOpen(true);
  };

  const openEdit = (item: Content) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      content_type: item.content_type,
      content_url: item.content_url,
      category: item.category,
      tags: item.tags ?? [],
      duration: item.duration ?? "",
      is_premium: item.is_premium ?? false,
      is_published: item.is_published ?? true,
      sort_order: item.sort_order ?? 0,
      thumbnail_url: item.thumbnail_url ?? "",
    });
    setTagsInput((item.tags ?? []).join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = { ...form, tags };

    if (editingId) {
      const { error } = await supabase.from("psychoeducation_content").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Contenido actualizado");
    } else {
      const { error } = await supabase.from("psychoeducation_content").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Contenido creado");
    }
    setDialogOpen(false);
    fetchContent();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este contenido?")) return;
    const { error } = await supabase.from("psychoeducation_content").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminado");
    fetchContent();
  };

  const typeBadge = (t: string) => {
    const colors: Record<string, string> = { video: "default", audio: "secondary", pdf: "outline" };
    return <Badge variant={(colors[t] as any) ?? "default"}>{t}</Badge>;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Contenido Psicoeducativo</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay contenido aún</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{typeBadge(item.content_type)}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <Badge variant={item.is_published ? "default" : "outline"}>
                    {item.is_published ? "Publicado" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell>{item.is_premium ? "Sí" : "No"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar contenido" : "Nuevo contenido"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="pdf">PDF / Lectura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>URL del contenido</Label>
              <Input value={form.content_url} onChange={(e) => setForm({ ...form, content_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>URL de thumbnail (opcional)</Label>
              <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duración</Label>
                <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="5 min" />
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Tags (separados por coma)</Label>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Ansiedad, Regulación emocional" />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label>Publicado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_premium} onCheckedChange={(v) => setForm({ ...form, is_premium: v })} />
                <Label>Premium</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.content_url || !form.category}>
              {editingId ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
