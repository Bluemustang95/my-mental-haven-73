import type { WidgetId } from "@/components/home/WidgetsBoard";

export type WidgetIdentity = {
  id: WidgetId;
  label: string;
  tagline: string;
  from: string;
  to: string;
  ink: string;
  border: string;
  glyph:
    | "moon"
    | "waves"
    | "rings"
    | "heart"
    | "notepad"
    | "quotes"
    | "signal"
    | "sun"
    | "spiral";
};

export const WIDGET_IDENTITY: Record<WidgetId, WidgetIdentity> = {
  morning: {
    id: "morning",
    label: "Sintonía de la mañana",
    tagline: "Amanecer",
    from: "#ffe6b8",
    to: "#facb60",
    ink: "#8a5a12",
    border: "rgba(202,142,44,0.35)",
    glyph: "sun",
  },
  recommended: {
    id: "recommended",
    label: "Práctica recomendada",
    tagline: "Corriente",
    from: "#c4ecef",
    to: "#7cc2c8",
    ink: "#0d5e63",
    border: "rgba(13,94,99,0.28)",
    glyph: "spiral",
  },
  night: {
    id: "night",
    label: "Balance nocturno",
    tagline: "Constelación",
    from: "#4a4a8f",
    to: "#101927",
    ink: "#ffffff",
    border: "rgba(255,255,255,0.15)",
    glyph: "moon",
  },
  sleep_zone: {
    id: "sleep_zone",
    label: "Zona de descanso",
    tagline: "Refugio nocturno",
    from: "#6d5bd0",
    to: "#241c5a",
    ink: "#ffffff",
    border: "rgba(255,255,255,0.14)",
    glyph: "moon",
  },
  pending: {
    id: "pending",
    label: "Pendientes para vos",
    tagline: "En movimiento",
    from: "#ffd6a5",
    to: "#f28b52",
    ink: "#7a3312",
    border: "rgba(122,51,18,0.28)",
    glyph: "signal",
  },
  mini_habits: {
    id: "mini_habits",
    label: "Mini hábitos",
    tagline: "Constancia",
    from: "#cfeadb",
    to: "#5dbf9a",
    ink: "#1e5c47",
    border: "rgba(30,92,71,0.25)",
    glyph: "rings",
  },
  gratitude: {
    id: "gratitude",
    label: "Agradecimiento",
    tagline: "Ternura",
    from: "#ffd4e0",
    to: "#f291b2",
    ink: "#7a2b4a",
    border: "rgba(122,43,74,0.24)",
    glyph: "heart",
  },
  contention_notes: {
    id: "contention_notes",
    label: "Notas de contención",
    tagline: "Refugio",
    from: "#f6d0b8",
    to: "#c47a55",
    ink: "#5a281a",
    border: "rgba(90,40,26,0.28)",
    glyph: "notepad",
  },
  daily_quote: {
    id: "daily_quote",
    label: "Frase del día",
    tagline: "Inspiración",
    from: "#fff2d1",
    to: "#e8c470",
    ink: "#6b5023",
    border: "rgba(107,80,35,0.26)",
    glyph: "quotes",
  },
  psy_news: {
    id: "psy_news",
    label: "Noticias de psicología",
    tagline: "Actualidad",
    from: "#cfe8ff",
    to: "#6aa4e0",
    ink: "#0e3b6b",
    border: "rgba(14,59,107,0.26)",
    glyph: "waves",
  },
  mindfulness_quick: {
    id: "mindfulness_quick",
    label: "Mindfulness y respiración",
    tagline: "Corriente",
    from: "#d4f0f2",
    to: "#7cc2c8",
    ink: "#0d5e63",
    border: "rgba(13,94,99,0.28)",
    glyph: "spiral",
  },
  pensamientos_quick: {
    id: "pensamientos_quick",
    label: "Gestión de pensamientos",
    tagline: "Claridad",
    from: "#e5dbff",
    to: "#8a72d6",
    ink: "#3b2a70",
    border: "rgba(59,42,112,0.26)",
    glyph: "rings",
  },
  pack_quick: {
    id: "pack_quick",
    label: "Pack de activación",
    tagline: "Impulso",
    from: "#ffe1c2",
    to: "#f28b52",
    ink: "#7a3312",
    border: "rgba(122,51,18,0.28)",
    glyph: "signal",
  },
  diario_quick: {
    id: "diario_quick",
    label: "Diario íntimo",
    tagline: "Interior",
    from: "#f6e3cf",
    to: "#c47a55",
    ink: "#5a281a",
    border: "rgba(90,40,26,0.28)",
    glyph: "notepad",
  },
  psico_quick: {
    id: "psico_quick",
    label: "Psicoeducación",
    tagline: "Aprendizaje",
    from: "#d3ecff",
    to: "#6aa4e0",
    ink: "#0e3b6b",
    border: "rgba(14,59,107,0.26)",
    glyph: "quotes",
  },
};

export function widgetGradient(id: WidgetId) {
  const w = WIDGET_IDENTITY[id];
  return `linear-gradient(135deg, ${w.from} 0%, ${w.to} 100%)`;
}

