import type { ProsConsAnswer, ProsConsCell } from "@/lib/practiceTypes";

const EMPTY: ProsConsCell = { text: "", suds: 0 };

function ensure(v: any): ProsConsAnswer {
  return {
    prosA: v?.prosA ?? EMPTY,
    consA: v?.consA ?? EMPTY,
    prosB: v?.prosB ?? EMPTY,
    consB: v?.consB ?? EMPTY,
  };
}

function Cell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ProsConsCell;
  onChange: (v: ProsConsCell) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
        {label}
      </p>
      <textarea
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        rows={3}
        className="mb-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:outline-none"
        placeholder="Escribí acá…"
      />
      <input
        type="range"
        min={0}
        max={100}
        value={value.suds}
        onChange={(e) => onChange({ ...value, suds: Number(e.target.value) })}
        className="w-full accent-emerald-500"
      />
      <div className="mt-0.5 flex justify-between text-[10px] text-white/55">
        <span>Intensidad</span>
        <span className="font-display font-bold text-emerald-300">{value.suds}/100</span>
      </div>
    </div>
  );
}

export function ProsConsBlock({
  labels,
  value,
  onChange,
}: {
  labels?: { rowA?: string; rowB?: string; colPros?: string; colCons?: string };
  value: ProsConsAnswer;
  onChange: (v: ProsConsAnswer) => void;
}) {
  const v = ensure(value);
  const rowA = labels?.rowA ?? "Practicar";
  const rowB = labels?.rowB ?? "No practicar";
  const colPros = labels?.colPros ?? "Pros";
  const colCons = labels?.colCons ?? "Contras";

  const diffA = (v.prosA.suds ?? 0) - (v.consA.suds ?? 0);
  const diffB = (v.prosB.suds ?? 0) - (v.consB.suds ?? 0);
  const net = diffA - diffB;

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 font-display text-xs font-semibold text-white/80">{rowA}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Cell label={colPros} value={v.prosA} onChange={(c) => onChange({ ...v, prosA: c })} />
          <Cell label={colCons} value={v.consA} onChange={(c) => onChange({ ...v, consA: c })} />
        </div>
      </div>
      <div>
        <p className="mb-2 font-display text-xs font-semibold text-white/80">{rowB}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Cell label={colPros} value={v.prosB} onChange={(c) => onChange({ ...v, prosB: c })} />
          <Cell label={colCons} value={v.consB} onChange={(c) => onChange({ ...v, consB: c })} />
        </div>
      </div>
      {(v.prosA.suds || v.consA.suds || v.prosB.suds || v.consB.suds) > 0 && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-200">
          Diferencia neta a favor de <b>{net >= 0 ? rowA.toLowerCase() : rowB.toLowerCase()}</b>:{" "}
          <span className="font-display font-bold">{Math.abs(net)} pts</span>
        </div>
      )}
    </div>
  );
}
