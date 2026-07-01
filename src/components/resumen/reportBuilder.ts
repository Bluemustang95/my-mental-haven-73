import type { ResumenData } from "@/hooks/useResumenData";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type CategoryId = "checkins" | "notes" | "tests" | "resources" | "goals" | "journal";

export interface Selection {
  [cat: string]: { enabled: boolean; items: Record<string, boolean> };
}

const fmt = (d: string | Date) => format(new Date(d), "d MMM", { locale: es });

const moodLabel = (m: number) =>
  m <= 1.5 ? "muy bajo" : m <= 2.5 ? "bajo" : m <= 3.5 ? "moderado" : m <= 4.5 ? "bueno" : "muy bueno";

export function buildReport(sel: Selection, data: ResumenData): string {
  const period = `${fmt(new Date(Date.now() - 7 * 86400000))} — ${fmt(new Date())}`;
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════");
  lines.push("  RESUMEN CLÍNICO PARA PROFESIONAL");
  lines.push("═══════════════════════════════════════");
  lines.push(`Paciente: ${data.displayName}`);
  lines.push(`Período: últimos 7 días (${period})`);
  lines.push(`Generado: ${format(new Date(), "d MMM yyyy · HH:mm", { locale: es })}`);
  lines.push("");

  const isOn = (cat: CategoryId, id: string) =>
    sel[cat]?.enabled && sel[cat]?.items[id];

  // Check-ins
  const activeCheckins = data.checkins.filter(c => isOn("checkins", c.id));
  if (activeCheckins.length) {
    lines.push("── ESTADO DE ÁNIMO (CHECK-INS) ──");
    const avg = activeCheckins.filter(c => c.mood != null).reduce((s, c) => s + (c.mood ?? 0), 0) /
      Math.max(1, activeCheckins.filter(c => c.mood != null).length);
    if (avg > 0) lines.push(`Promedio: ${avg.toFixed(1)}/5 (${moodLabel(avg)})`);
    for (const c of activeCheckins) {
      const parts = [fmt(c.date)];
      if (c.mood != null) parts.push(`ánimo ${c.mood}/5`);
      if (c.emotions?.length) parts.push(c.emotions.join(", "));
      lines.push(`  • ${parts.join(" · ")}`);
      if (c.note) lines.push(`    "${c.note}"`);
    }
    lines.push("");
  }

  // Notes
  const activePrep = data.prepNotes.filter(n => isOn("notes", `prep-${n.id}`));
  const activeSess = data.sessionNotes.filter(n => isOn("notes", `sess-${n.id}`));
  if (activePrep.length || activeSess.length) {
    lines.push("── NOTAS PARA SESIÓN ──");
    for (const n of activePrep) {
      lines.push(`  • [${fmt(n.created_at)}] ${n.note}`);
    }
    for (const n of activeSess) {
      lines.push(`  • [sesión ${fmt(n.session_date)}] ${n.note}`);
    }
    lines.push("");
  }

  // Tests
  const activeTests = data.tests.filter(t => isOn("tests", t.id));
  if (activeTests.length) {
    lines.push("── INVENTARIOS Y TESTS ──");
    for (const t of activeTests) {
      const sev = t.severity ? ` — ${t.severity}` : "";
      lines.push(`  • ${t.type}: ${t.score} pts${sev} (${fmt(t.created_at)})`);
    }
    lines.push("");
  }

  // Resources
  if (sel.resources?.enabled) {
    const items: string[] = [];
    if (sel.resources.items["exercises"]) items.push(`Ejercicios de mindfulness: ${data.exerciseSessions} sesiones`);
    if (sel.resources.items["habits"]) items.push(`Hábitos completados: ${data.habitCompletions}`);
    if (sel.resources.items["dbt"]) items.push(`Regulación emocional (DBT): ${data.dbtSessions} sesiones`);
    if (sel.resources.items["thoughts"]) items.push(`Registros de pensamientos: ${data.thoughtRecords}`);
    if (sel.resources.items["meds"]) {
      const pct = data.medicationLogs.total > 0
        ? Math.round((data.medicationLogs.taken / data.medicationLogs.total) * 100)
        : 0;
      items.push(`Medicación: ${data.medicationLogs.taken}/${data.medicationLogs.total} tomas (${pct}% adherencia)`);
    }
    if (items.length) {
      lines.push("── USO DE RECURSOS (7 DÍAS) ──");
      items.forEach(i => lines.push(`  • ${i}`));
      lines.push("");
    }
  }

  // Goals
  const activeGoals = data.goals.filter(g => isOn("goals", g.id));
  if (activeGoals.length) {
    lines.push("── OBJETIVOS SEMANALES ──");
    for (const g of activeGoals) {
      lines.push(`  ${g.completed ? "✓" : "○"} ${g.text}${g.completed ? " (cumplido)" : ""}`);
    }
    lines.push("");
  }

  // Journal
  const activeJournal = data.journal.filter(j => isOn("journal", j.id));
  if (activeJournal.length) {
    lines.push("── FRAGMENTOS DEL DIARIO (DESTACADOS) ──");
    for (const j of activeJournal) {
      lines.push(`[${fmt(j.date)}]${j.prompt ? ` — ${j.prompt}` : ""}`);
      lines.push(j.content);
      lines.push("");
    }
  }

  lines.push("───────────────────────────────────────");
  lines.push("Documento confidencial · uso terapéutico");

  return lines.join("\n");
}

export function countSelected(sel: Selection): number {
  let n = 0;
  for (const cat of Object.values(sel)) {
    if (!cat.enabled) continue;
    n += Object.values(cat.items).filter(Boolean).length;
  }
  return n;
}
