import { supabase } from "@/integrations/supabase/client";

export type ResmitaEventType =
  | "open_sheet"
  | "send_message"
  | "action_click"
  | "error"
  | "consent_granted"
  | "consent_declined";

export type ResmitaEventInput = {
  userId: string;
  sessionId: string;
  eventType: ResmitaEventType;
  route?: string;
  screenTitle?: string;
  screenPurpose?: string;
  snapshot?: Record<string, any> | null;
  errorMessage?: string;
};

export async function logResmitaEvent(input: ResmitaEventInput): Promise<void> {
  try {
    await supabase.from("resmita_context_events").insert({
      user_id: input.userId,
      session_id: input.sessionId,
      event_type: input.eventType,
      route: input.route ?? null,
      screen_title: input.screenTitle ?? null,
      screen_purpose: input.screenPurpose ?? null,
      snapshot: input.snapshot ?? null,
      error_message: input.errorMessage ?? null,
    });
  } catch (e) {
    console.warn("[resmita-telemetry] failed to log event", e);
  }
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
