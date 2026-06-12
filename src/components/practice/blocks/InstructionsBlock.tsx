export function InstructionsBlock({ html }: { html: string }) {
  return (
    <div
      className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-strong:text-white prose-a:text-emerald-300"
      dangerouslySetInnerHTML={{ __html: html || "<p class='text-white/50'>Sin instrucciones.</p>" }}
    />
  );
}
