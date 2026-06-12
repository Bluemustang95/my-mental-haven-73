import { Lightbulb } from "lucide-react";

export function ExampleBlock({ html }: { html: string }) {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-emerald-300">
        <Lightbulb size={16} />
        <p className="font-display text-xs font-semibold uppercase tracking-widest">Ejemplo práctico</p>
      </div>
      <div
        className="prose prose-invert prose-sm max-w-none prose-p:my-1.5"
        dangerouslySetInnerHTML={{ __html: html || "" }}
      />
    </div>
  );
}
