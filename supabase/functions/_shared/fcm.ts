// Shared FCM HTTP v1 helper. Generates an OAuth2 access token from the
// service account JSON and sends messages to the FCM HTTP v1 endpoint.

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri: string;
}

function getServiceAccount(): ServiceAccount {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT not set");
  return JSON.parse(raw);
}

function base64urlEncode(bytes: Uint8Array | string): string {
  const b = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  let str = "";
  for (let i = 0; i < b.byteLength; i++) str += String.fromCharCode(b[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

let cachedToken: { token: string; exp: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;

  const sa = getServiceAccount();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri,
    iat,
    exp,
  };
  const signingInput = `${base64urlEncode(JSON.stringify(header))}.${base64urlEncode(JSON.stringify(claim))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${base64urlEncode(new Uint8Array(sig))}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

export async function sendFcm(opts: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const sa = getServiceAccount();
  const accessToken = await getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const payload = {
    message: {
      token: opts.token,
      notification: { title: opts.title, body: opts.body },
      data: opts.data ? Object.fromEntries(Object.entries(opts.data).map(([k, v]) => [k, String(v)])) : undefined,
      webpush: {
        fcm_options: { link: opts.data?.url || "/" },
      },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true, status: res.status };
  const errTxt = await res.text();
  return { ok: false, status: res.status, error: errTxt };
}
