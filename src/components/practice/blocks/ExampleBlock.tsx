import { Lightbulb } from "lucide-react";
import { RichContent } from "@/components/psico/RichContent";

export function ExampleBlock({ html }: { html: string }) {
  return (
    <div className="rounded-2xl border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-[#0f766e]">
        <Lightbulb size={16} />
        <p className="font-display text-xs font-semibold uppercase tracking-widest">Ejemplo práctico</p>
      </div>
      <RichContent html={html} size="sm" />
    </div>
  );
}
