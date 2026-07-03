import { Lightbulb } from "lucide-react";
import { stripDefaultBlackColor } from "@/lib/richTextSanitize";

export function ExampleBlock({ html }: { html: string }) {
  const clean = stripDefaultBlackColor(html);
  return (
    <div className="rounded-2xl border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-[#0f766e]">
        <Lightbulb size={16} />
        <p className="font-display text-xs font-semibold uppercase tracking-widest">Ejemplo práctico</p>
      </div>
      <div
        className="prose prose-slate prose-sm max-w-none prose-p:my-1.5 prose-p:text-[#101927]/85 prose-strong:text-[#101927] prose-a:text-[#0f766e]"
        dangerouslySetInnerHTML={{ __html: clean || "" }}
      />
    </div>
  );
}
