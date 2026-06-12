export function FreeTextBlock({
  prompt,
  placeholder,
  minChars,
  value,
  onChange,
}: {
  prompt: string;
  placeholder?: string;
  minChars?: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const remaining = minChars ? Math.max(0, minChars - (value?.length ?? 0)) : 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-2 text-sm font-medium text-white">{prompt}</p>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:outline-none"
      />
      {minChars ? (
        <p className="mt-1 text-right text-[10px] text-white/45">
          {remaining > 0 ? `Faltan ${remaining} caracteres` : "Listo ✓"}
        </p>
      ) : null}
    </div>
  );
}
