// Admin-only client-side override to preview the app as if the user were in another country.
// Stored in localStorage so it survives reloads but does not affect other users.

const KEY = "resma_admin_country_override";

export function getCountryOverride(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v && v.trim() ? v.trim().toUpperCase() : null;
}

export function setCountryOverride(country: string | null) {
  if (typeof window === "undefined") return;
  if (!country) window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, country.trim().toUpperCase());
  // Notify other tabs / listeners
  window.dispatchEvent(new CustomEvent("resma:country-override-change"));
}

export function subscribeCountryOverride(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("resma:country-override-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("resma:country-override-change", handler);
    window.removeEventListener("storage", handler);
  };
}
