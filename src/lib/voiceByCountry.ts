// ElevenLabs voice IDs grouped by Spanish-speaking region.
// Default is a multilingual voice that works globally.

export type VoiceProfile = {
  voiceId: string;
  label: string;
  region: string;
};

export const VOICE_DEFAULT: VoiceProfile = {
  voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - multilingual, neutral
  label: "Voz neutral (multilingüe)",
  region: "intl",
};

// Country (ISO-ish names matching CountryPicker) -> voice
const VOICE_MAP: Record<string, VoiceProfile> = {
  // Rioplatense
  Argentina: { voiceId: "XrExE9yKIg1WjnnlVkGX", label: "Matilda · Rioplatense", region: "ar" },
  Uruguay:   { voiceId: "XrExE9yKIg1WjnnlVkGX", label: "Matilda · Rioplatense", region: "ar" },
  Paraguay:  { voiceId: "XrExE9yKIg1WjnnlVkGX", label: "Matilda · Rioplatense", region: "ar" },

  // Mexicano / Centroamérica
  México:     { voiceId: "cgSgspJ2msm6clMCkdW9", label: "Jessica · Latinoamérica", region: "mx" },
  Mexico:     { voiceId: "cgSgspJ2msm6clMCkdW9", label: "Jessica · Latinoamérica", region: "mx" },
  Guatemala:  { voiceId: "cgSgspJ2msm6clMCkdW9", label: "Jessica · Latinoamérica", region: "mx" },
  "Costa Rica": { voiceId: "cgSgspJ2msm6clMCkdW9", label: "Jessica · Latinoamérica", region: "mx" },
  Honduras:   { voiceId: "cgSgspJ2msm6clMCkdW9", label: "Jessica · Latinoamérica", region: "mx" },
  Nicaragua:  { voiceId: "cgSgspJ2msm6clMCkdW9", label: "Jessica · Latinoamérica", region: "mx" },
  Panamá:     { voiceId: "cgSgspJ2msm6clMCkdW9", label: "Jessica · Latinoamérica", region: "mx" },

  // Andino
  Colombia: { voiceId: "FGY2WhTYpPnrIDTdsKH5", label: "Laura · Andino", region: "co" },
  Perú:     { voiceId: "FGY2WhTYpPnrIDTdsKH5", label: "Laura · Andino", region: "co" },
  Peru:     { voiceId: "FGY2WhTYpPnrIDTdsKH5", label: "Laura · Andino", region: "co" },
  Ecuador:  { voiceId: "FGY2WhTYpPnrIDTdsKH5", label: "Laura · Andino", region: "co" },
  Bolivia:  { voiceId: "FGY2WhTYpPnrIDTdsKH5", label: "Laura · Andino", region: "co" },
  Venezuela:{ voiceId: "FGY2WhTYpPnrIDTdsKH5", label: "Laura · Andino", region: "co" },

  // Chileno
  Chile: { voiceId: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice · Chilena", region: "cl" },

  // Caribe
  "República Dominicana": { voiceId: "pFZP5JQG7iQjIQuC4Bku", label: "Lily · Caribe", region: "do" },
  Cuba:        { voiceId: "pFZP5JQG7iQjIQuC4Bku", label: "Lily · Caribe", region: "do" },
  "Puerto Rico": { voiceId: "pFZP5JQG7iQjIQuC4Bku", label: "Lily · Caribe", region: "do" },

  // España
  España: { voiceId: "XB0fDUnXU5powFXDhCwa", label: "Charlotte · España", region: "es" },
  Espana: { voiceId: "XB0fDUnXU5powFXDhCwa", label: "Charlotte · España", region: "es" },
  Spain:  { voiceId: "XB0fDUnXU5powFXDhCwa", label: "Charlotte · España", region: "es" },
};

export function voiceForCountry(country?: string | null): VoiceProfile {
  if (!country) return VOICE_DEFAULT;
  return VOICE_MAP[country.trim()] ?? VOICE_DEFAULT;
}

export const ALL_VOICE_PROFILES: VoiceProfile[] = [
  VOICE_DEFAULT,
  { voiceId: "XrExE9yKIg1WjnnlVkGX", label: "Matilda · Rioplatense", region: "ar" },
  { voiceId: "cgSgspJ2msm6clMCkdW9", label: "Jessica · Latinoamérica", region: "mx" },
  { voiceId: "FGY2WhTYpPnrIDTdsKH5", label: "Laura · Andino", region: "co" },
  { voiceId: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice · Chilena", region: "cl" },
  { voiceId: "pFZP5JQG7iQjIQuC4Bku", label: "Lily · Caribe", region: "do" },
  { voiceId: "XB0fDUnXU5powFXDhCwa", label: "Charlotte · España", region: "es" },
];
