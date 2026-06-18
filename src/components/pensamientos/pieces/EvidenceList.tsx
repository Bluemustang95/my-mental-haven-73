import { useState } from "react";
import { Plus, X } from "lucide-react";

type Props = {
  items: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  tone: "favor" | "contra";
  title: string;
  emptyHint: string;
};

export default function EvidenceList({
  items, onAdd, onRemove, placeholder, tone, title, emptyHint,
}: Props) {
  const [value, setValue] = useState("");

  const toneClasses =
    tone === "favor"
      ? {
          card: "border-[#FCA5A5]/40 bg-[#FCA5A5]/10",
          title: "text-[#9b1c1c]",
          btn: "bg-[#FCA5A5] text-white",
          chip: "bg-[#FCA5A5]/20 text-[#9b1c1c] border-[#FCA5A5]/40",
        }
      : {
          card: "border-[#A7F3D0]/50 bg-[#A7F3D0]/10",
          title: "text-[#065f46]",
          btn: "bg-[#34D399] text-white",
          chip: "bg-[#A7F3D0]/30 text-[#065f46] border-[#A7F3D0]/50",
        };

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };

  return (
    <div className={`rounded-3xl border ${toneClasses.card} p-3`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${toneClasses.title}`}>
        {title}
      </p>
      <div className="mt-2 flex gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-white/80 bg-white px-3 py-2 text-[12.5px] text-[#101927] placeholder:text-[#101927]/40 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button
          onClick={submit}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClasses.btn} active:scale-95 transition`}
        >
          <Plus size={16} />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-2 text-[11px] italic text-[#101927]/45">{emptyHint}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${toneClasses.chip}`}
            >
              {it}
              <button onClick={() => onRemove(i)} className="opacity-60 hover:opacity-100">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
