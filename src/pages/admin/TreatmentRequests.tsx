import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Intake = Tables<"patients_intake">;

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  contacted: "secondary",
  completed: "default",
  rejected: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  completed: "Completado",
  rejected: "Rechazado",
};

export default function TreatmentRequests() {
  const [items, setItems] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Intake | null>(null);

  const fetchData = async () => {
    const { data } = await supabase
      .from("patients_intake")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("patients_intake").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estado actualizado");
    fetchData();
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Solicitudes de Tratamiento</h1>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay solicitudes</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                <TableCell className="font-medium">{item.first_name} {item.last_name}</TableCell>
                <TableCell>{item.email ?? "—"}</TableCell>
                <TableCell>{item.phone ?? "—"}</TableCell>
                <TableCell>{item.modality ?? "—"}</TableCell>
                <TableCell>
                  <Select
                    value={item.status ?? "pending"}
                    onValueChange={(v) => { updateStatus(item.id, v); }}
                  >
                    <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString("es-AR") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.first_name} {selected?.last_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Edad:</span> {selected.age ?? "—"}</div>
                <div><span className="text-muted-foreground">Zona:</span> {selected.zone ?? "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {selected.email ?? "—"}</div>
                <div><span className="text-muted-foreground">Teléfono:</span> {selected.phone ?? "—"}</div>
                <div><span className="text-muted-foreground">Modalidad:</span> {selected.modality ?? "—"}</div>
                <div><span className="text-muted-foreground">Obra social:</span> {selected.insurance ?? "—"}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Motivo:</span>
                <p className="mt-1">{selected.reason ?? "No especificado"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Estado:</span>{" "}
                <Badge variant={statusColors[selected.status ?? "pending"]}>
                  {statusLabels[selected.status ?? "pending"]}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
