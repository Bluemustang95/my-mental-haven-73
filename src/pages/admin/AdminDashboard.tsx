import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, ClipboardList, Brain } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    checkinsToday: 0,
    pendingRequests: 0,
    totalTests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const today = localDateStr();

      const [users, checkins, requests, tests] = await Promise.all([
        supabase.from("patient_app_profiles").select("id", { count: "exact", head: true }),
        supabase.from("daily_checkins").select("id", { count: "exact", head: true }).eq("checkin_date", today),
        supabase.from("patients_intake").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("test_results").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: users.count ?? 0,
        checkinsToday: checkins.count ?? 0,
        pendingRequests: requests.count ?? 0,
        totalTests: tests.count ?? 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const cards = [
    { title: "Usuarios registrados", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { title: "Check-ins hoy", value: stats.checkinsToday, icon: Activity, color: "text-accent" },
    { title: "Solicitudes pendientes", value: stats.pendingRequests, icon: ClipboardList, color: "text-destructive" },
    { title: "Tests completados", value: stats.totalTests, icon: Brain, color: "text-secondary-foreground" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">
                {loading ? "..." : card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
