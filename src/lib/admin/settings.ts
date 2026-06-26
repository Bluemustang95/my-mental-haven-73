import { supabase } from "@/integrations/supabase/client";

export async function loadSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return (data.value as T) ?? fallback;
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const { error } = await supabase
    .from("admin_settings")
    .upsert({ key, value: value as any, updated_at: new Date().toISOString() });
  if (error) throw error;
}
