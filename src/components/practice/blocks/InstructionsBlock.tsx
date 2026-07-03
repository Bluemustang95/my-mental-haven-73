import { stripDefaultBlackColor } from "@/lib/richTextSanitize";

export function InstructionsBlock({ html }: { html: string }) {
  const clean = stripDefaultBlackColor(html);
  return (
    <div
      className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-strong:text-white prose-a:text-emerald-300 [&_*:not([style*='color'])]:text-white/85"
      dangerouslySetInnerHTML={{ __html: clean || "<p class='text-white/50'>Sin instrucciones.</p>" }}
    />
  );
}
