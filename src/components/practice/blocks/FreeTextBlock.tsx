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
    <div className="rounded-2xl border border-[#101927]/10 bg-white/70 p-4 backdrop-blur">
      <p className="mb-2 text-sm font-medium text-[#101927]">{prompt}</p>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-[#101927]/10 bg-white p-3 text-sm text-[#101927] placeholder:text-[#101927]/40 focus:border-[#7cc2c8] focus:outline-none"
      />
      {minChars ? (
        <p className="mt-1 text-right text-[10px] text-[#101927]/50">
          {remaining > 0 ? `Faltan ${remaining} caracteres` : "Listo ✓"}
        </p>
      ) : null}
    </div>
  );
}
