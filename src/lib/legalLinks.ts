import { loadSetting, saveSetting } from "@/lib/admin/settings";

export type LegalLinks = { privacy: string; terms: string };

export const LEGAL_LINKS_KEY = "legal_links";

const FALLBACK: LegalLinks = { privacy: "", terms: "" };

export async function loadLegalLinks(): Promise<LegalLinks> {
  const value = await loadSetting<Partial<LegalLinks>>(LEGAL_LINKS_KEY, FALLBACK);
  return { privacy: value?.privacy ?? "", terms: value?.terms ?? "" };
}

export async function saveLegalLinks(links: LegalLinks): Promise<void> {
  await saveSetting(LEGAL_LINKS_KEY, links);
}
