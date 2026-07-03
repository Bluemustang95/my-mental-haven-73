import { stripDefaultBlackColor } from "@/lib/richTextSanitize";

export function InstructionsBlock({ html }: { html: string }) {
  const clean = stripDefaultBlackColor(html);
  return (
    <div
      className="prose prose-slate prose-sm max-w-none prose-headings:font-display prose-headings:text-[#101927] prose-p:text-[#101927]/85 prose-strong:text-[#101927] prose-a:text-[#0f766e] prose-li:text-[#101927]/85"
      dangerouslySetInnerHTML={{ __html: clean || "<p class='text-[#101927]/50'>Sin instrucciones.</p>" }}
    />
  );
}
