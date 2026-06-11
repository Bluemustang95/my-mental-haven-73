import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Zap, Brain, Heart, Shield, Wind, Waves } from "lucide-react";

const tiles = [
  {
    slug: "mindfulness",
    name: "Mindfulness",
    desc: "Respiración consciente, observar y definir.",
    emoji: "🧘",
    bg: "bg-[#FFE4EC]",
    fg: "text-[#9B1B2C]",
    large: true,
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
    desc: "Mejora vínculos.",
    emoji: "🛡️",
    bg: "bg-[#D6F3DC]",
    fg: "text-[#1B5E2D]",
  },
];

export function BentoGrid() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Mindfulness — tall left */}
        <button
          onClick={() => navigate(`/diario-inteligente/${tiles[0].slug}`)}
          className={`relative row-span-2 flex flex-col justify-between overflow-hidden rounded-3xl p-5 text-left ${tiles[0].bg}`}
          style={{ minHeight: 280 }}
        >
          <span className="absolute -top-4 -right-4 text-7xl opacity-30">{tiles[0].emoji}</span>
          <div />
          <div>
            <h3 className={`font-display text-xl font-bold ${tiles[0].fg}`}>{tiles[0].name}</h3>
            <p className={`mt-1 text-sm ${tiles[0].fg} opacity-75`}>{tiles[0].desc}</p>
          </div>
        </button>

        {/* Right column */}
        <div className="grid grid-rows-2 gap-3">
          {[tiles[1], tiles[2]].map((t) => (
            <button
              key={t.slug}
              onClick={() => navigate(`/diario-inteligente/${t.slug}`)}
              className={`relative flex flex-col justify-between overflow-hidden rounded-3xl p-4 text-left ${t.bg}`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <div>
                <h3 className={`font-display text-base font-bold leading-tight ${t.fg}`}>
                  {t.name}
                </h3>
                <p className={`mt-1 text-xs ${t.fg} opacity-75`}>{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: efectividad full + gestion */}
      <button
        onClick={() => navigate(`/diario-inteligente/${tiles[3].slug}`)}
        className={`relative flex w-full items-center justify-between overflow-hidden rounded-3xl p-4 text-left ${tiles[3].bg}`}
      >
        <div>
          <h3 className={`font-display text-base font-bold ${tiles[3].fg}`}>{tiles[3].name}</h3>
          <p className={`mt-1 text-xs ${tiles[3].fg} opacity-75`}>{tiles[3].desc}</p>
        </div>
        <span className="text-3xl">{tiles[3].emoji}</span>
      </button>

      {/* Gestion de Pensamientos — wide blue */}
      <button
        onClick={() => navigate("/diario-inteligente/gestion-pensamientos")}
        className="relative flex w-full items-center justify-between overflow-hidden rounded-3xl bg-[#E0E9FF] p-5 text-left"
      >
        <div>
          <h3 className="font-display text-base font-bold text-[#1E3A8A]">
            Gestión de Pensamientos
          </h3>
          <p className="mt-1 text-xs text-[#1E3A8A]/75">
            Identifica distorsiones, frena la rumiación y la preocupación.
          </p>
        </div>
        <span className="text-3xl">🧠</span>
      </button>

      {/* Pack Actividades — dark */}
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
