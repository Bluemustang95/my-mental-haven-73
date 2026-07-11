import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AiFeatureConfig } from "@/pages/admin/AiFeaturesManager";

const CHAT_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-flash-lite",
  "google/gemini-3.5-flash",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-pro",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
];
const AUDIO_MODELS = ["eleven_v3", "eleven_multilingual_v2", "whisper-1"];

const NON_LLM_FEATURES = new Set(["mindfulness_tts", "transcribe_voice", "onboarding_algo"]);

export function AiFeatureEditor({
  feature,
  onClose,
  onSaved,
}: {
  feature: AiFeatureConfig;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AiFeatureConfig>(feature);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState<any[]>([]);

  useEffect(() => setForm(feature), [feature]);

  useEffect(() => {
    supabase
      .from("ai_usage_log" as any)
      .select("*")
      .eq("feature", feature.feature_key)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setUsage(((data ?? []) as unknown) as any[]));
  }, [feature.feature_key]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("ai_feature_configs" as any)
      .update({
        display_name: form.display_name,
        description: form.description,
        model: form.model,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
        system_prompt: form.system_prompt,
        active: form.active,
        est_cost_per_call: form.est_cost_per_call,
      })
      .eq("id", feature.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuración guardada. Se aplica al próximo request.");
    onSaved();
  };

  const modelOptions = form.category === "audio" ? AUDIO_MODELS : CHAT_MODELS;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{form.display_name}</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {form.feature_key}
            {form.edge_function && <> · edge: <b>{form.edge_function}</b></>}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-semibold">Feature activa</Label>
              <p className="text-xs text-muted-foreground">Si está inactiva, la edge function usa el fallback hardcodeado.</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </div>

          <div>
            <Label>Nombre visible</Label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Modelo</Label>
              <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {modelOptions.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                  {!modelOptions.includes(form.model) && (
                    <SelectItem value={form.model}>{form.model}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Costo estimado por request (USD)</Label>
              <Input
                type="number"
                step="0.0001"
                value={form.est_cost_per_call ?? 0}
                onChange={(e) => setForm({ ...form, est_cost_per_call: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label>Temperature — <span className="font-mono">{Number(form.temperature).toFixed(2)}</span></Label>
            <Slider
              min={0}
              max={1.5}
              step={0.05}
              value={[Number(form.temperature)]}
              onValueChange={([v]) => setForm({ ...form, temperature: v })}
              className="mt-3"
            />
          </div>

          <div>
            <Label>Max tokens (opcional)</Label>
            <Input
              type="number"
              value={form.max_tokens ?? ""}
              placeholder="Sin límite"
              onChange={(e) => setForm({ ...form, max_tokens: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>

          <div>
            <Label>System prompt</Label>
            <Textarea
              className="min-h-[280px] font-mono text-[12px] leading-relaxed"
              value={form.system_prompt ?? ""}
              onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              placeholder="Instrucciones para el modelo…"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Este prompt se usa como <code>role: "system"</code> en la llamada al modelo.
            </p>
          </div>

          {usage.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-wider">Últimos 20 requests</Label>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Fecha</th>
                      <th className="px-2 py-1 text-right">Tokens in</th>
                      <th className="px-2 py-1 text-right">Tokens out</th>
                      <th className="px-2 py-1 text-right">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.map((u, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{new Date(u.created_at).toLocaleString("es-AR")}</td>
                        <td className="px-2 py-1 text-right">{u.tokens_in ?? "—"}</td>
                        <td className="px-2 py-1 text-right">{u.tokens_out ?? "—"}</td>
                        <td className="px-2 py-1 text-right">{u.cost_usd != null ? `$${Number(u.cost_usd).toFixed(4)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white/95 py-3 backdrop-blur">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
