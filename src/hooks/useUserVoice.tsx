import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { voiceForCountry, VOICE_DEFAULT, type VoiceProfile } from "@/lib/voiceByCountry";

/**
 * Returns the ElevenLabs voice the user should hear.
 * Priority: explicit voice_id on profile > voice mapped from country > default.
 */
export function useUserVoice() {
  const { user } = useAuth();
  const [voice, setVoice] = useState<VoiceProfile>(VOICE_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("patient_app_profiles")
      .select("country, voice_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.voice_id) {
          setVoice({ voiceId: data.voice_id, label: "Voz personalizada", region: "custom" });
        } else {
          setVoice(voiceForCountry(data?.country));
        }
        setLoading(false);
      });
  }, [user]);

  return { voice, voiceId: voice.voiceId, loading };
}
