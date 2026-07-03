import { RichContent } from "@/components/psico/RichContent";

export function InstructionsBlock({ html }: { html: string }) {
  if (!html || !html.trim()) {
    return <p className="text-[#101927]/50 text-sm">Sin instrucciones.</p>;
  }
  return <RichContent html={html} size="sm" />;
}
