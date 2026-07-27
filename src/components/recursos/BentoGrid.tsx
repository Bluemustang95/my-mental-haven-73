import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Wind,
  Sparkles,
  Brain,
  ShieldCheck,
  ClipboardList,
  User,
  BookOpen,
  Moon,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { readLocalProfile } from "@/lib/clinicalAlgorithm";
import { supabase } from "@/integrations/supabase/client";
import { ATOMIC_COLORS } from "@/components/home/QuickToolWidget";

type Tile = {
  slug: string;
  name: string;
  Icon: LucideIcon;
  color: string;
  target: string;
};

// Fuente de verdad de los tiles del Bento. Los colores replican los de home
// (`ATOMIC_COLORS`) para que un mismo recurso se lea igual en ambas pantallas.
const tiles: Tile[] = [
  {
    slug: "inventarios",
    name: "Test e inventarios",
    Icon: ClipboardList,
    color: ATOMIC_COLORS.psico_quick,
    target: "/herramientas/inventarios",
  },
  {
    slug: "mente-emocion",
    name: "Pensamientos",
    Icon: Brain,
    color: ATOMIC_COLORS.pensamientos_quick,
    target: "/herramientas/mente-emocion",
  },
  {
    slug: "personalidad",
    name: "Personalidad",
    Icon: User,
    color: "#9b72cf",
    target: "/herramientas/personalidad",
  },
  {
    slug: "habitos",
    name: "Hábitos",
    Icon: Zap,
    color: ATOMIC_COLORS.mini_habits,
    target: "/diario-inteligente/gestion-pensamientos/habitos",
  },
  {
    slug: "sueno",
    name: "Sueño",
    Icon: Moon,
    color: ATOMIC_COLORS.sleep_zone,
    target: "/herramientas/sueno",
  },
  {
    slug: "diario",
    name: "Diario",
    Icon: BookOpen,
    color: "#c98a5e",
    target: "/diario",
  },
  {
    slug: "psicoeducacion",
    name: "Psicoeducación",
    Icon: GraduationCap,
    color: ATOMIC_COLORS.psico_quick,
    target: "/herramientas/psicoeducacion",
  },
  // Off por default (visibles solo si admin los publica)
  {
    slug: "plan-seguridad",
    name: "Plan de Seguridad",
    Icon: ShieldCheck,
    color: "#e24b4a",
    target: "/herramientas/plan-seguridad",
  },
  {
    slug: "mindfulness",
    name: "Mindfulness",
    Icon: Wind,
    color: ATOMIC_COLORS.mindfulness_quick,
    target: "/herramientas/mindfulness",
  },
  {
    slug: "pack",
    name: "Pack Actividades",
    Icon: Sparkles,
    color: ATOMIC_COLORS.pack_quick,
    target: "/herramientas/pack",
  },
  {
    slug: "noticias",
    name: "Resma Research",
    Icon: BookOpen,
    color: ATOMIC_COLORS.mindfulness_quick,
    target: "/herramientas/noticias",
  },
];

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BentoGrid() {
  const navigate = useNavigate();
  const profile = useMemo(() => readLocalProfile(), []);
  const priority = profile?.priority;
  const [publishedSlugs, setPublishedSlugs] = useState<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from("resource_categories")
      .select("slug, is_published")
      .then(({ data }) => {
        if (!alive) return;
        const published = new Set(
          (data ?? [])
            .filter((r: any) => r.is_published !== false)
            .map((r: any) => String(r.slug ?? "").toLowerCase())
            .filter(Boolean),
        );
        setPublishedSlugs(published);
      });
    return () => {
      alive = false;
    };
  }, []);

  const visibleTiles = useMemo(() => {
    // Antes de que llegue la respuesta usamos el default (7 recursos ON).
    if (!publishedSlugs) {
      const DEFAULT_ON = new Set([
        "inventarios",
        "mente-emocion",
        "personalidad",
        "habitos",
        "sueno",
        "diario",
        "psicoeducacion",
      ]);
      return tiles.filter((t) => DEFAULT_ON.has(t.slug));
    }
    return tiles.filter((t) => publishedSlugs.has(t.slug.toLowerCase()));
  }, [publishedSlugs]);

  const orderedTiles = useMemo(() => {
    if (!priority) return visibleTiles;
    const idx = visibleTiles.findIndex((t) => t.slug === priority);
    if (idx < 0) return visibleTiles;
    return [visibleTiles[idx], ...visibleTiles.filter((_, i) => i !== idx)];
  }, [priority, visibleTiles]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {orderedTiles.map((t) => {
        const isPriority = t.slug === priority;
        return (
          <button
            key={t.slug}
            onClick={() => navigate(t.target)}
            className="pressable relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-[26px] p-4 text-center transition"
            style={{
              background: t.color,
              boxShadow: isPriority
                ? `0 20px 38px -14px ${hexToRgba(t.color, 0.6)}`
                : `0 12px 26px -16px ${hexToRgba(t.color, 0.7)}`,
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%)",
              }}
            />
            {isPriority && (
              <span className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                <Sparkles size={9} /> Tu foco
              </span>
            )}
            <t.Icon size={30} strokeWidth={1.6} className="relative text-white" />
            <h3 className="relative font-display text-[13.5px] font-semibold leading-tight tracking-tight text-white">
              {t.name}
            </h3>
          </button>
        );
      })}
    </div>
  );
}
