import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ResourceCategory = { id: string; name: string; slug: string };
type SubResource = {
  id: string;
  resource_category_id: string | null;
  parent_id: string | null;
  slug: string;
  name: string;
  route: string | null;
  sort: number;
  active: boolean;
};
type Question = {
  id: string;
  code: string;
  prompt: string;
  kind: string;
  sort: number;
  active: boolean;
};
type Option = {
  id: string;
  question_id: string;
  label: string;
  score: number;
  sort: number;
};
type OptionLink = { id: string; option_id: string; sub_resource_id: string; weight: number };
type PsychoContent = { id: string; title: string; category: string };
type PsychoLink = { id: string; sub_resource_id: string; psycho_id: string; weight: number };

export default function QuestionnaireManager() {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [subResources, setSubResources] = useState<SubResource[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [links, setLinks] = useState<OptionLink[]>([]);
  const [psychoContent, setPsychoContent] = useState<PsychoContent[]>([]);
  const [psychoLinks, setPsychoLinks] = useState<PsychoLink[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [c, s, q, o, l, p, pl] = await Promise.all([
      supabase.from("resource_categories").select("id, name, slug").order("name"),
      supabase.from("algo_sub_resources").select("*").order("sort"),
      supabase.from("algo_questions").select("*").order("sort"),
      supabase.from("algo_options").select("*").order("sort"),
      supabase.from("algo_option_links").select("*"),
      supabase.from("psychoeducation_content").select("id, title, category").eq("is_published", true).order("title"),
      supabase.from("algo_psycho_links").select("*"),
    ]);
    setCategories((c.data ?? []) as ResourceCategory[]);
    setSubResources((s.data ?? []) as SubResource[]);
    setQuestions((q.data ?? []) as Question[]);
    setOptions((o.data ?? []) as Option[]);
    setLinks((l.data ?? []) as OptionLink[]);
    setPsychoContent((p.data ?? []) as PsychoContent[]);
    setPsychoLinks((pl.data ?? []) as PsychoLink[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ─────────── Sub-resources ───────────
  const [newSub, setNewSub] = useState({ name: "", slug: "", category: "", route: "" });
  const addSubResource = async () => {
    if (!newSub.name || !newSub.slug) return toast.error("Nombre y slug requeridos");
    const { error } = await supabase.from("algo_sub_resources").insert({
      name: newSub.name,
      slug: newSub.slug,
      resource_category_id: newSub.category || null,
      route: newSub.route || null,
    });
    if (error) return toast.error(error.message);
    setNewSub({ name: "", slug: "", category: "", route: "" });
    toast.success("Sub-recurso creado");
    loadAll();
  };
  const deleteSubResource = async (id: string) => {
    await supabase.from("algo_sub_resources").delete().eq("id", id);
    loadAll();
  };

  // ─────────── Questions ───────────
  const [newQ, setNewQ] = useState({ code: "", prompt: "", kind: "symptom" });
  const addQuestion = async () => {
    if (!newQ.code || !newQ.prompt) return toast.error("Código y enunciado requeridos");
    const { error } = await supabase.from("algo_questions").insert(newQ);
    if (error) return toast.error(error.message);
    setNewQ({ code: "", prompt: "", kind: "symptom" });
    loadAll();
  };
  const deleteQuestion = async (id: string) => {
    await supabase.from("algo_questions").delete().eq("id", id);
    loadAll();
  };

  // ─────────── Options ───────────
  const addOption = async (questionId: string, label: string, score: number) => {
    if (!label) return;
    await supabase.from("algo_options").insert({ question_id: questionId, label, score });
    loadAll();
  };
  const deleteOption = async (id: string) => {
    await supabase.from("algo_options").delete().eq("id", id);
    loadAll();
  };

  // ─────────── Option ↔ Sub-resource links ───────────
  const toggleLink = async (optionId: string, subId: string) => {
    const existing = links.find((l) => l.option_id === optionId && l.sub_resource_id === subId);
    if (existing) {
      await supabase.from("algo_option_links").delete().eq("id", existing.id);
    } else {
      await supabase.from("algo_option_links").insert({
        option_id: optionId,
        sub_resource_id: subId,
        weight: 1,
      });
    }
    loadAll();
  };

  // ─────────── Psicoeducación ↔ Sub-resource links ───────────
  const togglePsychoLink = async (subId: string, psychoId: string) => {
    const existing = psychoLinks.find((l) => l.sub_resource_id === subId && l.psycho_id === psychoId);
    if (existing) {
      await supabase.from("algo_psycho_links").delete().eq("id", existing.id);
    } else {
      await supabase.from("algo_psycho_links").insert({
        sub_resource_id: subId,
        psycho_id: psychoId,
        weight: 1,
      });
    }
    loadAll();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Motor del cuestionario</h1>

      <Tabs defaultValue="subresources">
        <TabsList>
          <TabsTrigger value="subresources">Sub-recursos</TabsTrigger>
          <TabsTrigger value="questions">Preguntas</TabsTrigger>
          <TabsTrigger value="links">Vínculos</TabsTrigger>
          <TabsTrigger value="psico">Psicoeducación</TabsTrigger>
        </TabsList>

        {/* ─────── SUB-RESOURCES ─────── */}
        <TabsContent value="subresources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuevo sub-recurso</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Nombre (ej. Escaneo corporal)"
                value={newSub.name}
                onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
              />
              <Input
                placeholder="slug (ej. escaneo-corporal)"
                value={newSub.slug}
                onChange={(e) => setNewSub({ ...newSub, slug: e.target.value })}
              />
              <Select
                value={newSub.category}
                onValueChange={(v) => setNewSub({ ...newSub, category: v })}
              >
                <SelectTrigger><SelectValue placeholder="Recurso padre" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Ruta opcional (ej. /herramientas/mindfulness)"
                value={newSub.route}
                onChange={(e) => setNewSub({ ...newSub, route: e.target.value })}
              />
              <Button className="sm:col-span-2" onClick={addSubResource}>
                <Plus className="mr-1 h-4 w-4" /> Agregar sub-recurso
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {subResources.map((sr) => {
              const cat = categories.find((c) => c.id === sr.resource_category_id);
              return (
                <div
                  key={sr.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div>
                    <p className="font-medium">{sr.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat?.name ?? "—"} · {sr.slug}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteSubResource(sr.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {subResources.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no creaste sub-recursos.</p>
            )}
          </div>
        </TabsContent>

        {/* ─────── QUESTIONS + OPTIONS ─────── */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nueva pregunta</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="Código (ej. irritabilidad)"
                value={newQ.code}
                onChange={(e) => setNewQ({ ...newQ, code: e.target.value })}
              />
              <Input
                className="sm:col-span-2"
                placeholder="Enunciado (¿Cómo estuvo tu irritabilidad esta semana?)"
                value={newQ.prompt}
                onChange={(e) => setNewQ({ ...newQ, prompt: e.target.value })}
              />
              <Select value={newQ.kind} onValueChange={(v) => setNewQ({ ...newQ, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="symptom">Síntoma</SelectItem>
                  <SelectItem value="personality">Personalidad</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
              <Button className="sm:col-span-2" onClick={addQuestion}>
                <Plus className="mr-1 h-4 w-4" /> Crear pregunta
              </Button>
            </CardContent>
          </Card>

          {questions.map((q) => (
            <Card key={q.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{q.prompt}</CardTitle>
                  <p className="text-xs text-muted-foreground">{q.code} · {q.kind}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteQuestion(q.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <OptionsEditor
                  question={q}
                  options={options.filter((o) => o.question_id === q.id)}
                  onAdd={(label, score) => addOption(q.id, label, score)}
                  onDelete={deleteOption}
                />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ─────── LINKS ─────── */}
        <TabsContent value="links" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Marcá qué sub-recursos se recomiendan cuando el usuario elige cada respuesta.
          </p>
          {questions.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">{q.prompt}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {options.filter((o) => o.question_id === q.id).map((o) => (
                  <div key={o.id} className="rounded-lg border p-3">
                    <p className="mb-2 font-medium">
                      <Link2 className="mr-1 inline h-3 w-3" />
                      {o.label} <span className="text-xs text-muted-foreground">(score {o.score})</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subResources.map((sr) => {
                        const linked = links.some(
                          (l) => l.option_id === o.id && l.sub_resource_id === sr.id
                        );
                        return (
                          <button
                            key={sr.id}
                            onClick={() => toggleLink(o.id, sr.id)}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              linked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {sr.name}
                          </button>
                        );
                      })}
                      {subResources.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Creá sub-recursos en la primera pestaña.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {options.filter((o) => o.question_id === q.id).length === 0 && (
                  <p className="text-xs text-muted-foreground">Esta pregunta no tiene opciones aún.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OptionsEditor({
  question,
  options,
  onAdd,
  onDelete,
}: {
  question: Question;
  options: Option[];
  onAdd: (label: string, score: number) => void;
  onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [score, setScore] = useState(1);
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <div key={o.id} className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2">
          <span className="text-sm">
            {o.label} <span className="text-xs text-muted-foreground">· score {o.score}</span>
          </span>
          <Button size="sm" variant="ghost" onClick={() => onDelete(o.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="Etiqueta (ej. Mucha)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          type="number"
          min={0}
          max={5}
          className="w-20"
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
        />
        <Button
          size="sm"
          onClick={() => {
            onAdd(label, score);
            setLabel("");
            setScore(1);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
