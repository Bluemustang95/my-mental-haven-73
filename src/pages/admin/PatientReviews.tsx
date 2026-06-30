import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { SatisfactionSurveySheet } from "@/components/proceso/SatisfactionSurveySheet";

type Survey = {
  id: string;
  user_id: string;
  started_treatment: boolean | null;
  contacted_in_24h: boolean | null;
  sessions_count: string | null;
  bond_rating: number | null;
  modality_match: string | null;
  nps_score: number | null;
  not_started_reasons: string[] | null;
  other_reason: string | null;
  final_nps: number | null;
  comment: string | null;
  triggered_at: string | null;
  completed_at: string | null;
};

export default function PatientReviews() {
  const [rows, setRows] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Survey | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("therapy_satisfaction_surveys")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as Survey[]);
        setLoading(false);
      });
  }, []);

  const completed = rows.filter((r) => r.completed_at);
  const avgNps = completed.length
    ? (completed.reduce((s, r) => s + (r.final_nps ?? r.nps_score ?? 0), 0) / completed.length).toFixed(1)
    : "—";

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="mb-1 font-display text-2xl font-bold">Reseñas de pacientes</h1>
          <p className="text-sm text-muted-foreground">Encuestas de satisfacción tras la derivación a profesional.</p>
        </div>
        <Button onClick={() => setPreviewOpen(true)} variant="outline" className="gap-2">
          <Play size={14} /> Probar encuesta
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card label="Total respuestas" value={String(completed.length)} />
        <Card label="Pendientes" value={String(rows.length - completed.length)} />
        <Card label="NPS promedio" value={avgNps} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>¿Inició?</TableHead>
              <TableHead>Vínculo</TableHead>
              <TableHead>NPS</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Cargando…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay reseñas aún.</TableCell></TableRow>
            ) : rows.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(s)}>
                <TableCell>
                  {s.completed_at
                    ? <Badge>Completada</Badge>
                    : <Badge variant="outline">Pendiente</Badge>}
                </TableCell>
                <TableCell>{s.started_treatment == null ? "—" : s.started_treatment ? "Sí" : "No"}</TableCell>
                <TableCell>{s.bond_rating ?? "—"}</TableCell>
                <TableCell>{s.final_nps ?? s.nps_score ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(s.completed_at ?? s.triggered_at) ? new Date((s.completed_at ?? s.triggered_at) as string).toLocaleDateString("es-AR") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalle de reseña</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row k="¿Inició tratamiento?" v={selected.started_treatment == null ? "—" : selected.started_treatment ? "Sí" : "No"} />
              <Row k="Contacto en 24h hábiles" v={selected.contacted_in_24h == null ? "—" : selected.contacted_in_24h ? "Sí" : "No"} />
              <Row k="Sesiones realizadas" v={selected.sessions_count ?? "—"} />
              <Row k="Vínculo terapéutico (1-5)" v={selected.bond_rating != null ? String(selected.bond_rating) : "—"} />
              <Row k="Modalidad coincidió" v={selected.modality_match ?? "—"} />
              <Row k="NPS sesiones (0-10)" v={selected.nps_score != null ? String(selected.nps_score) : "—"} />
              <Row k="Motivos no inicio" v={selected.not_started_reasons?.join(", ") || "—"} />
              <Row k="Otro motivo" v={selected.other_reason ?? "—"} />
              <Row k="NPS final RESMA" v={selected.final_nps != null ? String(selected.final_nps) : "—"} />
              {selected.comment && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Comentario</p>
                  <p>{selected.comment}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SatisfactionSurveySheet
        open={previewOpen}
        previewMode
        onClose={() => setPreviewOpen(false)}
        onCompleted={() => setPreviewOpen(false)}
        onDismiss={() => setPreviewOpen(false)}
      />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
