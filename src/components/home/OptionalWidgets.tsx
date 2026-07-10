import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import { useHabits, computeStreak } from "@/hooks/useHabits";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import { LINE_ICONS } from "@/lib/habitsIcons";
import { WIDGET_IDENTITY } from "@/components/home/WidgetVisual";
import { InteractiveTile } from "@/components/home/InteractiveTile";
import { QuickCaptureSheet } from "@/components/home/QuickCaptureSheet";
import { toast } from "sonner";

// ────────────── Mini hábitos ──────────────
export function MiniHabitsWidget() {
  const navigate = useNavigate();
  const { habits, completions, toggle } = useHabits();
  const today = localDateStr();
  const ident = WIDGET_IDENTITY.mini_habits;

  const items = habits.slice(0, 8);

  return (
    <InteractiveTile
      id="mini_habits"
      items={items}
      onNavigate={() => navigate("/diario-inteligente/gestion-pensamientos/habitos")}
      emptyState={
        <button
          onClick={() => navigate("/diario-inteligente/gestion-pensamientos/habitos")}
          className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#101927]"
        >
          Crear hábito
        </button>
      }
      renderItem={(h) => {
        const done = completions.some((c) => c.habit_id === h.id && c.completed_date === today);
        const streak = computeStreak(completions, h.id);
        const icon = (() => {
          if (h.icon_type === "line") {
            const found = LINE_ICONS.find((i) => i.id === h.icon);
            if (found) {
              const Ic = found.Icon;
              return <Ic size={16} strokeWidth={1.8} style={{ color: ident.ink }} />;
            }
          }
          return <span className="text-[15px]">{h.icon}</span>;
        })();
        return (
          <div className="flex h-full items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/60"
                  style={{ color: ident.ink }}
                >
                  {icon}
                </div>
                <p
                  className="truncate font-display text-[12.5px] font-bold leading-tight"
                  style={{ color: ident.ink }}
                >
                  {h.name}
                </p>
              </div>
              <p className="mt-1 text-[10.5px] font-semibold" style={{ color: ident.ink, opacity: 0.75 }}>
                🔥 {streak}d racha
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggle(h.id, today); }}
              aria-label="Marcar hoy"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-90"
              style={{
                background: done ? h.color : "rgba(255,255,255,0.55)",
                boxShadow: done ? `0 4px 12px -4px ${h.color}` : undefined,
              }}
            >
              <Check
                size={16}
                strokeWidth={3}
                style={{ color: done ? "#101927" : ident.ink, opacity: done ? 1 : 0.5 }}
              />
            </button>
          </div>
        );
      }}
    />
  );
}

// ────────────── Gratitud (quick capture → journal_entries) ──────────────
function useQuickJournal(prompt: string) {
  const { user } = useAuth();
  return async (text: string) => {
    if (!user) return;
    const today = localDateStr();
    await supabase.from("journal_entries").insert({
      user_id: user.id,
      entry_date: today,
      content: text,
      prompt,
    });
  };
}

function QuickCaptureTile({
  id,
  prompt,
  sheetTitle,
  placeholder,
  navigateTo,
}: {
  id: "gratitude" | "contention_notes";
  prompt: string;
  sheetTitle: string;
  placeholder: string;
  navigateTo: string;
}) {
  const navigate = useNavigate();
  const [openSheet, setOpenSheet] = useState(false);
  const save = useQuickJournal(prompt);
  const ident = WIDGET_IDENTITY[id];

  return (
    <>
      <InteractiveTile
        id={id}
        items={[0]}
        onNavigate={() => navigate(navigateTo)}
        renderItem={() => (
          <div className="flex h-full flex-col items-start justify-end gap-2">
            <p
              className="text-[11.5px] font-medium leading-snug"
              style={{ color: ident.ink, opacity: 0.85 }}
            >
              Anotá algo breve para hoy.
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setOpenSheet(true); }}
              className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-[11.5px] font-semibold text-[#101927] active:scale-95"
            >
              <Plus size={12} strokeWidth={3} /> Añadir
            </button>
          </div>
        )}
      />
      <QuickCaptureSheet
        open={openSheet}
        onClose={() => setOpenSheet(false)}
        onSubmit={async (text) => { await save(text); }}
        title={sheetTitle}
        placeholder={placeholder}
        accent={ident.to}
      />
    </>
  );
}

export function GratitudeWidget() {
  return (
    <QuickCaptureTile
      id="gratitude"
      prompt="Gratitud"
      sheetTitle="¿Por qué agradecés hoy?"
      placeholder="Algo pequeño o grande..."
      navigateTo="/diario"
    />
  );
}

export function ContentionNotesWidget() {
  return (
    <QuickCaptureTile
      id="contention_notes"
      prompt="Contención"
      sheetTitle="Nota de contención"
      placeholder="Palabras que te sostengan..."
      navigateTo="/diario"
    />
  );
}
