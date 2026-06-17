import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Crown, Shield } from "lucide-react";

type AdminPatientRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  country: string | null;
  life_stage: string | null;
  plan: string | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  treatment_status: string | null;
  onboarding_completed: boolean | null;
  is_admin: boolean | null;
  created_at: string | null;
};

type Filter = "all" | "free" | "premium" | "admins";

export default function PatientList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminPatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    supabase.rpc("admin_list_patients").then(({ data, error }) => {
      if (error) console.error(error);
      setRows((data ?? []) as AdminPatientRow[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (filter === "free" && p.plan !== "free" && p.plan !== null) return false;
      if (filter === "premium" && p.plan !== "premium") return false;
      if (filter === "admins" && !p.is_admin) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        (p.display_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.country ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  const counts = useMemo(() => ({
    all: rows.length,
    free: rows.filter((p) => p.plan !== "premium").length,
    premium: rows.filter((p) => p.plan === "premium").length,
    admins: rows.filter((p) => p.is_admin).length,
  }), [rows]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Pacientes</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "free", "premium", "admins"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              filter === f
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "all" ? "Todos" : f === "free" ? "Free" : f === "premium" ? "Premium" : "Admins"}{" "}
            <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o país..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Plan</TableHead>
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
              <TableRow key={p.user_id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/pacientes/${p.user_id}`)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {p.display_name ?? "Sin nombre"}
                    {p.is_admin && <Shield className="h-3.5 w-3.5 text-[#6366f1]" />}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.email ?? "—"}</TableCell>
                <TableCell>{p.country ?? "—"}</TableCell>
                <TableCell>
                  {p.plan === "premium" ? (
                    <Badge className="bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 border-0 gap-1">
                      <Crown className="h-3 w-3" /> Premium
                    </Badge>
                  ) : (
                    <Badge variant="outline">Free</Badge>
                  )}
                </TableCell>
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
