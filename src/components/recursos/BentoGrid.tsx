import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Wind, Sparkles, Lock, Brain, ShieldCheck, type LucideIcon } from "lucide-react";
import { readLocalProfile } from "@/lib/clinicalAlgorithm";
import { usePlan } from "@/hooks/usePlan";
import { PaywallModal } from "@/components/modals/PaywallModal";

type Tile = {
  slug: string;
  name: string;
  desc: string;
  Icon: LucideIcon;
  tint: "primary" | "accent";
};

type TileWithTarget = Tile & { target: string };

const tiles: TileWithTarget[] = [
  { slug: "mindfulness", name: "Mindfulness", desc: "Respiración consciente.", Icon: Wind, tint: "primary", target: "/herramientas/mindfulness" },
  { slug: "mente-emocion", name: "Mente & Emoción", desc: "CBT + Regulación DBT.", Icon: Brain, tint: "accent", target: "/herramientas/mente-emocion" },
  { slug: "habitos", name: "Hábitos", desc: "Habit Tracker.", Icon: Zap, tint: "primary", target: "/diario-inteligente/gestion-pensamientos/habitos" },
];

const tintBg: Record<Tile["tint"], string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/25 text-foreground",
};

export function BentoGrid() {
  const navigate = useNavigate();
  const profile = useMemo(() => readLocalProfile(), []);
  const priority = profile?.priority;
  const { plan } = usePlan();
  const isPremium = plan === "premium";
  const [paywall, setPaywall] = useState<{ open: boolean; name?: string }>({ open: false });

  const open = (slug: string, name: string, target: string) => {
    if (!isPremium) {
      setPaywall({ open: true, name });
      return;
    }
    navigate(target);
  };

  const orderedTiles = useMemo(() => {
    if (!priority) return tiles;
    const idx = tiles.findIndex((t) => t.slug === priority);
    if (idx < 0) return tiles;
    return [tiles[idx], ...tiles.filter((_, i) => i !== idx)];
  }, [priority]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {orderedTiles.map((t) => {
          const isPriority = t.slug === priority;
          const locked = !isPremium;
          return (
            <button
              key={t.slug}
              onClick={() => open(t.slug, t.name, t.target)}
              className="pressable glass-premium relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl p-4 text-left transition"
              style={isPriority ? { borderColor: "rgba(124,194,200,0.55)", boxShadow: "0 18px 36px -14px rgba(124,194,200,0.45), inset 0 1px 0 rgba(255,255,255,0.7)" } : undefined}
            >
              <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-50 blur-2xl" style={{ background: t.tint === "primary" ? "rgba(124,194,200,0.35)" : "rgba(250,203,96,0.35)" }} />
              {isPriority && (
                <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#7cc2c8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                  <Sparkles size={9} /> Tu foco
                </span>
              )}
              {locked && !isPriority && (
                <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/85 text-white">
                  <Lock size={11} strokeWidth={2.6} />
                </span>
              )}
              <div className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ${tintBg[t.tint]}`}>
                <t.Icon size={20} strokeWidth={2} />
              </div>
              <div className="relative">
                <h3 className="font-display text-base font-bold leading-tight text-foreground">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => open("pack", "Pack de Actividades", "/herramientas/pack")}
        className="relative flex w-full items-center justify-between overflow-hidden rounded-3xl bg-primary p-5 text-left text-primary-foreground shadow-primary-glow"
      >
        <div>
          <h3 className="font-display text-base font-bold">Pack de Actividades</h3>
          <p className="mt-1 text-xs font-medium opacity-80">Abrí el kit con ejercicios de la app.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          {isPremium ? <Zap size={20} fill="currentColor" /> : <Lock size={18} strokeWidth={2.6} />}
        </div>
      </button>

      <button
        onClick={() => navigate("/herramientas/plan-seguridad")}
        className="pressable relative flex w-full items-center justify-between overflow-hidden rounded-3xl border border-[#f5c8c1]/70 bg-[#fef2f0] p-4 text-left transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e24b4a]/15 text-[#c0392b]">
            <ShieldCheck size={20} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold leading-tight text-[#0f172a]">Plan de Seguridad</h3>
            <p className="mt-0.5 text-xs text-[#64748b]">Tus señales, apoyos y contactos.</p>
          </div>
        </div>
        <span className="text-[18px] text-[#c0392b]">→</span>
      </button>

      <PaywallModal
        open={paywall.open}
        featureName={paywall.name}
        onClose={() => setPaywall({ open: false })}
      />
    </div>
  );
}
