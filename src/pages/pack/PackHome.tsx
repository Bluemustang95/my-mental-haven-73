import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, ChevronRight } from "lucide-react";
import { AmbientGlows } from "@/components/pack/AmbientGlows";
import { GlassCard } from "@/components/pack/GlassCard";
import { useBAContent } from "@/hooks/useBAContent";
import { useBAProgram } from "@/hooks/useBAProgram";

export default function PackHome() {
  const navigate = useNavigate();
  const { content } = useBAContent();
  const { program } = useBAProgram();

  const inProgress = program && program.state !== "completed";

  return (
    <div className="relative min-h-screen bg-[#fdfbfb] text-[#101927] safe-area-top">
      <AmbientGlows />

      <header className="sticky top-0 z-10 border-b border-[#101927]/5 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/10 bg-white shadow-sm"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-mindful text-lg">Pack de Actividades</h1>
        </div>
      </header>

      <main className="relative mx-auto max-w-md px-5 pt-8 pb-16">
        <p className="text-sm leading-relaxed text-[#101927]/65">
          Esta sección te brinda <strong>programas terapéuticos guiados paso a paso</strong>. A
          diferencia de los recursos rápidos, aquí seguirás un proceso estructurado para trabajar en
          tu bienestar profundo, día a día.
        </p>

        <h2 className="mt-8 font-mindful text-2xl">Elegí tu programa</h2>
        <p className="mt-1 text-xs text-[#101927]/55">Seleccioná un módulo terapéutico para comenzar.</p>

        <button
          onClick={() => navigate("/herramientas/pack/ba")}
          className="mt-5 w-full text-left"
        >
          <GlassCard className="relative overflow-hidden p-5 transition active:scale-[0.99]">
            <div className="absolute inset-0 -z-0 rounded-3xl"
              style={{ background: "linear-gradient(135deg, #fff7e0 0%, #ffffff 60%)" }} />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-[#facb60]/40">
                <Zap size={26} className="text-[#facb60]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#101927]">
                {content?.program_meta?.title ?? "Activación Comportamental"}
              </h3>
              <p className="mt-1 text-sm text-[#101927]/65">
                {content?.program_meta?.subtitle ?? "Recuperá tu energía vital actuando de afuera hacia adentro."}
              </p>
              {inProgress && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#facb60]/15 px-3 py-1 text-[11px] font-semibold text-[#8a6a13]">
                  Continuar — Día {program!.current_day} de 7 <ChevronRight size={12} />
                </div>
              )}
            </div>
          </GlassCard>
        </button>
      </main>
    </div>
  );
}
