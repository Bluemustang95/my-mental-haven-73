import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AMBIENT_SOUNDS, CATEGORY_LABELS, type AmbientCategory } from "@/lib/ambientLibrary";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentId: string;
  onPick: (id: string) => void;
}

const CATEGORIES: AmbientCategory[] = ["ninguno", "lluvia", "viento", "agua", "naturaleza", "abstractos"];

export function AmbientSoundSheet({ open, onOpenChange, currentId, onPick }: Props) {
  const grouped = CATEGORIES.map((cat) => ({
    cat,
    label: CATEGORY_LABELS[cat],
    items: AMBIENT_SOUNDS.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#0F172A] text-white border-white/10"
      >
        <SheetHeader>
          <SheetTitle className="text-white font-display">Elegí el sonido ambiente</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-5 pb-8">
          {grouped.map((g) => (
            <div key={g.cat}>
              <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.2em] text-white/40">{g.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {g.items.map((s) => {
                  const active = currentId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        onPick(s.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition",
                        active
                          ? "border-white/40 bg-white/15"
                          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                      )}
                    >
                      <span className="font-medium">{s.label}</span>
                      {active && <Check size={14} className="text-white/80" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
