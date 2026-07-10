import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Play, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InteractiveTile } from "@/components/home/InteractiveTile";
import { WIDGET_IDENTITY } from "@/components/home/WidgetVisual";
import type { WidgetId } from "@/components/home/WidgetsBoard";
import FollowupCompleteSheet from "@/components/pensamientos/FollowupCompleteSheet";
import { localDateStr } from "@/lib/utils";

type Followup = { id: string; title: string; type: string; due_date: string | null; status: string };

// ─────────── Pensamientos: tareas pendientes con swipe + check ───────────
export function PensamientosQuickWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Followup[]>([]);
  const [active, setActive] = useState<Followup | null>(null);
  const ident = WIDGET_IDENTITY.pensamientos_quick;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("thought_followups")
      .select("id,title,type,due_date,status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("due_date", { ascending: true })
      .limit(5);
    setItems((data ?? []) as any);
  };
  useEffect(() => { load(); }, [user?.id]);

  return (
    <>
      <InteractiveTile
        id="pensamientos_quick"
        items={items}
        onNavigate={() => navigate("/herramientas/pensamientos")}
        emptyState={
          <div className="text-center">
            <p className="text-[12px] font-semibold" style={{ color: ident.ink }}>Todo al día ✓</p>
            <p className="mt-0.5 text-[10.5px]" style={{ color: ident.ink, opacity: 0.75 }}>Sin pendientes</p>
          </div>
        }
        renderItem={(it) => (
          <div className="flex h-full items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-display text-[12.5px] font-bold leading-tight" style={{ color: ident.ink }}>
                {it.title}
              </p>
              {it.due_date && (
                <p className="mt-1 text-[10.5px]" style={{ color: ident.ink, opacity: 0.7 }}>
                  Para {it.due_date}
                </p>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setActive(it); }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 active:scale-90"
              aria-label="Completar"
            >
              <Check size={16} strokeWidth={3} style={{ color: ident.ink }} />
            </button>
          </div>
        )}
      />
      <FollowupCompleteSheet
        followup={active}
        onClose={() => setActive(null)}
        onDone={() => { setActive(null); load(); }}
      />
    </>
  );
}

// ─────────── Continuar / info tile con acción play ───────────
function ContinuePlayTile({
  id,
  label,
  detail,
  onPlay,
  onNavigate,
}: {
  id: WidgetId;
  label: string | null;
  detail?: string;
  onPlay: () => void;
  onNavigate: () => void;
}) {
  const ident = WIDGET_IDENTITY[id];
  return (
    <InteractiveTile
      id={id}
      items={label ? [0] : []}
      onNavigate={onNavigate}
      emptyState={
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(); }}
          className="rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-[#101927]"
        >
          Explorar
        </button>
      }
      renderItem={() => (
        <div className="flex h-full items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ident.ink, opacity: 0.7 }}>
              Continuar
            </p>
            <p className="line-clamp-2 font-display text-[12.5px] font-bold leading-tight" style={{ color: ident.ink }}>
              {label}
            </p>
            {detail && (
              <p className="mt-0.5 truncate text-[10.5px]" style={{ color: ident.ink, opacity: 0.72 }}>
                {detail}
              </p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/85 active:scale-90"
            aria-label="Continuar"
          >
            <Play size={16} strokeWidth={2.6} style={{ color: ident.ink, marginLeft: 2 }} />
          </button>
        </div>
      )}
    />
  );
}

// ─────────── Psicoeducación: última lección accedida ───────────
export function PsicoQuickWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<{ id: string; title: string; percent: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prog } = await supabase
        .from("content_progress")
        .select("content_id, progress_percent, last_accessed, completed")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("last_accessed", { ascending: false })
        .limit(1);
      const p: any = (prog ?? [])[0];
      if (!p) { setLesson(null); return; }
      const { data: c } = await supabase
        .from("psychoeducation_content")
        .select("id,title")
        .eq("id", p.content_id)
        .maybeSingle();
      if (c) setLesson({ id: c.id as string, title: c.title as string, percent: p.progress_percent ?? 0 });
    })();
  }, [user?.id]);

  return (
    <ContinuePlayTile
      id="psico_quick"
      label={lesson?.title ?? null}
      detail={lesson ? `${lesson.percent}% leído` : undefined}
      onPlay={() => lesson && navigate(`/herramientas/contenido/leccion/${lesson.id}`)}
      onNavigate={() => navigate("/psicoeducacion")}
    />
  );
}

