// Shared Lovable AI Gateway helpers for edge functions.
// Uses OpenAI-compatible REST endpoint directly (no AI SDK dependency).

export const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function getLovableApiKey(): string {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return key;
}

export async function streamLovableChat(opts: {
  model?: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}) {
  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": getLovableApiKey(),
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3-flash-preview",
      stream: true,
      messages: [
        { role: "system", content: opts.system },
        ...opts.messages,
      ],
    }),
  });
  return res;
}
