import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

const tiles = [
  {
    slug: "mindfulness",
    name: "Mindfulness",
    desc: "Respiración consciente.",
    emoji: "🧘",
    bg: "bg-[#FFE4EC]",
    fg: "text-[#9B1B2C]",
  },
  {
    slug: "regulacion-emocional",
    name: "Regulación Emocional",
    desc: "Habilidades STOP y TIP.",
    emoji: "❤️",
    bg: "bg-[#FFE7CC]",
    fg: "text-[#9B4A1E]",
  },
  {
    slug: "tolerancia-malestar",
    name: "Tolerancia al Malestar",
    desc: "Sobrevive a crisis.",
    emoji: "🌊",
    bg: "bg-[#E6DEFF]",
    fg: "text-[#3F2A8C]",
  },
  {
    slug: "efectividad-personal",
    name: "Efectividad Personal",
    desc: "Mejorá vínculos.",
    emoji: "🛡️",
    bg: "bg-[#D6F3DC]",
    fg: "text-[#1B5E2D]",
  },
];

export function BentoGrid() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <button
            key={t.slug}
            onClick={() => navigate(`/diario-inteligente/${t.slug}`)}
            className={`relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl p-4 text-left ${t.bg}`}
          >
            <span className="absolute -top-3 -right-3 text-6xl opacity-30">{t.emoji}</span>
            <span className="relative text-2xl">{t.emoji}</span>
            <div className="relative">
              <h3 className={`font-display text-base font-bold leading-tight ${t.fg}`}>{t.name}</h3>
              <p className={`mt-1 text-xs ${t.fg} opacity-75`}>{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Gestion de Pensamientos */}
      <button
        onClick={() => navigate("/diario-inteligente/gestion-pensamientos")}
        className="relative flex w-full items-center justify-between overflow-hidden rounded-3xl bg-[#E0E9FF] p-5 text-left"
      >
        <div>
          <h3 className="font-display text-base font-bold text-[#1E3A8A]">
            Gestión de Pensamientos
          </h3>
          <p className="mt-1 text-xs text-[#1E3A8A]/75">
            Identificá distorsiones, frená la rumiación y la preocupación.
          </p>
        </div>
        <span className="text-3xl">🧠</span>
      </button>

      {/* Pack Actividades */}
      <button
        onClick={() => navigate("/diario-inteligente/pack-actividades")}
        className="relative flex w-full items-center justify-between overflow-hidden rounded-3xl bg-[#1C1C1E] p-5 text-left text-white"
      >
        <div>
          <h3 className="font-display text-base font-bold">Pack de Actividades</h3>
          <p className="mt-1 text-xs opacity-70">Abrí el kit con ejercicios de la app.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-black">
          <Zap size={20} fill="black" />
        </div>
      </button>
    </div>
  );
}
