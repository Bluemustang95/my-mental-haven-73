import { supabase } from "@/integrations/supabase/client";

export type Hotline = { id: string; country: string; label: string; phone: string; priority: number };

const FALLBACK: Hotline[] = [
  { id: "f1", country: "AR", label: "Centro de Asistencia al Suicida", phone: "135", priority: 1 },
  { id: "f2", country: "AR", label: "Línea contra la Violencia", phone: "137", priority: 2 },
  { id: "f3", country: "ES", label: "Línea 024 Atención a la Conducta Suicida", phone: "024", priority: 1 },
  { id: "f4", country: "US", label: "Suicide & Crisis Lifeline", phone: "988", priority: 1 },
];

const cache = new Map<string, Hotline[]>();

export async function loadHotlines(country?: string | null): Promise<Hotline[]> {
  const c = (country || "AR").toUpperCase();
  if (cache.has(c)) return cache.get(c)!;
  const { data } = await supabase
    .from("crisis_hotlines")
    .select("id, country, label, phone, priority")
    .eq("country", c)
    .eq("active", true)
    .order("priority");
  const list = (data && data.length > 0 ? data : FALLBACK.filter((h) => h.country === c)) as Hotline[];
  cache.set(c, list);
  return list;
}

export async function detectUserCountry(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("patient_app_profiles")
    .select("country")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.country ?? null;
}
