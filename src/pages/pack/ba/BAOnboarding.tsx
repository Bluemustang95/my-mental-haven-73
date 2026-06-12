import { useState } from "react";
import { X, Zap, ChevronRight, RotateCcw } from "lucide-react";
import { AmbientGlows } from "@/components/pack/AmbientGlows";
import { StepDots } from "@/components/pack/StepDots";
import { BAContent } from "@/lib/baTypes";
import { useAdminRole } from "@/hooks/useAdminRole";


export function BAOnboarding({
  content,
  onClose,
  onFinish,
  onReset,
}: {
  content: BAContent;
  onClose: () => void;
  onFinish: () => void;
  onReset?: () => Promise<void> | void;
}) {
  const [step, setStep] = useState(0);
  const { isAdmin } = useAdminRole();

  const slides = content.intro_slides ?? [];
  const total = slides.length || 1;
  const slide = slides[step];

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else onFinish();
  };

  return (
    <div className="relative min-h-screen bg-[#fdfbfb] text-[#101927] safe-area-top">
      <AmbientGlows />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/10 bg-white shadow-sm"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
          {isAdmin && onReset && (
            <button
              onClick={async () => {
                if (!window.confirm("¿Reiniciar el programa de Activación Comportamental?")) return;
                await onReset();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/50 bg-white text-rose-600 shadow-sm"
              aria-label="Reiniciar programa (admin)"
              title="Reiniciar programa (admin)"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>


        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full opacity-40 blur-2xl"
              style={{ background: "#facb60" }}
            />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-[#facb60]/30">
              <Zap size={42} className="text-[#facb60]" />
            </div>
          </div>

          <div className="mt-8">
            <StepDots total={total} current={step} />
          </div>

          <h1 className="mt-6 font-mindful text-3xl leading-tight">{slide?.title}</h1>
          <p className="mt-4 max-w-sm whitespace-pre-line text-sm leading-relaxed text-[#101927]/65">
            {slide?.body}
          </p>
        </div>

        <button
          onClick={next}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#facb60] py-4 font-display text-sm font-bold text-[#101927] shadow-[0_10px_30px_rgba(250,203,96,0.4)] transition active:scale-[0.98]"
        >
          {step < total - 1 ? "Siguiente" : "Comenzar"} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
