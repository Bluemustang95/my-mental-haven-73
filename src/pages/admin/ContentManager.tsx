import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, BookText, Video as VideoIcon, Headphones } from "lucide-react";
import { toast } from "sonner";
import CategoriesManager from "./CategoriesManager";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { PracticeBuilder } from "@/components/admin/PracticeBuilder";
import type { PracticeBlock } from "@/lib/practiceTypes";

type ContentType = "video" | "text" | "podcast";

type Content = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string;
  media_url: string | null;
  body_html: string | null;
  category: string;
  category_id: string | null;
  tags: string[] | null;
  duration: string | null;
  duration_minutes: number | null;
  is_premium: boolean | null;
  is_published: boolean | null;
  sort_order: number | null;
  thumbnail_url: string | null;
  text_kind: string | null;
  practice_intro: string | null;
  practice_blocks: PracticeBlock[] | null;
};

type Cat = { id: string; title: string; content_type: ContentType };

const emptyForm = {
  title: "",
  description: "",
  content_type: "video" as ContentType,
  media_url: "",
  body_html: "",
  category_id: "",
  category: "general",
  tags: "",
  duration_minutes: 5,
  is_premium: false,
  is_published: true,
  sort_order: 0,
  thumbnail_url: "",
  text_kind: "theory" as "theory" | "practice",
  practice_intro: "",
  practice_blocks: [] as PracticeBlock[],
};

const TABS: { key: ContentType; label: string; icon: any }[] = [
  { key: "video", label: "Videos", icon: VideoIcon },
  { key: "text", label: "Textos", icon: BookText },
  { key: "podcast", label: "Podcasts", icon: Headphones },
];

function spotifyEmbed(url: string) {
  if (!url) return "";
  return url.replace("episode/", "embed/episode/").replace("show/", "embed/show/");
}

export default function ContentManager() {
  const [tab, setTab] = useState<"categories" | ContentType>("video");
  const [items, setItems] = useState<Content[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = async () => {
    const [c, k] = await Promise.all([
      supabase.from("psychoeducation_content").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("psychoeducation_categories" as any)
        .select("id,title,content_type")
        .order("sort_order", { ascending: true }),
    ]);
    setItems((c.data as any) ?? []);
    setCats((k.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Refetch categories when switching tabs so newly-created cats appear in the "Nuevo" modal
  useEffect(() => {
    supabase
      .from("psychoeducation_categories" as any)
      .select("id,title,content_type")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setCats((data as any) ?? []));
  }, [tab]);

  const filtered = useMemo(
    () => items.filter((i) => tab !== "categories" && i.content_type === tab),
    [items, tab]
  );

  const catsForType = (t: ContentType) => cats.filter((c) => (c.content_type ?? "video") === t);

  const openCreate = () => {
    setEditingId(null);
    const t = (tab === "categories" ? "video" : tab) as ContentType;
    setForm({
      ...emptyForm,
      content_type: t,
      category_id: catsForType(t)[0]?.id ?? "",
    });
    setOpen(true);
  };

  const openEdit = (item: Content) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      content_type: (["video", "text", "podcast"].includes(item.content_type) ? item.content_type : "video") as ContentType,
      media_url: item.media_url ?? item.content_url ?? "",
      body_html: item.body_html ?? "",
      category_id: item.category_id ?? "",
      category: item.category ?? "general",
      tags: (item.tags ?? []).join(", "),
      duration_minutes: item.duration_minutes ?? (item.duration ? parseInt(item.duration) || 5 : 5),
      is_premium: item.is_premium ?? false,
      is_published: item.is_published ?? true,
      sort_order: item.sort_order ?? 0,
      thumbnail_url: item.thumbnail_url ?? "",
      text_kind: ((item.text_kind as any) === "practice" ? "practice" : "theory"),
      practice_intro: item.practice_intro ?? "",
      practice_blocks: (item.practice_blocks ?? []) as PracticeBlock[],
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Falta el título");
    const isText = form.content_type === "text";
    const isPractice = isText && form.text_kind === "practice";
    if (!isText && !form.media_url.trim()) return toast.error("Falta la URL del contenido");

    const catTitle = cats.find((c) => c.id === form.category_id)?.title ?? form.category ?? "general";
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    const payload: any = {
      title: form.title,
      description: form.description || null,
      content_type: form.content_type,
      media_url: form.media_url || null,
      content_url: form.media_url || (isText ? "text://inline" : ""),
      body_html: isText && !isPractice ? form.body_html : null,
      category_id: form.category_id || null,
      category: catTitle,
      tags,
      duration: `${form.duration_minutes} min`,
      duration_minutes: form.duration_minutes,
      is_premium: form.is_premium,
      is_published: form.is_published,
      sort_order: form.sort_order,
      thumbnail_url: form.thumbnail_url || null,
      text_kind: isText ? form.text_kind : "theory",
      practice_intro: isPractice ? (form.practice_intro || null) : null,
      practice_blocks: isPractice ? form.practice_blocks : null,
    };

    if (editingId) {
      const { error } = await supabase.from("psychoeducation_content").update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
      toast.success("Contenido actualizado");
    } else {
      const { error } = await supabase.from("psychoeducation_content").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Contenido creado");
    }
    setOpen(false);
    fetchAll();
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar este contenido?")) return;
    const { error } = await supabase.from("psychoeducation_content").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    fetchAll();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Psicoeducación</h1>
        {tab !== "categories" && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
              <t.icon size={14} /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="categories">
          <CategoriesManager />
        </TabsContent>

        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <div className="rounded-lg border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="w-24">Duración</TableHead>
                    <TableHead className="w-28">Estado</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Aún no hay {t.label.toLowerCase()}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => {
                      const catTitle = cats.find((c) => c.id === item.category_id)?.title ?? item.category;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{catTitle ?? "—"}</TableCell>
                          <TableCell>{item.duration_minutes ? `${item.duration_minutes} min` : item.duration}</TableCell>
                          <TableCell>
                            <Badge variant={item.is_published ? "default" : "outline"}>
                              {item.is_published ? "Publicado" : "Borrador"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => del(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar contenido" : "Nuevo contenido"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.content_type}
                  onValueChange={(v) => {
                    const t = v as ContentType;
                    setForm({ ...form, content_type: t, category_id: catsForType(t)[0]?.id ?? "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="podcast">Podcast (Spotify)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                {catsForType(form.content_type).length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Aún no hay categorías de este tipo. Creá una en la pestaña <b>Categorías</b>.
                  </div>
                ) : (
                  <Select
                    value={form.category_id || undefined}
                    onValueChange={(v) => setForm({ ...form, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      {catsForType(form.content_type).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {form.content_type === "video" && (
              <div>
                <Label>URL del video (MP4 o YouTube)</Label>
                <Input
                  value={form.media_url}
                  onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}

            {form.content_type === "podcast" && (
              <div>
                <Label>Enlace de Spotify</Label>
                <Input
                  value={form.media_url}
                  onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                  placeholder="https://open.spotify.com/episode/..."
                />
                {form.media_url && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs text-slate-500">Preview</p>
                    <iframe
                      style={{ borderRadius: 12 }}
                      src={spotifyEmbed(form.media_url)}
                      width="100%"
                      height="180"
                      frameBorder={0}
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}

            {form.content_type === "text" && (
              <div>
                <Label>Contenido</Label>
                <RichTextEditor value={form.body_html} onChange={(v) => setForm({ ...form, body_html: v })} />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={form.thumbnail_url}
                  onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label>Tags (separados por coma)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>{editingId ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
