// Thin WebAuthn helper to enable "next-time" biometric unlock on devices that
// support a platform authenticator (Face ID / Touch ID / Windows Hello).
// The session itself is still kept by Supabase (persistSession). Biometrics
// only gate the local re-entry UI.

const ENABLED_KEY = "resma:bio_enabled";
const CRED_ID_KEY = "resma:bio_cred_id";

export function isBiometricSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials
  );
}

export function isBiometricEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === "1" && !!localStorage.getItem(CRED_ID_KEY);
}

function b64encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64decode(str: string): ArrayBuffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const norm = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(norm);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function enrollBiometric(userId: string, displayName: string): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userIdBytes = new TextEncoder().encode(userId);
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "RESMA", id: window.location.hostname },
        user: {
          id: userIdBytes,
          name: displayName || "Usuario",
          displayName: displayName || "Usuario",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 30000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    localStorage.setItem(ENABLED_KEY, "1");
    localStorage.setItem(CRED_ID_KEY, b64encode(cred.rawId));
    return true;
  } catch {
    return false;
  }
}

export async function verifyBiometric(): Promise<boolean> {
  if (!isBiometricSupported() || !isBiometricEnabled()) return false;
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const rawCredId = localStorage.getItem(CRED_ID_KEY);
    if (!rawCredId) return false;
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 30000,
        userVerification: "required",
        allowCredentials: [
          {
            id: b64decode(rawCredId),
            type: "public-key",
            transports: ["internal"],
          },
        ],
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

export function disableBiometric() {
  localStorage.removeItem(ENABLED_KEY);
  localStorage.removeItem(CRED_ID_KEY);
}
