import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BABaselineEntry, DAY_LABELS, HOURS } from "@/lib/baTypes";
import { GlassCard } from "@/components/pack/GlassCard";

export function BACalendarModal({
  programId,
  open,
  onClose,
  embedded = false,
}: {
  programId: string;
  open?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BABaselineEntry[]>([]);
  const [editing, setEditing] = useState<{ day: number; hour: number; existing?: BABaselineEntry } | null>(null);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ba_baseline_entries" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", programId);
    setEntries((data as any) ?? []);
  };

  useEffect(() => {
    if (open === false) return;
    refresh();
  }, [user, programId, open]);

  const findEntry = (day: number, hour: number) =>
    entries.find((e) => e.day_of_week === day && e.hour === hour);

  const gridTable = (
    <table className="w-full border-collapse text-xs">
      <thead className="sticky top-0 z-20 bg-white">
        <tr>
          <th className="sticky left-0 top-0 z-30 bg-white p-2 text-left font-display font-bold text-[#101927]">Hora</th>
          {DAY_LABELS.map((d, i) => (
            <th key={i} className="min-w-[110px] bg-white p-2 text-left font-display font-bold text-[#101927]">
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {HOURS.map((h) => (
          <tr key={h} className="border-t border-[#101927]/5">
            <td className="sticky left-0 z-10 bg-white p-2 align-top font-bold text-[#7cc2c8]">
              {String(h).padStart(2, "0")}:00
            </td>
            {DAY_LABELS.map((_, dayIdx) => {
              const e = findEntry(dayIdx, h);
              return (
                <td key={dayIdx} className="p-1.5 align-top">
                  <button
                    onClick={() => setEditing({ day: dayIdx, hour: h, existing: e })}
                    className={`flex h-20 w-full flex-col justify-center rounded-xl border ${
                      e
                        ? "border-[#facb60]/40 bg-[#facb60]/8 p-2 text-left"
                        : "border-dashed border-[#101927]/15 bg-white items-center justify-center text-[#101927]/30 hover:border-[#facb60]"
                    }`}
                  >
                    {e ? (
                      <>
                        <p className="line-clamp-2 text-[11px] font-semibold text-[#101927]">{e.activity}</p>
                        <p className="line-clamp-1 text-[10px] text-[#101927]/55">{e.emotion}</p>
                        <div className="mt-1 flex gap-2 text-[10px] font-bold">
                          <span className="text-[#facb60]">D:{e.dominio}</span>
                          <span className="text-[#7cc2c8]">A:{e.agrado}</span>
                        </div>
                      </>
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const embeddedGrid = (
    <div className="max-h-[55vh] overflow-auto rounded-2xl border border-[#101927]/10 bg-white">
      {gridTable}
    </div>
  );

  const modalGrid = (
    <div className="flex-1 overflow-auto px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl">{gridTable}</div>
    </div>
  );


  if (embedded) {
    return (
      <>
        {embeddedGrid}

        {editing && (
          <EntryEditor
            day={editing.day}
            hour={editing.hour}
            existing={editing.existing}
            programId={programId}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refresh();
            }}
          />
        )}
      </>
    );
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#fdfbfb]">
      <header className="shrink-0 border-b border-[#101927]/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <p className="font-display text-sm font-bold text-[#101927]">Calendario de Dominio y Agrado</p>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/10 bg-white shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
      </header>
      {modalGrid}

      {editing && (
        <EntryEditor
          day={editing.day}
          hour={editing.hour}
          existing={editing.existing}
          programId={programId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function EntryEditor({
  day,
  hour,
  existing,
  programId,
  onClose,
  onSaved,
}: {
  day: number;
  hour: number;
  existing?: BABaselineEntry;
  programId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [activity, setActivity] = useState(existing?.activity ?? "");
  const [emotion, setEmotion] = useState(existing?.emotion ?? "");
  const [intensity, setIntensity] = useState(existing?.intensity ?? 5);
  const [dominio, setDominio] = useState(existing?.dominio ?? 5);
  const [agrado, setAgrado] = useState(existing?.agrado ?? 5);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("ba_baseline_entries" as any).upsert(
      {
        user_id: user.id,
        program_id: programId,
        day_of_week: day,
        hour,
        activity,
        emotion,
        intensity,
        dominio,
        agrado,
      },
      { onConflict: "user_id,program_id,day_of_week,hour" }
    );
    setSaving(false);
    onSaved();
  };

  const remove = async () => {
    if (!existing?.id) {
      onClose();
      return;
    }
    await supabase.from("ba_baseline_entries" as any).delete().eq("id", existing.id);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/30 p-3 sm:items-center">
      <GlassCard className="w-full max-w-md p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-bold">
            {DAY_LABELS[day]} · {String(hour).padStart(2, "0")}:00
          </p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#101927]/10">
            <X size={16} />
          </button>
        </div>

        <label className="text-[11px] font-bold uppercase tracking-wider text-[#101927]/55">Actividad</label>
        <input
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Caminar con mi hermano"
          className="mt-1 w-full rounded-xl border border-[#101927]/10 bg-white px-3 py-2.5 text-sm shadow-inner outline-none focus:border-[#facb60]"
        />

        <label className="mt-3 block text-[11px] font-bold uppercase tracking-wider text-[#101927]/55">Emoción</label>
        <input
          value={emotion}
          onChange={(e) => setEmotion(e.target.value)}
          placeholder="Calma, alegría leve…"
          className="mt-1 w-full rounded-xl border border-[#101927]/10 bg-white px-3 py-2.5 text-sm shadow-inner outline-none focus:border-[#facb60]"
        />

        <label className="mt-3 block text-[11px] font-bold uppercase tracking-wider text-[#101927]/55">
          Intensidad emocional (1-10)
        </label>
        <input
          type="number"
          min={1}
          max={10}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value) || 0)}
          className="mt-1 w-full rounded-xl border border-[#101927]/10 bg-white px-3 py-2.5 text-sm shadow-inner outline-none focus:border-[#facb60]"
        />

        <div className="mt-4 space-y-3">
          <SliderField label="Dominio (Logro)" color="#facb60" value={dominio} onChange={setDominio} />
          <SliderField label="Agrado (Placer)" color="#7cc2c8" value={agrado} onChange={setAgrado} />
        </div>

        <div className="mt-5 flex gap-2">
          {existing?.id && (
            <button onClick={remove} className="flex-1 rounded-full border border-[#101927]/10 py-3 text-xs font-bold text-rose-600">
              Eliminar
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-full bg-[#101927] py-3 text-xs font-bold text-white"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

function SliderField({ label, color, value, onChange }: { label: string; color: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="font-display text-lg font-bold" style={{ color }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}
