import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"patient_app_profiles">;

export default function PatientList() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("patient_app_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProfiles(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = profiles.filter((p) =>
    (p.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.life_stage ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Pacientes</h1>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Etapa de vida</TableHead>
              <TableHead>Áreas de interés</TableHead>
              <TableHead>Tratamiento</TableHead>
              <TableHead>Onboarding</TableHead>
              <TableHead>Registrado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay pacientes</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/pacientes/${p.user_id}`)}>
                <TableCell className="font-medium">{p.display_name ?? "Sin nombre"}</TableCell>
                <TableCell>{p.life_stage ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(p.areas_of_interest ?? []).slice(0, 3).map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{p.treatment_status ?? "none"}</TableCell>
                <TableCell>{p.onboarding_completed ? "✓" : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString("es-AR") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
