import { useState } from "react";
import { X } from "lucide-react";
import { GlassCard } from "@/components/pack/GlassCard";
import { BAContent } from "@/lib/baTypes";

export function BABarrierFlow({
  content,
  onChoose,
  onClose,
}: {
  content: BAContent;
  onChoose: (label: string) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<{ label: string; response: string } | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-3 sm:items-center">
      <GlassCard className="w-full max-w-md p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-bold">¿Qué pasó?</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#101927]/10">
            <X size={16} />
          </button>
        </div>

        {!picked ? (
          <div className="space-y-2">
            {(content.barriers_catalog ?? []).map((b) => (
              <button
                key={b.label}
                onClick={() => setPicked(b)}
                className="w-full rounded-2xl border border-[#101927]/10 bg-white p-3 text-left text-sm font-medium hover:border-[#facb60]"
              >
                {b.label}
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className="font-display text-sm font-bold text-[#facb60]">{picked.label}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#101927]/75">{picked.response}</p>
            <button
              onClick={() => {
                onChoose(picked.label);
                onClose();
              }}
              className="mt-5 w-full rounded-full bg-[#101927] py-3 text-sm font-bold text-white"
            >
              Volver mañana
            </button>
          </>
        )}
      </GlassCard>
    </div>
  );
}
