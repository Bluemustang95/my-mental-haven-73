import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Shield, HeartPulse, NotebookPen, ClipboardList, Activity, Target, BookHeart, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useResumenData } from "@/hooks/useResumenData";
import { buildReport, countSelected, type Selection, type CategoryId } from "@/components/resumen/reportBuilder";
import { CategoryAccordion, type Item } from "@/components/resumen/CategoryAccordion";
import { LoadingScreen } from "@/components/resumen/LoadingScreen";
import { ReportEditor } from "@/components/resumen/ReportEditor";

const fmt = (d: string) => format(new Date(d), "d MMM", { locale: es });

const moodTxt = (m: number | null) => (m == null ? "sin registro" : `${m}/5`);

export default function ResumenPsico() {
  const navigate = useNavigate();
  const { data, loading } = useResumenData();
  const [screen, setScreen] = useState<"select" | "loading" | "editor">("select");
  const [selection, setSelection] = useState<Selection>({});
  const [reportText, setReportText] = useState("");

  const items = useMemo(() => {
    if (!data) return null;
    return {
      checkins: data.checkins.map<Item>(c => ({
        id: c.id,
        label: `${fmt(c.date)} · ánimo ${moodTxt(c.mood)}`,
        sub: c.note || (c.emotions?.length ? c.emotions.join(", ") : undefined),
      })),
      notes: [
        ...data.prepNotes.map<Item>(n => ({ id: `prep-${n.id}`, label: `Nota (${fmt(n.created_at)})`, sub: n.note })),
        ...data.sessionNotes.map<Item>(n => ({ id: `sess-${n.id}`, label: `Sesión (${fmt(n.session_date)})`, sub: n.note })),
      ],
      tests: data.tests.map<Item>(t => ({
        id: t.id,
        label: `${t.type} · ${t.score} pts`,
        sub: `${t.severity ?? "resultado registrado"} · ${fmt(t.created_at)}`,
      })),
      resources: [
        { id: "exercises", label: "Ejercicios de mindfulness", sub: `${data.exerciseSessions} sesiones` },
        { id: "habits", label: "Hábitos completados", sub: `${data.habitCompletions} registros` },
        { id: "dbt", label: "Regulación emocional (DBT)", sub: `${data.dbtSessions} sesiones` },
        { id: "thoughts", label: "Registros de pensamientos", sub: `${data.thoughtRecords} entradas` },
        {
          id: "meds",
          label: "Medicación",
          sub: `${data.medicationLogs.taken}/${data.medicationLogs.total} tomas`,
        },
      ].filter(r => {
        if (r.id === "exercises") return data.exerciseSessions > 0;
        if (r.id === "habits") return data.habitCompletions > 0;
        if (r.id === "dbt") return data.dbtSessions > 0;
        if (r.id === "thoughts") return data.thoughtRecords > 0;
        if (r.id === "meds") return data.medicationLogs.total > 0;
        return true;
      }) as Item[],
      goals: data.goals.map<Item>(g => ({
        id: g.id,
        label: g.text,
        sub: g.completed ? "Cumplido" : "En curso",
      })),
      journal: data.journal.map<Item>(j => ({
        id: j.id,
        label: `${fmt(j.date)}${j.prompt ? ` · ${j.prompt}` : ""}`,
        sub: j.content,
      })),
    };
  }, [data]);

  const total = countSelected(selection);

  const toggleCategory = (cat: CategoryId, v: boolean) => {
    setSelection(prev => ({
      ...prev,
      [cat]: { enabled: v, items: prev[cat]?.items ?? {} },
    }));
  };

  const toggleItem = (cat: CategoryId, id: string, v: boolean) => {
    setSelection(prev => ({
      ...prev,
      [cat]: {
        enabled: v ? true : prev[cat]?.enabled ?? true,
        items: { ...(prev[cat]?.items ?? {}), [id]: v },
      },
    }));
  };

  const generate = () => {
    if (!data) return;
    setScreen("loading");
    setTimeout(() => {
      setReportText(buildReport(selection, data));
      setScreen("editor");
    }, 1700);
  };

  const cats: {
    id: CategoryId;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    empty: string;
  }[] = [
    { id: "checkins", title: "Estado de ánimo", subtitle: "check-ins diarios", icon: <HeartPulse size={17} />, empty: "Sin check-ins esta semana" },
    { id: "notes", title: "Notas para sesión", subtitle: "temas a hablar", icon: <NotebookPen size={17} />, empty: "Sin notas guardadas" },
    { id: "tests", title: "Inventarios y Tests", subtitle: "resultados clínicos", icon: <ClipboardList size={17} />, empty: "Sin tests recientes" },
    { id: "resources", title: "Uso de recursos", subtitle: "actividad en la app", icon: <Activity size={17} />, empty: "Sin actividad registrada" },
    { id: "goals", title: "Objetivos semanales", subtitle: "compromisos", icon: <Target size={17} />, empty: "Sin objetivos esta semana" },
    { id: "journal", title: "Fragmentos del diario", subtitle: "solo destacados ★", icon: <BookHeart size={17} />, empty: "Marcá entradas con ★ para verlas" },
  ];

  return (
    <div className="relative min-h-screen bg-[#f9f9fb]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-14">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => (screen === "select" ? navigate(-1) : setScreen("select"))}
            className="rounded-xl p-1.5 active:bg-black/5"
          >
            <ArrowLeft size={22} className="text-[#0f172a]" />
          </button>
          <div>
            <h1 className="font-display text-[17px] font-semibold text-[#0f172a]">Resumen para mi Psico</h1>
            <p className="text-[11.5px] text-[#64748b]">Últimos 7 días · elegí qué compartir</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {screen === "select" && (
          <motion.div
              key="select"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex-1 pb-32"
            >
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-[#7cc2c8]/25 bg-[#7cc2c8]/10 p-3.5">
                <Shield size={16} className="mt-0.5 shrink-0 text-[#0e7c8a]" />
                <p className="text-[11.5px] leading-relaxed text-[#0f172a]">
                  <strong>Solo se envía lo que marques.</strong> Nada se comparte sin tu confirmación.
                </p>
              </div>

              {loading || !items ? (
                <div className="flex justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7cc2c8] border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-3">
                  {cats.map(c => (
                    <CategoryAccordion
                      key={c.id}
                      icon={c.icon}
                      title={c.title}
                      subtitle={c.subtitle}
                      items={items[c.id]}
                      enabled={!!selection[c.id]?.enabled}
                      selectedItems={selection[c.id]?.items ?? {}}
                      onToggleCategory={(v) => toggleCategory(c.id, v)}
                      onToggleItem={(id, v) => toggleItem(c.id, id, v)}
                      emptyText={c.empty}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {screen === "loading" && <LoadingScreen key="loading" />}

          {screen === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1"
            >
              <ReportEditor initialText={reportText} displayName={data?.displayName ?? "Paciente"} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {screen === "select" && (
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/5 bg-white/95 px-5 pb-6 pt-3 backdrop-blur-xl">
          <div className="mx-auto max-w-md">
            <button
              onClick={generate}
              disabled={total === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7cc2c8] py-3.5 font-display text-[13.5px] font-semibold text-white shadow-[0_6px_20px_rgba(124,194,200,0.35)] transition-opacity disabled:opacity-40 disabled:shadow-none"
            >
              <Sparkles size={16} />
              {total === 0 ? "Seleccioná al menos un ítem" : `Generar resumen (${total})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
