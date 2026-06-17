import { useMemo, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

const TEAL = "#7cc2c8";
const INK = "#101927";

const POPULAR = [
  { code: "AR", label: "Argentina", flag: "🇦🇷" },
  { code: "MX", label: "México", flag: "🇲🇽" },
  { code: "ES", label: "España", flag: "🇪🇸" },
  { code: "CO", label: "Colombia", flag: "🇨🇴" },
  { code: "CL", label: "Chile", flag: "🇨🇱" },
  { code: "UY", label: "Uruguay", flag: "🇺🇾" },
];

const ALL = [
  { code: "AR", label: "Argentina", flag: "🇦🇷" },
  { code: "BO", label: "Bolivia", flag: "🇧🇴" },
  { code: "BR", label: "Brasil", flag: "🇧🇷" },
  { code: "CL", label: "Chile", flag: "🇨🇱" },
  { code: "CO", label: "Colombia", flag: "🇨🇴" },
  { code: "CR", label: "Costa Rica", flag: "🇨🇷" },
  { code: "CU", label: "Cuba", flag: "🇨🇺" },
  { code: "DO", label: "República Dominicana", flag: "🇩🇴" },
  { code: "EC", label: "Ecuador", flag: "🇪🇨" },
  { code: "SV", label: "El Salvador", flag: "🇸🇻" },
  { code: "ES", label: "España", flag: "🇪🇸" },
  { code: "US", label: "Estados Unidos", flag: "🇺🇸" },
  { code: "GT", label: "Guatemala", flag: "🇬🇹" },
  { code: "HN", label: "Honduras", flag: "🇭🇳" },
  { code: "MX", label: "México", flag: "🇲🇽" },
  { code: "NI", label: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", label: "Panamá", flag: "🇵🇦" },
  { code: "PY", label: "Paraguay", flag: "🇵🇾" },
  { code: "PE", label: "Perú", flag: "🇵🇪" },
  { code: "PR", label: "Puerto Rico", flag: "🇵🇷" },
  { code: "UY", label: "Uruguay", flag: "🇺🇾" },
  { code: "VE", label: "Venezuela", flag: "🇻🇪" },
  { code: "CA", label: "Canadá", flag: "🇨🇦" },
  { code: "FR", label: "Francia", flag: "🇫🇷" },
  { code: "DE", label: "Alemania", flag: "🇩🇪" },
  { code: "IT", label: "Italia", flag: "🇮🇹" },
  { code: "PT", label: "Portugal", flag: "🇵🇹" },
  { code: "GB", label: "Reino Unido", flag: "🇬🇧" },
  { code: "OT", label: "Otro país", flag: "🌎" },
];

export function CountryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL;
    return ALL.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  if (!showAll) {
    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          {POPULAR.map((p) => {
            const selected = value === p.code;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => onChange(p.code)}
                className="flex items-center gap-2.5 rounded-2xl border bg-white/70 px-3.5 py-3 text-left text-[13px] font-semibold backdrop-blur-xl transition active:scale-[0.98]"
                style={{
                  color: INK,
                  borderColor: selected ? TEAL : "rgba(16,25,39,0.07)",
                  boxShadow: selected
                    ? "0 8px 24px -10px rgba(124,194,200,0.5)"
                    : "0 4px 16px rgba(16,25,39,0.04)",
                }}
              >
                <span className="text-lg leading-none">{p.flag}</span>
                <span className="truncate">{p.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#101927]/15 bg-white/40 py-3 text-[13px] font-semibold backdrop-blur-xl transition active:scale-[0.99]"
          style={{ color: INK }}
        >
          🌎 Ver todos los países <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div
        className="flex items-center gap-2 rounded-2xl border border-[#101927]/5 bg-white/80 px-4 py-3 shadow-glass backdrop-blur-xl"
      >
        <Search className="h-4 w-4 text-[#101927]/40" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscá tu país…"
          className="flex-1 bg-transparent text-[14px] font-medium text-[#101927] placeholder:text-[#101927]/35 focus:outline-none"
        />
      </div>
      <div className="max-h-[42vh] space-y-1.5 overflow-y-auto rounded-2xl bg-white/40 p-2 backdrop-blur-xl">
        {filtered.map((c) => {
          const selected = value === c.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => onChange(c.code)}
              className="flex w-full items-center gap-3 rounded-xl border bg-white/70 px-3.5 py-2.5 text-left text-[13.5px] font-medium transition active:scale-[0.99]"
              style={{
                color: INK,
                borderColor: selected ? TEAL : "rgba(16,25,39,0.05)",
              }}
            >
              <span className="text-lg leading-none">{c.flag}</span>
              <span className="flex-1 truncate">{c.label}</span>
              {selected && <Check className="h-4 w-4" style={{ color: TEAL }} />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-[#101927]/50">
            No encontramos ese país.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setShowAll(false);
          setQuery("");
        }}
        className="block w-full text-center text-xs font-semibold text-[#101927]/55 underline underline-offset-4"
      >
        Volver a los más comunes
      </button>
    </div>
  );
}
