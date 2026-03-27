import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarBlank, DownloadSimple } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SummaryData {
  displayName: string;
  moodAvg: number | null;
  moodEntries: { date: string; score: number }[];
  goals: { text: string; completed: boolean }[];
  highlighted: { date: string; content: string; prompt: string | null }[];
  tests: { type: string; score: number; severity: string | null; date: string }[];
}

export default function ResumenPsico() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [from, setFrom] = useState<Date>(subDays(new Date(), 7));
  const [to, setTo] = useState<Date>(new Date());
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const since = startOfDay(from).toISOString();
    const until = endOfDay(to).toISOString();

    const [profileRes, checkinsRes, goalsRes, journalRes, testsRes] = await Promise.all([
      supabase.from("patient_app_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("daily_checkins").select("checkin_date, mood_score").eq("user_id", user.id)
        .gte("created_at", since).lte("created_at", until).order("checkin_date"),
      supabase.from("weekly_goals").select("goal_text, completed").eq("user_id", user.id)
        .gte("created_at", since).lte("created_at", until),
      supabase.from("journal_entries").select("entry_date, content, prompt, created_at").eq("user_id", user.id)
        .eq("highlighted", true).gte("created_at", since).lte("created_at", until)
        .order("created_at", { ascending: false }),
      supabase.from("test_results").select("test_type, score, severity, created_at").eq("user_id", user.id)
        .gte("created_at", since).lte("created_at", until).order("created_at", { ascending: false }),
    ]);

    const checkins = (checkinsRes.data ?? []).filter(c => c.mood_score != null);
    const moodAvg = checkins.length > 0
      ? Math.round((checkins.reduce((s, c) => s + c.mood_score!, 0) / checkins.length) * 10) / 10
      : null;

    setData({
      displayName: profileRes.data?.display_name || "Usuario",
      moodAvg,
      moodEntries: checkins.map(c => ({
        date: format(new Date(c.checkin_date), "dd/MM", { locale: es }),
        score: c.mood_score!,
      })),
      goals: (goalsRes.data ?? []).map(g => ({ text: g.goal_text, completed: g.completed ?? false })),
      highlighted: (journalRes.data ?? []).map(j => ({
        date: format(new Date(j.entry_date || j.created_at!), "d MMM", { locale: es }),
        content: j.content,
        prompt: j.prompt,
      })),
      tests: (testsRes.data ?? []).map(t => ({
        type: t.test_type,
        score: t.score,
        severity: t.severity,
        date: format(new Date(t.created_at!), "dd/MM", { locale: es }),
      })),
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, from, to]);

  const moodLabel = (avg: number) => {
    if (avg <= 1.5) return "Muy bajo";
    if (avg <= 2.5) return "Bajo";
    if (avg <= 3.5) return "Moderado";
    if (avg <= 4.5) return "Bueno";
    return "Muy bueno";
  };

  const generatePDF = async () => {
    if (!data) return;
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      const margin = 18;
      const contentW = w - margin * 2;
      let y = 20;

      const addPage = () => { doc.addPage(); y = 20; };
      const checkY = (needed: number) => { if (y + needed > 270) addPage(); };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(16, 25, 39);
      doc.text("Bitácora de Trabajo Personal", margin, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(data.displayName, margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Período: ${format(from, "d MMM yyyy", { locale: es })} — ${format(to, "d MMM yyyy", { locale: es })}`,
        margin, y
      );
      y += 4;
      doc.setDrawColor(200, 190, 170);
      doc.line(margin, y, w - margin, y);
      y += 10;

      const sectionTitle = (title: string) => {
        checkY(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(16, 25, 39);
        doc.text(title, margin, y);
        y += 7;
      };

      sectionTitle("Estado de Ánimo");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (data.moodAvg !== null) {
        doc.text(`Promedio semanal: ${data.moodAvg}/5 — ${moodLabel(data.moodAvg)}`, margin, y);
        y += 6;
        if (data.moodEntries.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const moodLine = data.moodEntries.map(m => `${m.date}: ${m.score}`).join("  |  ");
          const lines = doc.splitTextToSize(moodLine, contentW);
          doc.text(lines, margin, y);
          y += lines.length * 4.5 + 4;
        }
      } else {
        doc.text("Sin registros de ánimo en este período.", margin, y);
        y += 8;
      }

      sectionTitle("Objetivos de la Semana");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (data.goals.length > 0) {
        for (const g of data.goals) {
          checkY(8);
          const icon = g.completed ? "✓" : "○";
          const status = g.completed ? "(Cumplido)" : "(En curso)";
          doc.text(`${icon}  ${g.text}  ${status}`, margin + 2, y);
          y += 6;
        }
        y += 2;
      } else {
        doc.text("Sin objetivos registrados en este período.", margin, y);
        y += 8;
      }

      sectionTitle("Notas Destacadas del Diario");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (data.highlighted.length > 0) {
        for (const h of data.highlighted) {
          checkY(20);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(140, 130, 110);
          doc.text(h.date, margin, y);
          if (h.prompt) {
            doc.text(` — "${h.prompt}"`, margin + doc.getTextWidth(h.date) + 2, y);
          }
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          const contentLines = doc.splitTextToSize(h.content, contentW - 4);
          checkY(contentLines.length * 4.5 + 4);
          doc.text(contentLines, margin + 2, y);
          y += contentLines.length * 4.5 + 4;
        }
      } else {
        doc.text("Sin notas destacadas. Podés marcar entradas con ★ en tu diario.", margin, y);
        y += 8;
      }

      sectionTitle("Resultados de Tests Clínicos");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (data.tests.length > 0) {
        for (const t of data.tests) {
          checkY(8);
          const sev = t.severity ? ` — ${t.severity}` : "";
          doc.text(`${t.type}: ${t.score} pts${sev}  (${t.date})`, margin + 2, y);
          y += 6;
        }
        y += 2;
      } else {
        doc.text("Sin tests realizados en este período.", margin, y);
        y += 8;
      }

      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(
          "Este documento es para uso exclusivo en el marco del proceso terapéutico y su contenido es confidencial.",
          w / 2, 288, { align: "center" }
        );
      }

      doc.save(`Bitacora_${data.displayName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
      toast.success("PDF generado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el PDF");
    } finally {
      setGenerating(false);
    }
  };

  const rangeLabel = `${format(from, "d MMM", { locale: es })} — ${format(to, "d MMM", { locale: es })}`;

  return (
    <div className="pb-28 safe-area-top">
      <div className="flex items-center gap-3 px-5 pt-14 pb-3">
        <button onClick={() => navigate(-1)} className="rounded-xl p-1.5 active:bg-foreground/5">
          <ArrowLeft size={22} weight="bold" className="text-foreground" />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold">Resumen para mi Psico</h1>
          <p className="text-xs text-muted-foreground">Generá un reporte de tu semana</p>
        </div>
      </div>

      <section className="px-5 mb-6">
        <h2 className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Rango de fechas
        </h2>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2.5 text-sm shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
                <CalendarBlank size={16} weight="duotone" className="text-muted-foreground" />
                <span>{rangeLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from, to }}
                onSelect={(range) => {
                  if (range?.from) setFrom(range.from);
                  if (range?.to) setTo(range.to);
                }}
                disabled={(date) => date > new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : data ? (
        <div className="space-y-5 px-5">
          <div className="rounded-3xl bg-card p-5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
            <h3 className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estado de ánimo
            </h3>
            {data.moodAvg !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-foreground">{data.moodAvg}</span>
                <span className="text-sm text-muted-foreground">/ 5 — {moodLabel(data.moodAvg)}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin registros</p>
            )}
          </div>

          <div className="rounded-3xl bg-card p-5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
            <h3 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Objetivos ({data.goals.filter(g => g.completed).length}/{data.goals.length})
            </h3>
            {data.goals.length > 0 ? (
              <ul className="space-y-2">
                {data.goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={cn("mt-0.5 text-xs", g.completed ? "text-green-600" : "text-muted-foreground")}>
                      {g.completed ? "✓" : "○"}
                    </span>
                    <span className={cn(g.completed && "line-through text-muted-foreground")}>{g.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin objetivos</p>
            )}
          </div>

          <div className="rounded-3xl bg-card p-5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
            <h3 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notas destacadas ({data.highlighted.length})
            </h3>
            {data.highlighted.length > 0 ? (
              <div className="space-y-3">
                {data.highlighted.map((h, i) => (
                  <div key={i} className="rounded-2xl bg-secondary/30 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{h.date}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/85 line-clamp-3">{h.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Marcá entradas con ★ en tu diario para verlas acá.
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-card p-5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]">
            <h3 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tests clínicos
            </h3>
            {data.tests.length > 0 ? (
              <div className="space-y-2">
                {data.tests.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t.type}</span>
                    <span className="text-muted-foreground">
                      {t.score} pts{t.severity ? ` · ${t.severity}` : ""} — {t.date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin tests en este período</p>
            )}
          </div>

          <button
            onClick={generatePDF}
            disabled={generating}
            className="flex w-full items-center justify-center gap-2.5 rounded-3xl bg-accent py-4 font-display text-sm font-semibold text-accent-foreground shadow-[0_4px_16px_hsl(var(--accent)/0.25)] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {generating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            ) : (
              <DownloadSimple size={20} weight="bold" />
            )}
            {generating ? "Generando…" : "Generar PDF"}
          </button>

          <p className="text-center text-[10px] text-muted-foreground/60 pb-4">
            Este documento es para uso exclusivo en el marco del proceso terapéutico.
          </p>
        </div>
      ) : null}
    </div>
  );
}
