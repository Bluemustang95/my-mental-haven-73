import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ResmitaPrivacyPrefs = {
  contextConsent: boolean;
  contextConsentAt: string | null;
  shareScreen: boolean;
  shareSnapshot: boolean;
  storeHistory: boolean;
  loaded: boolean;
};

const DEFAULT: ResmitaPrivacyPrefs = {
  contextConsent: false,
  contextConsentAt: null,
  shareScreen: true,
  shareSnapshot: false,
  storeHistory: true,
  loaded: false,
};

export function useResmitaPrivacy() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<ResmitaPrivacyPrefs>(DEFAULT);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("patient_app_profiles")
      .select(
        "resmita_context_consent, resmita_context_consent_at, resmita_share_screen, resmita_share_snapshot, resmita_store_history",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    setPrefs({
      contextConsent: !!(data as any)?.resmita_context_consent,
      contextConsentAt: (data as any)?.resmita_context_consent_at ?? null,
      shareScreen: (data as any)?.resmita_share_screen ?? true,
      shareSnapshot: (data as any)?.resmita_share_snapshot ?? false,
      storeHistory: (data as any)?.resmita_store_history ?? true,
      loaded: true,
    });
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const update = useCallback(
    async (patch: Partial<Omit<ResmitaPrivacyPrefs, "loaded" | "contextConsentAt">> & { contextConsent?: boolean }) => {
      if (!user) return;
      const dbPatch: any = {};
      if ("shareScreen" in patch) dbPatch.resmita_share_screen = patch.shareScreen;
      if ("shareSnapshot" in patch) dbPatch.resmita_share_snapshot = patch.shareSnapshot;
      if ("storeHistory" in patch) dbPatch.resmita_store_history = patch.storeHistory;
      if ("contextConsent" in patch) {
        dbPatch.resmita_context_consent = patch.contextConsent;
        dbPatch.resmita_context_consent_at = patch.contextConsent ? new Date().toISOString() : null;
      }
      setPrefs((p) => ({ ...p, ...patch, ...(patch.contextConsent !== undefined ? { contextConsentAt: patch.contextConsent ? new Date().toISOString() : null } : {}) }));
      await supabase
        .from("patient_app_profiles")
        .upsert({ user_id: user.id, ...dbPatch }, { onConflict: "user_id" });
    },
    [user],
  );

  return { prefs, update, reload: load };
}
