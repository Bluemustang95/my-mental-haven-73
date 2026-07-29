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
    <div className="grid grid-cols-2 gap-2.5">
      {orderedTiles.map((t, i) => {
        const isPriority = t.slug === priority;
        // Ritmo asimétrico: la primera tarjeta ocupa el ancho completo y luego
        // se alternan pares cuadrados (Bento estilo Apple).
        const isWide = i === 0;
        return (
          <button
            key={t.slug}
            onClick={() => navigate(t.target)}
            className={`pressable group relative flex flex-col items-start justify-end overflow-hidden rounded-[24px] p-4 text-left transition-transform duration-200 active:scale-[0.97] ${
              isWide ? "col-span-2 min-h-[92px]" : "aspect-[1/0.82]"
            }`}
            style={{
              background: `linear-gradient(155deg, ${hexToRgba(t.color, 0.16)} 0%, ${hexToRgba(t.color, 0.07)} 100%)`,
              border: `1px solid ${hexToRgba(t.color, 0.18)}`,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: isPriority
                ? `0 18px 34px -20px ${hexToRgba(t.color, 0.55)}`
                : `0 10px 24px -20px ${hexToRgba(t.color, 0.45)}`,
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(150deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%)",
              }}
            />
            {isPriority && (
              <span
                className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
                style={{ background: hexToRgba(t.color, 0.14), color: t.color }}
              >
                <Sparkles size={9} strokeWidth={1.4} /> Tu foco
              </span>
            )}
            <t.Icon
              size={isWide ? 26 : 24}
              strokeWidth={1.1}
              className="relative mb-auto"
              style={{ color: t.color }}
            />
            <h3
              className="relative mt-3 font-display text-[13.5px] font-medium leading-tight tracking-[-0.01em]"
              style={{ color: t.color }}
            >
              {t.name}
            </h3>
          </button>
        );
      })}
    </div>
  );
}

