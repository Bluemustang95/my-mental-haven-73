import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Waves, Wand2, Mic, Pencil, DollarSign } from "lucide-react";
import { AiFeatureEditor } from "@/components/admin/AiFeatureEditor";
import { toast } from "sonner";

export type AiFeatureConfig = {
  id: string;
  feature_key: string;
  display_name: string;
  description: string | null;
  category: string;
  model: string;
  temperature: number;
  max_tokens: number | null;
  system_prompt: string | null;
  active: boolean;
  est_cost_per_call: number | null;
  edge_function: string | null;
  updated_at: string;
};

const CATEGORY_META: Record<string, { label: string; icon: any; tint: string }> = {
  chat: { label: "Conversacional", icon: MessageSquare, tint: "#7cc2c8" },
  analysis: { label: "Análisis clínico", icon: Wand2, tint: "#8b79f2" },
  suggestion: { label: "Sugerencias", icon: Sparkles, tint: "#facb60" },
  audio: { label: "Audio / Voz", icon: Waves, tint: "#f472b6" },
};

export default function AiFeaturesManager() {
  const [items, setItems] = useState<AiFeatureConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AiFeatureConfig | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_feature_configs" as any)
      .select("*")
      .order("category")
      .order("display_name");
    if (error) toast.error(error.message);
    setItems(((data ?? []) as unknown) as AiFeatureConfig[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const g: Record<string, AiFeatureConfig[]> = {};
    for (const it of items) (g[it.category] ||= []).push(it);
    return g;
  }, [items]);

  const estMonthly = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.est_cost_per_call) || 0) * 1000, 0),
    [items]
  );

  return (
    <div className="h-full overflow-y-auto bg-[#f4f7f9] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-[#101927]">
              <Sparkles className="h-6 w-6 text-resma-teal" /> Inteligencia Artificial
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Prompts, modelo y parámetros de cada feature IA de la app. Los cambios se aplican al instante.
            </p>
          </div>
          <Card className="w-64">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Costo estimado / 1000 requests</CardTitle>
              <DollarSign className="h-4 w-4 text-resma-teal" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-bold">
                ${estMonthly.toFixed(3)}
              </p>
              <p className="text-[11px] text-muted-foreground">Suma de est_cost_per_call × 1000 en todas las features</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, list]) => {
              const meta = CATEGORY_META[cat] ?? { label: cat, icon: Sparkles, tint: "#94a3b8" };
              const Icon = meta.icon;
              return (
                <section key={cat}>
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: `${meta.tint}22` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: meta.tint }} />
                    </div>
                    <h2 className="font-display text-lg font-semibold text-[#101927]">{meta.label}</h2>
                    <Badge variant="secondary" className="ml-2">{list.length}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {list.map((it) => {
                      const missingPrompt = !it.system_prompt && it.category !== "audio" && it.model !== "deterministic";
                      return (
                        <Card key={it.id} className="border-[#e2e8f0]">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="truncate font-display text-[15px] font-semibold text-[#101927]">
                                    {it.display_name}
                                  </h3>
                                  {!it.active && (
                                    <Badge variant="destructive" className="text-[10px]">Inactivo</Badge>
                                  )}
                                  {missingPrompt && (
                                    <Badge variant="outline" className="border-amber-400 text-[10px] text-amber-700">
                                      Falta prompt
                                    </Badge>
                                  )}
                                </div>
                                {it.description && (
                                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
                                    {it.description}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  <Badge variant="outline" className="font-mono text-[10px]">{it.model}</Badge>
                                  <Badge variant="secondary" className="text-[10px]">T {Number(it.temperature).toFixed(1)}</Badge>
                                  {it.edge_function && (
                                    <Badge variant="outline" className="text-[10px]">
                                      <Mic className="mr-1 h-3 w-3" /> {it.edge_function}
                                    </Badge>
                                  )}
                                  {it.est_cost_per_call != null && Number(it.est_cost_per_call) > 0 && (
                                    <Badge variant="outline" className="text-[10px] text-emerald-700">
                                      ~${Number(it.est_cost_per_call).toFixed(4)}/req
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => setEditing(it)}>
                                <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <AiFeatureEditor
          feature={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
