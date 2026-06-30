import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Hotline = {
  id: string;
  country: string;
  label: string;
  phone: string;
  priority: number;
  active: boolean;
};

const empty: Omit<Hotline, "id"> = { country: "AR", label: "", phone: "", priority: 1, active: true };

export default function CrisisHotlinesManager() {
  const [rows, setRows] = useState<Hotline[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [editing, setEditing] = useState<Partial<Hotline> | null>(null);

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crisis_hotlines")
      .select("*")
      .order("country")
      .order("priority");
    setRows((data ?? []) as Hotline[]);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const countries = Array.from(new Set(rows.map((r) => r.country))).sort();
  const filtered = countryFilter === "ALL" ? rows : rows.filter((r) => r.country === countryFilter);

  const save = async () => {
    if (!editing) return;
    const payload = {
      country: (editing.country ?? "AR").toUpperCase().trim(),
      label: (editing.label ?? "").trim(),
      phone: (editing.phone ?? "").trim(),
      priority: Number(editing.priority ?? 1),
      active: editing.active ?? true,
    };
    if (!payload.country || !payload.label || !payload.phone) {
      toast.error("País, nombre y teléfono son obligatorios"); return;
    }
    const { error } = editing.id
      ? await supabase.from("crisis_hotlines").update(payload).eq("id", editing.id)
      : await supabase.from("crisis_hotlines").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    setEditing(null);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta línea?")) return;
    const { error } = await supabase.from("crisis_hotlines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    refresh();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Líneas de crisis por país</h1>
          <p className="text-sm text-muted-foreground">Las líneas activas se muestran al usuario según su país.</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })} className="gap-2"><Plus size={16} /> Nueva línea</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setCountryFilter("ALL")} className={pill(countryFilter === "ALL")}>Todos ({rows.length})</button>
        {countries.map((c) => (
          <button key={c} onClick={() => setCountryFilter(c)} className={pill(countryFilter === c)}>
            {c} ({rows.filter((r) => r.country === c).length})
          </button>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>País</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Activa</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Cargando…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin líneas configuradas.</TableCell></TableRow>
            ) : filtered.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-mono text-sm">{h.country}</TableCell>
                <TableCell className="font-medium">{h.label}</TableCell>
                <TableCell className="font-mono">{h.phone}</TableCell>
                <TableCell>{h.priority}</TableCell>
                <TableCell>{h.active ? "Sí" : "No"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(h)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(h.id)}><Trash2 size={14} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar línea" : "Nueva línea"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Field label="País (código ISO, ej. AR, ES, MX)">
                <Input value={editing.country ?? ""} maxLength={3} onChange={(e) => setEditing({ ...editing, country: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Nombre">
                <Input value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
              </Field>
              <Field label="Teléfono">
                <Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </Field>
              <Field label="Prioridad (menor = aparece primero)">
                <Input type="number" value={editing.priority ?? 1} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} />
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Activa</span>
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function pill(active: boolean) {
  return `rounded-full px-3 py-1 text-xs font-medium transition ${active ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
