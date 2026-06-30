import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// La encuesta queda disponible apenas el profesional fue asignado (sin esperar 7 días).
const MIN_WAIT_MS = 0;

export function useSatisfactionSurveyTrigger() {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);

  const check = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("patient_app_profiles")
      .select("bridge_assigned_at, satisfaction_survey_completed_at, satisfaction_survey_dismissed_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data?.bridge_assigned_at) return setShouldShow(false);
    if (data.satisfaction_survey_completed_at) return setShouldShow(false);
    if (data.satisfaction_survey_dismissed_at) return setShouldShow(false);
    const assigned = new Date(data.bridge_assigned_at).getTime();
    setShouldShow(Date.now() - assigned >= MIN_WAIT_MS);
  };

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { shouldShow, dismiss: () => setShouldShow(false), recheck: check };
}
