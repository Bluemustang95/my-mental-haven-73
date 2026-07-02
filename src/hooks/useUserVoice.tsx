import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { voiceForCountry, VOICE_DEFAULT, type VoiceProfile } from "@/lib/voiceByCountry";
import { getCountryOverride, subscribeCountryOverride } from "@/lib/countryOverride";
import { canonicalCountry } from "@/lib/countryCodes";


type VoiceGender = "female" | "male";
type UseUserVoiceOptions = {
  genderOverride?: VoiceGender;
};

/**
 * Returns the ElevenLabs voice the user should hear.
 * Priority:
 *   1. explicit voice_id on profile
 *   2. admin-configured voice for (country, gender preference) in `voice_settings`
 *   3. gender-agnostic voice mapped from country (legacy)
 *   4. default
 */
export function useUserVoice(options: UseUserVoiceOptions = {}) {
  const { user } = useAuth();
  const [voice, setVoice] = useState<VoiceProfile>(VOICE_DEFAULT);
  const [country, setCountry] = useState<string | null>(null);
  const [gender, setGender] = useState<VoiceGender>(options.genderOverride ?? "female");
  const [loading, setLoading] = useState(true);

  const [overrideTick, setOverrideTick] = useState(0);
  useEffect(() => subscribeCountryOverride(() => setOverrideTick((t) => t + 1)), []);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setLoading(false); return; }

    (async () => {
      const { data: profile } = await supabase
        .from("patient_app_profiles")
        .select("country, voice_id, voice_gender_preference")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;

      const override = getCountryOverride();
      const rawCountry = override ?? profile?.country ?? null;
      const effectiveCountry = canonicalCountry(rawCountry) ?? rawCountry;

      if (!override && profile?.voice_id) {
        setVoice({ voiceId: profile.voice_id, label: "Voz personalizada", region: "custom" });
        setCountry(effectiveCountry);
        setLoading(false);
        return;
      }

      const gender = (options.genderOverride ?? profile?.voice_gender_preference ?? "female") as VoiceGender;
      setCountry(effectiveCountry);
      setGender(gender);

      if (effectiveCountry) {
        const { data: vs } = await supabase
          .from("voice_settings")
          .select("voice_id, label")
          .eq("country_code", effectiveCountry)
          .eq("gender", gender)
          .maybeSingle();
        if (!cancelled && vs?.voice_id) {
          setVoice({ voiceId: vs.voice_id, label: vs.label ?? "Voz por país", region: effectiveCountry });
          setLoading(false);
          return;
        }
      }

      // Fallback to default admin-configured or legacy country map
      const { data: def } = await supabase
        .from("voice_settings")
        .select("voice_id, label")
        .eq("country_code", "default")
        .eq("gender", gender)
        .maybeSingle();
      if (cancelled) return;
      if (def?.voice_id) {
        setVoice({ voiceId: def.voice_id, label: def.label ?? "Voz por defecto", region: "default" });
      } else {
        setVoice(voiceForCountry(effectiveCountry));
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, options.genderOverride, overrideTick]);


  return { voice, voiceId: voice.voiceId, country, gender, loading };
}
