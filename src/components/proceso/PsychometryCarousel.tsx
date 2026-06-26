import { motion } from "framer-motion";

type TestKey = "BDI" | "BAI" | "PSWQ";
type Status = "ok" | "due" | "never";

const STATUS_DOT: Record<Status, string> = {
  ok: "#34d399",
  due: "#facb60",
  never: "#fbbf24",
};

const STATUS_TEXT: Record<Status, string> = {
  ok: "✓ Al día",
  due: "Toca actualizar",
  never: "Pendiente",
};

type Card = {
  code: TestKey;
  title: string;
  gradient: string;
  status: Status;
  recency: string;
  art: React.ReactNode;
};

const CARDS: Card[] = [
  {
    code: "BDI",
    title: "Depresión de Beck",
    gradient: "linear-gradient(135deg,#7cc2c8 0%,#5fa8af 100%)",
    status: "due",
    recency: "Hace 9 días",
    art: <ArtResilientBars />,
  },
  {
    code: "BAI",
    title: "Ansiedad de Beck",
    gradient: "linear-gradient(135deg,#4f46e5 0%,#3b32c0 100%)",
    status: "ok",
    recency: "Hace 2 días",
    art: <ArtSineHarmony />,
  },
  {
    code: "PSWQ",
    title: "Preocupación (PSWQ)",
    gradient: "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
    status: "never",
    recency: "Nunca",
    art: <ArtGoldenSpiral />,
  },
];

export function PsychometryCarousel({ onSelect }: { onSelect: (code: TestKey) => void }) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <p className="font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.18em] text-[#7cc2c8]">
          Evaluaciones y psicometría
        </p>
        <p className="text-[11px] text-[#94a3b8]">Desliza para ver más</p>
      </div>
      <div className="-mx-5 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
        {CARDS.map((c) => (
          <motion.button
            key={c.code}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(c.code)}
            className="relative h-56 w-44 shrink-0 overflow-hidden rounded-[24px] p-4 text-left text-white shadow-[0_14px_30px_-16px_rgba(16,25,39,0.45)]"
            style={{ background: c.gradient }}
          >
            <div className="absolute inset-0 opacity-90">{c.art}</div>
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-end">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider backdrop-blur-md">
                  {c.code === "BDI" ? "BDI-II" : c.code}
                </span>
              </div>
              <div>
                <p className="font-serif text-[18px] font-medium leading-tight drop-shadow">{c.title}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/85">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[c.status] }} />
                  <span>{STATUS_TEXT[c.status]} · {c.recency}</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ArtResilientBars() {
  // descending then rising bars (resilience)
  const heights = [60, 48, 36, 28, 36, 52, 70];
  return (
    <svg viewBox="0 0 176 224" className="h-full w-full">
      <defs>
        <linearGradient id="bars-g" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.40)" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <rect key={i} x={14 + i * 22} y={180 - h} width={12} height={h} rx={5} fill="url(#bars-g)" />
      ))}
    </svg>
  );
}

function ArtSineHarmony() {
  // chaotic left → harmonic right
  let d = "M 0 112";
  for (let x = 0; x <= 176; x += 4) {
    const t = x / 176;
    const chaos = (1 - t) * 22 * Math.sin(x * 0.45 + Math.cos(x * 0.13));
    const harmony = t * 14 * Math.sin(x * 0.12);
    d += ` L ${x} ${112 + chaos + harmony}`;
  }
  return (
    <svg viewBox="0 0 176 224" className="h-full w-full">
      <path d={d} stroke="rgba(255,255,255,0.55)" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <path d={d} stroke="rgba(255,255,255,0.18)" strokeWidth={6} fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ArtGoldenSpiral() {
  // simple golden-ish spiral
  const cx = 92, cy = 120;
  let d = `M ${cx} ${cy}`;
  for (let i = 0; i < 360; i += 6) {
    const a = (i * Math.PI) / 180;
    const r = 2 + i * 0.18;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += ` L ${x} ${y}`;
  }
  return (
    <svg viewBox="0 0 176 224" className="h-full w-full">
      <path d={d} stroke="rgba(255,255,255,0.55)" strokeWidth={1.4} fill="none" />
    </svg>
  );
}
