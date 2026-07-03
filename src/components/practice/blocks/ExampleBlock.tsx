import { Lightbulb } from "lucide-react";
import { stripDefaultBlackColor } from "@/lib/richTextSanitize";

export function ExampleBlock({ html }: { html: string }) {
  const clean = stripDefaultBlackColor(html);
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-emerald-300">
        <Lightbulb size={16} />
        <p className="font-display text-xs font-semibold uppercase tracking-widest">Ejemplo práctico</p>
      </div>
      <div
        className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 [&_*:not([style*='color'])]:text-white/85"
        dangerouslySetInnerHTML={{ __html: clean || "" }}
      />
    </div>
  );
}
