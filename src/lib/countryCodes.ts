export type CanonicalCountry =
  | "default"
  | "Argentina"
  | "Uruguay"
  | "Chile"
  | "México"
  | "Colombia"
  | "Perú"
  | "España"
  | "Estados Unidos";

export type CountryOption = {
  code: CanonicalCountry;
  iso: string;
  label: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "default", iso: "DEFAULT", label: "Default" },
  { code: "Argentina", iso: "AR", label: "Argentina" },
  { code: "Uruguay", iso: "UY", label: "Uruguay" },
  { code: "Chile", iso: "CL", label: "Chile" },
  { code: "México", iso: "MX", label: "México" },
  { code: "Colombia", iso: "CO", label: "Colombia" },
  { code: "Perú", iso: "PE", label: "Perú" },
  { code: "España", iso: "ES", label: "España" },
  { code: "Estados Unidos", iso: "US", label: "Estados Unidos" },
];

const ALIASES = new Map<string, CanonicalCountry>([
  ["default", "default"],
  ["predeterminado", "default"],
  ["neutral", "default"],
  ["ar", "Argentina"],
  ["arg", "Argentina"],
  ["argentina", "Argentina"],
  ["uy", "Uruguay"],
  ["ury", "Uruguay"],
  ["uruguay", "Uruguay"],
  ["cl", "Chile"],
  ["chl", "Chile"],
  ["chile", "Chile"],
  ["mx", "México"],
  ["mex", "México"],
  ["mexico", "México"],
  ["méxico", "México"],
  ["co", "Colombia"],
  ["col", "Colombia"],
  ["colombia", "Colombia"],
  ["pe", "Perú"],
  ["per", "Perú"],
  ["peru", "Perú"],
  ["perú", "Perú"],
  ["es", "España"],
  ["esp", "España"],
  ["espana", "España"],
  ["españa", "España"],
  ["spain", "España"],
  ["us", "Estados Unidos"],
  ["usa", "Estados Unidos"],
  ["eeuu", "Estados Unidos"],
  ["ee.uu.", "Estados Unidos"],
  ["estados unidos", "Estados Unidos"],
  ["united states", "Estados Unidos"],
]);

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function canonicalCountry(value?: string | null): CanonicalCountry | null {
  if (!value?.trim()) return null;
  return ALIASES.get(normalizeKey(value)) ?? null;
}

export function mindfulnessCountry(value?: string | null): CanonicalCountry {
  return canonicalCountry(value) ?? "default";
}

export function countryIso(value?: string | null): string {
  const canonical = mindfulnessCountry(value);
  return COUNTRY_OPTIONS.find((country) => country.code === canonical)?.iso ?? canonical.toUpperCase();
}