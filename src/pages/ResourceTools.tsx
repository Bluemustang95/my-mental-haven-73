import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Wind, Flower2, Hand, Leaf, BookOpen, Heart, Brain, Music } from "lucide-react";

const iconMap: Record<string, any> = { Sparkles, Wind, Flower2, Hand, Leaf, BookOpen, Heart, Brain, Music };

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

// Map category slug → existing runner route (legacy compat)
const runnerRoute: Record<string, string> = {
  respiracion: "/herramientas/respiracion",
  mindfulness: "/herramientas/mindfulness",
  grounding: "/herramientas/grounding",
  autocuidado: "/herramientas/autocuidado",
  psicoeducacion: "/herramientas/contenido",
};

export default function ResourceTools() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("resource_categories").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: tools = [] } = useQuery({
    queryKey: ["tools", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("resource_tools").select("*").eq("category_id", category!.id).eq("is_published", true).order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!category?.id,
  });

  if (!category) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Cargando…</div>;
  }

  const Icon = iconMap[category.icon] || Sparkles;
  const colorClass = colorMap[category.color] || colorMap.muted;
  const baseRoute = runnerRoute[category.slug] || `/herramientas/${category.slug}`;

  const handleOpen = (tool: any) => {
    if (tool.tool_type === "content_link" && tool.config?.url) {
      const url = tool.config.url as string;
      if (url.startsWith("http")) window.open(url, "_blank", "noopener,noreferrer");
      else navigate(url);
      return;
    }
    navigate(`${baseRoute}?tool=${tool.slug}`);
  };

  return (
    <div className="px-5 pt-14 pb-20 safe-area-top">
      <button onClick={() => navigate("/herramientas")} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Recursos
      </button>

      <div className={`mb-5 rounded-[2rem] border p-5 ${colorClass}`}>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-background/60">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-semibold">{category.name}</h1>
        {category.description && <p className="mt-1 text-sm opacity-80">{category.description}</p>}
      </div>

      <div className="space-y-3">
        {tools.map((tool: any) => (
          <motion.button
            key={tool.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpen(tool)}
            className={`w-full rounded-3xl border p-4 text-left ${colorClass}`}
          >
            <p className="font-display text-base font-semibold">{tool.name}</p>
            {tool.description && <p className="mt-0.5 text-xs opacity-75">{tool.description}</p>}
          </motion.button>
        ))}
        {tools.length === 0 && (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay herramientas en este recurso.
          </p>
        )}
      </div>
    </div>
  );
}
