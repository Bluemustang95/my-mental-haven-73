import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Crown, Shield, Mic } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { voiceForCountry } from "@/lib/voiceByCountry";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"patient_app_profiles">;
type Checkin = Tables<"daily_checkins">;
type TestResult = Tables<"test_results">;
type Exercise = Tables<"exercise_sessions">;

type PlanAction = { plan: "free" | "premium"; days?: number; label: string };

export default function PatientDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Confirm dialog for plan changes
  const [pendingAction, setPendingAction] = useState<PlanAction | null>(null);
  const [reason, setReason] = useState("");

  const load = () => {
    if (!userId) return;
    Promise.all([
      // Use the admin RPC for the profile (server-side role check + future-proof for new fields).
      supabase.rpc("admin_get_patient", { _user_id: userId }),
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
      supabase.from("daily_checkins").select("*").eq("user_id", userId).order("checkin_date", { ascending: false }).limit(30),
      supabase.from("test_results").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("exercise_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]).then(([profileRes, roleRes, checkinsRes, testsRes, exercisesRes]) => {
      const profileRow = Array.isArray(profileRes.data) ? profileRes.data[0] : profileRes.data;
      setProfile((profileRow as Profile) ?? null);
      setIsAdmin(!!roleRes.data);
      setCheckins(checkinsRes.data ?? []);
      setTests(testsRes.data ?? []);
      setExercises(exercisesRes.data ?? []);
      setLoading(false);
    });
  };

  useEffect(load, [userId]);

  const requestPlan = (plan: "free" | "premium", days?: number) => {
    setReason("");
    setPendingAction({
      plan,
      days,
      label: plan === "free"
        ? "Revocar Premium"
        : days ? `Otorgar Premium ${days} días` : "Premium sin vencimiento",
    });
  };

  const confirmPlan = async () => {
    if (!userId || !pendingAction) return;
    setSaving(true);
    const expires = pendingAction.plan === "premium" && pendingAction.days
      ? new Date(Date.now() + pendingAction.days * 86400000).toISOString()
      : null;
    const { error } = await supabase.rpc("admin_set_plan", {
      _user_id: userId,
      _plan: pendingAction.plan,
      _expires_at: expires,
      _reason: reason.trim() || null,
    });
    setSaving(false);
    setPendingAction(null);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: `Plan actualizado a ${pendingAction.plan}` });
      load();
    }
  };

  const toggleAdmin = async (next: boolean) => {
    if (!userId) return;
    if (!confirm(next ? "¿Otorgar rol administrador?" : "¿Revocar rol administrador?")) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_set_admin_role", { _user_id: userId, _is_admin: next });
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: next ? "Rol admin otorgado" : "Rol admin removido" });
      setIsAdmin(next);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Paciente no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/pacientes")}>Volver</Button>
      </div>
    );
  }

  const voice = voiceForCountry(profile.country);
  const isPremium = profile.plan === "premium";
  const expiresIn = profile.plan_expires_at
    ? Math.ceil((new Date(profile.plan_expires_at).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/pacientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-2xl font-bold">{profile.display_name ?? "Sin nombre"}</h1>
        {isAdmin && <Badge className="gap-1 bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/30"><Shield className="h-3 w-3" /> Admin</Badge>}
        {isPremium && <Badge className="gap-1 bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 border-0"><Crown className="h-3 w-3" /> Premium</Badge>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">País</CardTitle></CardHeader>
          <CardContent><p className="font-medium">{profile.country ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Etapa de vida</CardTitle></CardHeader>
          <CardContent><p className="font-medium">{profile.life_stage ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tratamiento</CardTitle></CardHeader>
          <CardContent><p className="font-medium">{profile.treatment_status ?? "none"}</p></CardContent>
        </Card>
      </div>

      {/* Membresía y acceso */}
      <Card className="mb-6 border-amber-200/40 bg-gradient-to-br from-amber-50/40 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-amber-600" /> Membresía y acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Plan actual:</span>
            {isPremium ? (
              <Badge className="bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 border-0">Premium</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
            {expiresIn !== null && (
              <span className="text-xs text-muted-foreground">
                · expira en {expiresIn} {expiresIn === 1 ? "día" : "días"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={saving} onClick={() => requestPlan("premium", 30)}>
              Otorgar Premium 30 días
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={() => requestPlan("premium", 365)}>
              Premium 1 año
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={() => requestPlan("premium")}>
              Premium sin vencimiento
            </Button>
            <Button size="sm" variant="ghost" disabled={saving || !isPremium} onClick={() => requestPlan("free")}>
              Revocar
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#6366f1]" />
              <div>
                <p className="text-sm font-medium">Rol administrador</p>
                <p className="text-xs text-muted-foreground">Acceso al panel y a todas las funciones premium</p>
              </div>
            </div>
            <Switch checked={isAdmin} disabled={saving} onCheckedChange={toggleAdmin} />
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
            <Mic className="h-4 w-4 text-foreground/60" />
            <div className="flex-1">
              <p className="text-sm font-medium">Voz asignada (ElevenLabs)</p>
              <p className="text-xs text-muted-foreground">{voice.label}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">{voice.region.toUpperCase()}</Badge>
          </div>
        </CardContent>
      </Card>

      {profile.areas_of_interest && profile.areas_of_interest.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {profile.areas_of_interest.map((a) => <Badge key={a} variant="secondary">{a}</Badge>)}
        </div>
      )}

      <Tabs defaultValue="checkins">
        <TabsList>
          <TabsTrigger value="checkins">Check-ins ({checkins.length})</TabsTrigger>
          <TabsTrigger value="tests">Tests ({tests.length})</TabsTrigger>
          <TabsTrigger value="exercises">Ejercicios ({exercises.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="mt-4">
          {checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay check-ins registrados</p>
          ) : (
            <div className="space-y-2">
              {checkins.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{new Date(c.checkin_date).toLocaleDateString("es-AR")}</p>
                      {c.note && <p className="text-xs text-muted-foreground mt-1">{c.note}</p>}
                    </div>
                    {c.mood_score !== null && (
                      <Badge variant="outline" className="text-lg">{c.mood_score}/5</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests" className="mt-4">
          {tests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay tests completados</p>
          ) : (
            <div className="space-y-2">
              {tests.map((t) => (
                <Card key={t.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{t.test_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString("es-AR") : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold">{t.score}</p>
                      {t.severity && <Badge variant="outline">{t.severity}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exercises" className="mt-4">
          {exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay ejercicios registrados</p>
          ) : (
            <div className="space-y-2">
              {exercises.map((e) => (
                <Card key={e.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{e.exercise_name ?? e.exercise_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.created_at ? new Date(e.created_at).toLocaleDateString("es-AR") : "—"}
                        {e.duration_seconds ? ` · ${Math.round(e.duration_seconds / 60)} min` : ""}
                      </p>
                    </div>
                    {e.mood_before !== null && e.mood_after !== null && (
                      <p className="text-sm text-muted-foreground">{e.mood_before} → {e.mood_after}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción quedará registrada en el log de auditoría con tu usuario.
              Ingresá un motivo (opcional) para que tu equipo pueda revisarlo después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: paciente aprobado por convenio, cortesía, error de cobro, etc."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPlan} disabled={saving}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
