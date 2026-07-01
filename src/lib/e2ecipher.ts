/**
 * Cifrado E2E de bitácoras (Diario).
 *
 * Modelo:
 *  - Clave AES-GCM 256 generada localmente al activar el cifrado.
 *  - Se guarda en localStorage (por dispositivo). Es la única copia:
 *    ni el servidor ni nadie más la conoce.
 *  - Cada entrada cifrada se guarda como envelope JSON:
 *      { v:1, iv:"base64", ct:"base64" }
 *  - El flag `is_encrypted=true` en la fila señala el formato.
 *
 * Este módulo es tolerante: si la clave no está en el dispositivo,
 * devuelve null en decrypt para poder mostrar un placeholder.
 */

const LS_KEY = "resma.diario.e2e.key.v1";
const LS_ENABLED = "resma.diario.e2e.enabled";

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function importKey(rawB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    fromB64(rawB64),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

async function generateAndStoreKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  localStorage.setItem(LS_KEY, b64(raw));
  return key;
}

let cached: CryptoKey | null = null;

export async function getKey(): Promise<CryptoKey | null> {
  if (cached) return cached;
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    cached = await importKey(raw);
    return cached;
  } catch {
    return null;
  }
}

export async function ensureKey(): Promise<CryptoKey> {
  const existing = await getKey();
  if (existing) return existing;
  cached = await generateAndStoreKey();
  return cached;
}

export function isE2EEnabled(): boolean {
  return localStorage.getItem(LS_ENABLED) === "1";
}

export async function enableE2E(): Promise<void> {
  await ensureKey();
  localStorage.setItem(LS_ENABLED, "1");
}

export function disableE2E(): void {
  localStorage.setItem(LS_ENABLED, "0");
}

/** Exporta la clave (base64) para respaldo o traslado a otro dispositivo. */
export function exportKeyB64(): string | null {
  return localStorage.getItem(LS_KEY);
}

/** Importa una clave base64 previamente exportada. */
export async function importKeyB64(rawB64: string): Promise<boolean> {
  try {
    await importKey(rawB64.trim());
    localStorage.setItem(LS_KEY, rawB64.trim());
    cached = null;
    await getKey();
    return true;
  } catch {
    return false;
  }
}

export async function encryptText(plain: string): Promise<string> {
  const key = await ensureKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plain);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc);
  return JSON.stringify({ v: 1, iv: b64(iv.buffer), ct: b64(ct) });
}

/** Devuelve null si la clave no está disponible o el payload es inválido. */
export async function decryptText(payload: string): Promise<string | null> {
  const key = await getKey();
  if (!key) return null;
  try {
    const obj = JSON.parse(payload);
    if (!obj || obj.v !== 1 || !obj.iv || !obj.ct) return null;
    const iv = fromB64(obj.iv);
    const ct = fromB64(obj.ct);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

/**
 * Detecta si un contenido guardado es un envelope E2E.
 * Útil como fallback para filas donde is_encrypted no venga poblado.
 */
export function looksEncrypted(s: string | null | undefined): boolean {
  if (!s || typeof s !== "string") return false;
  const t = s.trim();
  if (!t.startsWith("{")) return false;
  try {
    const o = JSON.parse(t);
    return o && o.v === 1 && typeof o.iv === "string" && typeof o.ct === "string";
  } catch {
    return false;
  }
}