// ─────────── Pack: día actual ───────────
export function PackQuickWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<{ day: number; state: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("ba_programs")
        .select("current_day, state")
        .eq("user_id", user.id)
        .maybeSingle();
      const p: any = data;
      if (p?.state) setState({ day: p.current_day ?? 1, state: p.state });
    })();
  }, [user?.id]);

  return (
    <ContinuePlayTile
      id="pack_quick"
      label={state ? `Día ${state.day} del pack` : null}
      detail={state?.state === "completed" ? "Completado" : "En curso"}
      onPlay={() => navigate("/herramientas/pack")}
      onNavigate={() => navigate("/herramientas/pack")}
    />
  );
}

// ─────────── Mindfulness: última práctica ───────────
export function MindfulnessQuickWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [last, setLast] = useState<{ label: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("exercise_sessions")
        .select("exercise_name, exercise_type")
        .eq("user_id", user.id)
        .eq("exercise_type", "mindfulness")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const d: any = data;
      if (d?.exercise_name) setLast({ label: d.exercise_name });
    })();
  }, [user?.id]);

  return (
    <ContinuePlayTile
      id="mindfulness_quick"
      label={last?.label ?? "Respiración 4-7-8"}
      detail="Práctica breve"
      onPlay={() => navigate("/herramientas/mindfulness/respiracion")}
      onNavigate={() => navigate("/herramientas/mindfulness")}
    />
  );
}

// ─────────── Diario: entry de hoy ───────────
export function DiarioQuickWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasToday, setHasToday] = useState<boolean | null>(null);
  const ident = WIDGET_IDENTITY.diario_quick;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = localDateStr();
      const { data } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .limit(1);
      setHasToday((data ?? []).length > 0);
    })();
  }, [user?.id]);

  return (
    <InteractiveTile
      id="diario_quick"
      items={[0]}
      onNavigate={() => navigate("/diario")}
      renderItem={() => (
        <div className="flex h-full items-center gap-2">
          <div className="min-w-0 flex-1">
            {hasToday ? (
              <>
                <p className="flex items-center gap-1 font-display text-[12.5px] font-bold" style={{ color: ident.ink }}>
                  <Check size={14} strokeWidth={3} /> Registrado hoy
                </p>
                <p className="mt-0.5 text-[10.5px]" style={{ color: ident.ink, opacity: 0.7 }}>
                  Ver o editar tu entrada
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-[12.5px] font-bold" style={{ color: ident.ink }}>
                  Escribir hoy
                </p>
                <p className="mt-0.5 text-[10.5px]" style={{ color: ident.ink, opacity: 0.7 }}>
                  Un espacio para ordenar tu día
                </p>
              </>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate("/diario"); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/85 active:scale-90"
            aria-label="Abrir diario"
          >
            <ChevronRight size={18} style={{ color: ident.ink }} />
          </button>
        </div>
      )}
    />
  );
}

// ─────────── Sleep zone: continuar donde estabas ───────────
export function SleepZoneWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lastLog, setLastLog] = useState<{ date: string; score: number | null } | null>(null);
  const ident = WIDGET_IDENTITY.sleep_zone;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("sleep_log")
        .select("log_date, sleep_quality")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      const d: any = data;
      if (d) setLastLog({ date: d.log_date, score: d.sleep_quality ?? null });
    })();
  }, [user?.id]);

  const today = localDateStr();
  const yesterday = localDateStr(new Date(Date.now() - 86400000));
  const needsLog = !lastLog || (lastLog.date !== today && lastLog.date !== yesterday);
  const label = needsLog ? "Registrar sueño" : "Zona de descanso";
  const detail = lastLog ? `Último: ${lastLog.date}${lastLog.score ? ` · ${lastLog.score}/5` : ""}` : "Refugio nocturno";

  return (
    <InteractiveTile
      id="sleep_zone"
      size="full"
      items={[0]}
      onNavigate={() => navigate("/herramientas/sueno")}
      renderItem={() => (
        <div className="flex h-full items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[14px] font-bold leading-tight" style={{ color: ident.ink }}>
              {label}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: ident.ink, opacity: 0.78 }}>
              {detail}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate("/herramientas/sueno"); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm active:scale-90"
            aria-label="Abrir"
          >
            <Play size={16} strokeWidth={2.6} style={{ color: ident.ink, marginLeft: 2 }} />
          </button>
        </div>
      )}
    />
  );
}
