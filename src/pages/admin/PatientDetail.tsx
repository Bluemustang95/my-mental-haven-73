import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"patient_app_profiles">;
type Checkin = Tables<"daily_checkins">;
type TestResult = Tables<"test_results">;
type Exercise = Tables<"exercise_sessions">;

export default function PatientDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      supabase.from("patient_app_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("daily_checkins").select("*").eq("user_id", userId).order("checkin_date", { ascending: false }).limit(30),
      supabase.from("test_results").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("exercise_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]).then(([profileRes, checkinsRes, testsRes, exercisesRes]) => {
      setProfile(profileRes.data);
      setCheckins(checkinsRes.data ?? []);
      setTests(testsRes.data ?? []);
      setExercises(exercisesRes.data ?? []);
      setLoading(false);
    });
  }, [userId]);

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

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/pacientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-2xl font-bold">{profile.display_name ?? "Sin nombre"}</h1>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Etapa de vida</CardTitle></CardHeader>
          <CardContent><p className="font-medium">{profile.life_stage ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tratamiento</CardTitle></CardHeader>
          <CardContent><p className="font-medium">{profile.treatment_status ?? "none"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Profesional vinculado</CardTitle></CardHeader>
          <CardContent><p className="font-medium">{profile.linked_professional_code ?? "Ninguno"}</p></CardContent>
        </Card>
      </div>

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
    </div>
  );
}
