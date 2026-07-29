// ============================================================================
// Config editable del Índice de Bienestar v3.
// Se persiste en `admin_settings` (key: wellbeing_config_v3) y la leen tanto
// la app del paciente como el panel admin, para que sean el mismo algoritmo.
// ============================================================================
import { loadSetting, saveSetting } from "@/lib/admin/settings";
import { DEFAULT_CONFIG, type WellbeingConfig } from "./types";

export const WELLBEING_CONFIG_KEY = "wellbeing_config_v3";

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : 0)));

/** Normaliza cualquier objeto parcial/corrupto a una config válida. */
export function sanitizeConfig(input: Partial<WellbeingConfig> | null | undefined): WellbeingConfig {
  const c = input ?? {};
  const w = { ...DEFAULT_CONFIG.wellbeingWeights, ...(c.wellbeingWeights ?? {}) };
  const k = { ...DEFAULT_CONFIG.careWeights, ...(c.careWeights ?? {}) };
  return {
    minDays: clamp(c.minDays ?? DEFAULT_CONFIG.minDays, 1, 7),
    windowDays: clamp(c.windowDays ?? DEFAULT_CONFIG.windowDays, 3, 30),
    wellbeingWeights: {
      mood: clamp(w.mood, 0, 100),
      sleep: clamp(w.sleep, 0, 100),
      balance: clamp(w.balance, 0, 100),
    },
    careWeights: {
      resources: clamp(k.resources, 0, 100),
      treatment: clamp(k.treatment, 0, 100),
    },
    modulatorEnabled: c.modulatorEnabled ?? DEFAULT_CONFIG.modulatorEnabled,
    displayMode: c.displayMode === "combined" ? "combined" : "split",
  };
}

export const sumWellbeing = (c: WellbeingConfig) =>
  c.wellbeingWeights.mood + c.wellbeingWeights.sleep + c.wellbeingWeights.balance;
export const sumCare = (c: WellbeingConfig) =>
  c.careWeights.resources + c.careWeights.treatment;

let _cache: WellbeingConfig | null = null;
let _inflight: Promise<WellbeingConfig> | null = null;

export async function loadWellbeingConfig(force = false): Promise<WellbeingConfig> {
  if (_cache && !force) return _cache;
  if (_inflight && !force) return _inflight;
  _inflight = (async () => {
    try {
      const raw = await loadSetting<Partial<WellbeingConfig>>(WELLBEING_CONFIG_KEY, DEFAULT_CONFIG);
      _cache = sanitizeConfig(raw);
    } catch {
      _cache = DEFAULT_CONFIG;
    }
    _inflight = null;
    return _cache;
  })();
  return _inflight;
}

export async function saveWellbeingConfig(config: WellbeingConfig): Promise<WellbeingConfig> {
  const clean = sanitizeConfig(config);
  await saveSetting(WELLBEING_CONFIG_KEY, clean);
  _cache = clean;
  return clean;
}

export function clearWellbeingConfigCache() {
  _cache = null;
  _inflight = null;
}
