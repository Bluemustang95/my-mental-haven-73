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
  desc: string;
  Icon: LucideIcon;
  color: string;
  target: string;
};

// Fuente de verdad de los tiles del Bento. Los colores replican los de home
// (`ATOMIC_COLORS`) para que un mismo recurso se lea igual en ambas pantallas.
const tiles: Tile[] = [
  {
    slug: "mente-emocion",
    name: "Mente & Emoción",
    desc: "CBT + Regulación DBT.",
    Icon: Brain,
    color: ATOMIC_COLORS.pensamientos_quick,
    target: "/herramientas/mente-emocion",
  },
  {
    slug: "inventarios",
    name: "Tests e inventarios",
    desc: "BDI, BAI, PHQ-9, GAD-7 y más.",
    Icon: ClipboardList,
    color: ATOMIC_COLORS.psico_quick,
    target: "/herramientas/inventarios",
  },
  {
    slug: "habitos",
    name: "Hábitos",
    desc: "Habit Tracker.",
    Icon: Zap,
    color: ATOMIC_COLORS.mini_habits,
    target: "/diario-inteligente/gestion-pensamientos/habitos",
  },
  {
    slug: "sueno",
    name: "Sueño",
    desc: "Higiene y descanso.",
    Icon: Moon,
    color: ATOMIC_COLORS.sleep_zone,
    target: "/herramientas/sueno",
  },
  {
    slug: "diario",
    name: "Diario",
    desc: "Escribí tu día.",
    Icon: BookOpen,
    color: ATOMIC_COLORS.diario_quick,
    target: "/diario",
  },
  {
    slug: "psicoeducacion",
    name: "Psicoeducación",
    desc: "Aprendé de tu mente.",
    Icon: GraduationCap,
    color: ATOMIC_COLORS.psico_quick,
    target: "/psicoeducacion",
  },
  {
    slug: "plan-seguridad",
    name: "Plan de Seguridad",
    desc: "Señales, apoyos y contactos.",
    Icon: ShieldCheck,
    color: "#e24b4a",
    target: "/herramientas/plan-seguridad",
  },
  // Off por default (visibles solo si admin los publica de nuevo)
  {
    slug: "mindfulness",
    name: "Mindfulness",
    desc: "Respiración consciente.",
    Icon: Wind,
    color: ATOMIC_COLORS.mindfulness_quick,
    target: "/herramientas/mindfulness",
  },
  {
    slug: "pack",
    name: "Pack Actividades",
    desc: "Programas guiados.",
    Icon: Sparkles,
    color: ATOMIC_COLORS.pack_quick,
    target: "/herramientas/pack",
  },
  {
    slug: "personalidad",
    name: "Personalidad",
    desc: "Tu perfil Big Five.",
    Icon: User,
    color: "#9b72cf",
    target: "/herramientas/personalidad",
  },
  {
    slug: "noticias",
    name: "Resma Research",
    desc: "Investigación en psicología.",
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
        "mente-emocion",
        "inventarios",
        "habitos",
        "sueno",
        "diario",
        "psicoeducacion",
        "plan-seguridad",
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
        const halo = hexToRgba(t.color, 0.35);
        const iconBg = hexToRgba(t.color, 0.15);
        return (
          <button
            key={t.slug}
            onClick={() => navigate(t.target)}
            className="pressable glass-premium relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl p-4 text-left transition"
            style={
              isPriority
                ? {
                    borderColor: hexToRgba(t.color, 0.55),
                    boxShadow: `0 18px 36px -14px ${hexToRgba(t.color, 0.45)}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                  }
                : undefined
            }
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-60 blur-2xl"
              style={{ background: halo }}
            />
            {isPriority && (
              <span
                className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm"
                style={{ background: t.color }}
              >
                <Sparkles size={9} /> Tu foco
              </span>
            )}
            <div
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: iconBg, color: t.color }}
            >
              <t.Icon size={20} strokeWidth={2} />
            </div>
            <div className="relative">
              <h3 className="font-display text-base font-bold leading-tight text-foreground">
                {t.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
