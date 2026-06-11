import { motion } from "framer-motion";
import { X, Volume2, VolumeX, Music, CloudRain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MusicTrack } from "@/hooks/useMindfulAudio";
import type { ReactNode } from "react";

interface SubTab {
  id: string;
  label: string;
}

interface Props {
  title: string;
  description?: string;
  /** hex color used as accent for selected states + CTA */
  accent: string;
  subTabs?: SubTab[];
  activeSubTab?: string;
  onSubTabChange?: (id: string) => void;
  /** Duration in minutes. Omit to hide duration selector. */
  minutes?: number;
  onMinutesChange?: (m: number) => void;
  durationOptions?: number[];
  voice: boolean;
  onVoiceChange: (v: boolean) => void;
  music?: MusicTrack;
  onMusicChange?: (m: MusicTrack) => void;
  onClose: () => void;
  onStart: () => void;
  startLabel?: string;
  extraSlot?: ReactNode;
}

export function PracticeConfigScreen({
  title,
  description,
  accent,
  subTabs,
  activeSubTab,
  onSubTabChange,
  minutes,
  onMinutesChange,
  durationOptions,
  voice,
  onVoiceChange,
  music,
  onMusicChange,
  onClose,
  onStart,
  startLabel = "Comenzar Ejercicio",
  extraSlot,
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0F172A] text-white overflow-y-auto">
      <div className="min-h-full flex flex-col px-5 pt-12 pb-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"
          >
            <X size={18} />
          </button>

          {subTabs && subTabs.length > 0 ? (
            <div className="flex rounded-full bg-white/[0.06] p-1">
              {subTabs.map((t) => {
                const active = activeSubTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSubTabChange?.(t.id)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                      active ? "text-white" : "text-white/55"
                    )}
                    style={active ? { background: accent } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div />
          )}

          <div className="h-10 w-10 shrink-0" />
        </div>

        {/* Title */}
        <div className="mt-10 text-center">
          <h1 className="font-serif text-[34px] leading-tight font-bold">{title}</h1>
          {description && (
            <p className="mx-auto mt-3 max-w-[300px] text-[13px] leading-relaxed text-white/55">
              {description}
            </p>
          )}
        </div>

        {/* Duration */}
        {durationOptions && minutes !== undefined && onMinutesChange && (
          <div className="mt-10">
            <div className="text-center text-[10px] uppercase tracking-[0.22em] text-white/45">
              Tiempo de la sesión
            </div>
            <div className="mt-4 flex justify-center gap-3">
              {durationOptions.map((m) => {
                const active = minutes === m;
                return (
                  <motion.button
                    key={m}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMinutesChange(m)}
                    className={cn(
                      "h-[72px] w-[72px] rounded-2xl font-display text-lg font-bold transition",
                      active ? "text-white" : "bg-white/[0.06] text-white/55"
                    )}
                    style={
                      active
                        ? { background: accent, boxShadow: `0 10px 28px ${accent}55` }
                        : undefined
                    }
                  >
                    {m}m
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {extraSlot && <div className="mt-6">{extraSlot}</div>}

        {/* Voice toggle */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: voice ? "rgba(52, 211, 153, 0.15)" : "rgba(255,255,255,0.05)",
              color: voice ? "#34D399" : "rgba(255,255,255,0.4)",
            }}
          >
            {voice ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </div>
          <div className="flex-1">
            <div className="font-display text-sm font-semibold">Voz Guía</div>
            <div className="text-[11px] text-white/45">Instrucciones por audio</div>
          </div>
          <button
            onClick={() => onVoiceChange(!voice)}
            aria-label="Activar voz guía"
            className={cn(
              "relative h-7 w-12 rounded-full transition",
              voice ? "bg-[#34D399]" : "bg-white/15"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
                voice ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </div>

        {/* Music */}
        {onMusicChange && music !== undefined && (
          <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] text-white/55">
              <Music size={13} /> Sonido ambiente
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "silence", label: "Silencio", icon: VolumeX },
                  { id: "rain", label: "Lluvia", icon: CloudRain },
                  { id: "ambient", label: "Ambient", icon: Sparkles },
                ] as const
              ).map((t) => {
                const active = music === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onMusicChange(t.id)}
                    className={cn(
                      "rounded-xl py-2.5 text-[11px] font-medium transition flex flex-col items-center gap-1 border",
                      active
                        ? "text-white"
                        : "border-transparent bg-white/[0.04] text-white/50"
                    )}
                    style={
                      active
                        ? { background: `${accent}1f`, borderColor: `${accent}80` }
                        : undefined
                    }
                  >
                    <t.icon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-12">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="w-full rounded-2xl py-[18px] font-display text-base font-bold text-white"
            style={{ background: accent, boxShadow: `0 14px 36px ${accent}55` }}
          >
            {startLabel}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
