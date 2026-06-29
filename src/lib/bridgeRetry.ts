import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type BridgeResult<T = any> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

async function callOnce<T>(action: string, payload: unknown): Promise<BridgeResult<T>> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/bridge-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify({ action, payload }),
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* noop */ }
  return {
    ok: res.ok,
    status: res.status,
    data,
    error: data?.error,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Calls bridge-proxy with retry policy:
 * - 400/401: no retry (client error)
 * - 429: retry with backoff [2s, 5s]
 * - 5xx: retry once
 */
export async function callBridge<T = any>(action: string, payload: unknown): Promise<BridgeResult<T>> {
  const backoffs = [2000, 5000];
  let attempt = 0;
  let lastResult: BridgeResult<T> | null = null;

  while (attempt < 3) {
    const result = await callOnce<T>(action, payload);
    lastResult = result;

    if (result.ok) return result;

    // No retry on 4xx (except 429)
    if (result.status >= 400 && result.status < 500 && result.status !== 429) {
      return result;
    }

    if (result.status === 429 && attempt < backoffs.length) {
      await sleep(backoffs[attempt]);
      attempt++;
      continue;
    }

    if (result.status >= 500 && attempt < 1) {
      await sleep(1500);
      attempt++;
      continue;
    }

    return result;
  }

  return lastResult!;
}