/** Abstract SVG glyph — unique shape per widget, no emojis. */
export function WidgetGlyph({
  glyph,
  color = "currentColor",
  size = 72,
  className,
}: {
  glyph: WidgetIdentity["glyph"];
  color?: string;
  size?: number;
  className?: string;
}) {
  const s = size;
  const stroke = color;
  const common = { width: s, height: s, viewBox: "0 0 100 100", className, "aria-hidden": true } as const;
  switch (glyph) {
    case "sun":
      return (
        <svg {...common}>
          <circle cx="50" cy="60" r="18" fill={color} opacity="0.85" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <line
              key={d}
              x1="50"
              y1="60"
              x2={50 + Math.cos((d * Math.PI) / 180) * 34}
              y2={60 + Math.sin((d * Math.PI) / 180) * 34}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.55"
            />
          ))}
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M65 30 A28 28 0 1 0 65 78 A22 22 0 1 1 65 30 Z" fill={color} opacity="0.9" />
          <circle cx="30" cy="28" r="1.5" fill={color} opacity="0.7" />
          <circle cx="22" cy="52" r="1" fill={color} opacity="0.6" />
          <circle cx="85" cy="20" r="1.2" fill={color} opacity="0.55" />
        </svg>
      );
    case "spiral":
      return (
        <svg {...common}>
          <path
            d="M50 50 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 0 12 -12 a20 20 0 1 1 -20 20 a30 30 0 1 0 30 -30"
            fill="none"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      );
    case "rings":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="28" fill="none" stroke={stroke} strokeWidth="3" opacity="0.35" />
          <circle cx="50" cy="50" r="20" fill="none" stroke={stroke} strokeWidth="3" opacity="0.6" />
          <circle cx="50" cy="50" r="12" fill={color} opacity="0.85" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path
            d="M50 78 C22 60 22 34 38 30 C46 28 50 34 50 40 C50 34 54 28 62 30 C78 34 78 60 50 78 Z"
            fill={color}
            opacity="0.9"
          />
        </svg>
      );
    case "notepad":
      return (
        <svg {...common}>
          <rect x="24" y="24" width="52" height="60" rx="8" fill={color} opacity="0.85" />
          <line x1="34" y1="42" x2="66" y2="42" stroke="#fff" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
          <line x1="34" y1="54" x2="60" y2="54" stroke="#fff" strokeWidth="2.5" opacity="0.55" strokeLinecap="round" />
          <line x1="34" y1="66" x2="55" y2="66" stroke="#fff" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
        </svg>
      );
    case "quotes":
      return (
        <svg {...common}>
          <path
            d="M30 30 h18 v18 c0 12 -6 20 -18 24 v-8 c6 -2 10 -8 10 -14 h-10 z"
            fill={color}
            opacity="0.9"
          />
          <path
            d="M60 30 h18 v18 c0 12 -6 20 -18 24 v-8 c6 -2 10 -8 10 -14 h-10 z"
            fill={color}
            opacity="0.9"
          />
        </svg>
      );
    case "signal":
      return (
        <svg {...common}>
          <circle cx="30" cy="70" r="6" fill={color} />
          <path d="M42 70 a18 18 0 0 1 18 -18" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.75" />
          <path d="M42 70 a30 30 0 0 1 30 -30" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
          <path d="M42 70 a42 42 0 0 1 42 -42" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.3" />
        </svg>
      );
    case "waves":
      return (
        <svg {...common}>
          <path d="M15 40 Q30 28 45 40 T75 40 T105 40" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
          <path d="M15 55 Q30 43 45 55 T75 55 T105 55" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
          <path d="M15 70 Q30 58 45 70 T75 70 T105 70" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
  }
}

/** Wraps a widget content with the identity gradient background + corner glyph. */
export function WidgetShell({
  id,
  children,
  compact,
  onClick,
  tile,
}: {
  id: WidgetId;
  children?: React.ReactNode;
  compact?: boolean;
  onClick?: () => void;
  /** Minimal tile: only the glyph + label. */
  tile?: boolean;
}) {
  const ident = WIDGET_IDENTITY[id];
  const isDark = ident.ink === "#ffffff";
  const Tag = onClick ? "button" : "div";

  if (tile) {
    return (
      <Tag
        onClick={onClick}
        className="relative flex h-[130px] w-full flex-col justify-between overflow-hidden rounded-[22px] p-3.5 text-left transition active:scale-[0.985]"
        style={{
          background: isDark
            ? `linear-gradient(160deg, ${ident.from} 0%, ${ident.to} 90%)`
            : `linear-gradient(160deg, ${ident.from}f2 0%, ${ident.to}e6 100%)`,
          color: ident.ink,
        }}
      >
        <div className="pointer-events-none absolute -right-5 -top-6 opacity-25" style={{ color: ident.ink }}>
          <WidgetGlyph glyph={ident.glyph} color={ident.ink} size={90} />
        </div>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm" style={{ color: ident.ink }}>
          <WidgetGlyph glyph={ident.glyph} color={ident.ink} size={18} />
        </div>
        <p className="relative font-display text-[14px] font-bold leading-tight" style={{ color: ident.ink }}>
          {ident.label}
        </p>
      </Tag>
    );
  }

  return (
    <Tag
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-[24px] p-[1px] text-left transition active:scale-[0.985]"
      style={{ background: widgetGradient(id) }}
    >
      <div
        className={`relative overflow-hidden rounded-[23px] ${compact ? "p-3.5" : "p-4"}`}
        style={{
          background: isDark
            ? `linear-gradient(160deg, ${ident.from} 0%, ${ident.to} 90%)`
            : `linear-gradient(160deg, ${ident.from}f2 0%, ${ident.to}e6 100%)`,
          color: ident.ink,
        }}
      >
        <div
          className="pointer-events-none absolute -right-4 -top-6 opacity-30"
          style={{ color: ident.ink }}
        >
          <WidgetGlyph glyph={ident.glyph} color={ident.ink} size={100} />
        </div>
        <div className="relative">{children}</div>
      </div>
    </Tag>
  );
}

