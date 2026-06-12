import { useEffect, useState } from "react";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BAContent, DEFAULT_BA_CONTENT } from "@/lib/baTypes";

export default function BAContentEditor() {
  const navigate = useNavigate();
  const [content, setContent] = useState<BAContent>(DEFAULT_BA_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("ba_content" as any).select("*").limit(1).maybeSingle();
      if (data) setContent({ ...DEFAULT_BA_CONTENT, ...(data as any) });
      setLoading(false);
    })();
  }, []);

  const patch = <K extends keyof BAContent>(k: K, v: BAContent[K]) => setContent((c) => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { id, ...payload } = content;
    const { error } = await supabase.from("ba_content" as any).update(payload).eq("id", id);
    setSaving(false);
    if (error) toast.error("Error al guardar");
    else toast.success("Contenido actualizado");
  };

  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/pack")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-slate-600 shadow-sm"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-slate-800">Activación Comportamental</h1>
            <p className="text-[11px] text-slate-500">CMS del programa</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save size={14} /> {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="intro">Onboarding</TabsTrigger>
          <TabsTrigger value="psico">Psicoeducación</TabsTrigger>
          <TabsTrigger value="values">Valores</TabsTrigger>
          <TabsTrigger value="ladder">Escalera</TabsTrigger>
          <TabsTrigger value="barriers">Barreras</TabsTrigger>
          <TabsTrigger value="daily">Mensajes diarios</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-3 pt-4">
          <Field label="Título"><Input value={content.program_meta.title} onChange={(e) => patch("program_meta", { ...content.program_meta, title: e.target.value })} /></Field>
          <Field label="Subtítulo"><Textarea value={content.program_meta.subtitle} onChange={(e) => patch("program_meta", { ...content.program_meta, subtitle: e.target.value })} /></Field>
          <div className="flex items-center gap-3">
            <Switch checked={content.active} onCheckedChange={(v) => patch("active", v)} />
            <Label className="text-sm">Programa activo</Label>
          </div>
        </TabsContent>

        <TabsContent value="intro" className="space-y-4 pt-4">
          {content.intro_slides.map((s, i) => (
            <div key={i} className="rounded-xl border bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Slide {i + 1}</p>
              <Field label="Título"><Input value={s.title} onChange={(e) => {
                const next = [...content.intro_slides]; next[i] = { ...s, title: e.target.value }; patch("intro_slides", next);
              }} /></Field>
              <Field label="Cuerpo"><Textarea rows={4} value={s.body} onChange={(e) => {
                const next = [...content.intro_slides]; next[i] = { ...s, body: e.target.value }; patch("intro_slides", next);
              }} /></Field>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="psico" className="space-y-4 pt-4">
          <Field label="Título del ciclo"><Input value={content.cycle_text.title} onChange={(e) => patch("cycle_text", { ...content.cycle_text, title: e.target.value })} /></Field>
          <Field label="Subtítulo del ciclo"><Textarea value={content.cycle_text.subtitle} onChange={(e) => patch("cycle_text", { ...content.cycle_text, subtitle: e.target.value })} /></Field>
          <div className="rounded-xl border bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Hacer de menos</p>
            <Field label="Título"><Input value={content.cycle_text.less.title} onChange={(e) => patch("cycle_text", { ...content.cycle_text, less: { ...content.cycle_text.less, title: e.target.value } })} /></Field>
            <Field label="Cuerpo"><Textarea rows={4} value={content.cycle_text.less.body} onChange={(e) => patch("cycle_text", { ...content.cycle_text, less: { ...content.cycle_text.less, body: e.target.value } })} /></Field>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Hacer de más</p>
            <Field label="Título"><Input value={content.cycle_text.more.title} onChange={(e) => patch("cycle_text", { ...content.cycle_text, more: { ...content.cycle_text.more, title: e.target.value } })} /></Field>
            <Field label="Cuerpo"><Textarea rows={4} value={content.cycle_text.more.body} onChange={(e) => patch("cycle_text", { ...content.cycle_text, more: { ...content.cycle_text.more, body: e.target.value } })} /></Field>
          </div>
        </TabsContent>

        <TabsContent value="values" className="space-y-3 pt-4">
          {content.values_catalog.map((v, i) => (
            <div key={i} className="rounded-xl border bg-white p-3">
              <div className="flex items-center gap-2">
                <Input className="w-16" value={v.emoji} onChange={(e) => { const next = [...content.values_catalog]; next[i] = { ...v, emoji: e.target.value }; patch("values_catalog", next); }} />
                <Input value={v.title} onChange={(e) => { const next = [...content.values_catalog]; next[i] = { ...v, title: e.target.value }; patch("values_catalog", next); }} />
                <Button size="icon" variant="ghost" onClick={() => patch("values_catalog", content.values_catalog.filter((_, j) => j !== i))}>
                  <Trash2 size={14} className="text-rose-500" />
                </Button>
              </div>
              <Input className="mt-2" placeholder="Subtítulo" value={v.subtitle} onChange={(e) => { const next = [...content.values_catalog]; next[i] = { ...v, subtitle: e.target.value }; patch("values_catalog", next); }} />
              <Input className="mt-2" placeholder="key (sin espacios)" value={v.key} onChange={(e) => { const next = [...content.values_catalog]; next[i] = { ...v, key: e.target.value }; patch("values_catalog", next); }} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => patch("values_catalog", [...content.values_catalog, { key: `nuevo_${Date.now()}`, emoji: "✨", title: "Nuevo valor", subtitle: "" }])}>
            <Plus size={14} className="mr-1" /> Agregar valor
          </Button>
        </TabsContent>

        <TabsContent value="ladder" className="space-y-3 pt-4">
          <p className="text-xs text-slate-500">Escalera sugerida — el usuario puede editarla en su programa.</p>
          {content.default_ladder.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border bg-white p-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7cc2c8] text-xs font-bold text-white">{i + 1}</span>
              <Input value={s.text} onChange={(e) => { const next = [...content.default_ladder]; next[i] = { ...s, text: e.target.value }; patch("default_ladder", next); }} />
              <Input type="number" className="w-20" value={s.suds} onChange={(e) => { const next = [...content.default_ladder]; next[i] = { ...s, suds: Number(e.target.value) || 0 }; patch("default_ladder", next); }} />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="barriers" className="space-y-3 pt-4">
          {content.barriers_catalog.map((b, i) => (
            <div key={i} className="rounded-xl border bg-white p-3">
              <div className="flex items-center gap-2">
                <Input value={b.label} onChange={(e) => { const next = [...content.barriers_catalog]; next[i] = { ...b, label: e.target.value }; patch("barriers_catalog", next); }} />
                <Button size="icon" variant="ghost" onClick={() => patch("barriers_catalog", content.barriers_catalog.filter((_, j) => j !== i))}>
                  <Trash2 size={14} className="text-rose-500" />
                </Button>
              </div>
              <Textarea className="mt-2" rows={2} placeholder="Respuesta clínica" value={b.response} onChange={(e) => { const next = [...content.barriers_catalog]; next[i] = { ...b, response: e.target.value }; patch("barriers_catalog", next); }} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => patch("barriers_catalog", [...content.barriers_catalog, { label: "Nueva barrera", response: "" }])}>
            <Plus size={14} className="mr-1" /> Agregar barrera
          </Button>
        </TabsContent>

        <TabsContent value="daily" className="space-y-3 pt-4">
          {[2, 3, 4, 5, 6, 7].map((day) => (
            <Field key={day} label={`Día ${day}`}>
              <Textarea
                rows={2}
                value={content.daily_messages?.[String(day)] ?? ""}
                onChange={(e) => patch("daily_messages", { ...content.daily_messages, [String(day)]: e.target.value })}
              />
            </Field>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2">
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
