import { useEffect, useState } from "react";
import { Globe2, Check, X } from "lucide-react";
import { getCountryOverride, setCountryOverride } from "@/lib/countryOverride";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COMMON_COUNTRIES: { code: string; label: string; ar: boolean }[] = [
  { code: "AR", label: "Argentina", ar: true },
  { code: "UY", label: "Uruguay", ar: false },
  { code: "CL", label: "Chile", ar: false },
  { code: "MX", label: "México", ar: false },
  { code: "ES", label: "España", ar: false },
  { code: "CO", label: "Colombia", ar: false },
  { code: "PE", label: "Perú", ar: false },
  { code: "US", label: "Estados Unidos", ar: false },
];

export default function CountryViewSwitcher() {
  const [current, setCurrent] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    setCurrent(getCountryOverride());
  }, []);

  const apply = (code: string | null) => {
    setCountryOverride(code);
    setCurrent(code);
    toast.success(code ? `Viendo la app como ${code}` : "Override eliminado — uso tu país real.");
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Globe2 size={22} /> Vista por país
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cambiá temporalmente cómo se ve la app de paciente para vos (solo admin).
            Útil para probar funcionalidades que dependen del país, como la red de profesionales argentina.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">País simulado actualmente</p>
          <p className="font-display text-xl font-bold mt-1">
            {current ?? "— (uso país real del perfil)"}
          </p>
        </div>
        {current && (
          <Button variant="outline" size="sm" onClick={() => apply(null)} className="gap-1.5">
            <X size={14} /> Quitar override
          </Button>
        )}
      </div>

      <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Países frecuentes</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {COMMON_COUNTRIES.map((c) => {
          const active = current === c.code;
          return (
            <button
              key={c.code}
              onClick={() => apply(c.code)}
              className={`relative rounded-xl border p-3 text-left transition ${
                active ? "border-resma-teal bg-resma-teal/10 text-resma-teal" : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <p className="font-mono text-xs font-bold">{c.code}</p>
              <p className="text-sm font-medium mt-0.5">{c.label}</p>
              {c.ar && <p className="text-[10px] text-emerald-600 mt-0.5">✓ flujo terapia activo</p>}
              {active && <Check size={14} className="absolute top-2 right-2" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-semibold mb-2">Código ISO personalizado</p>
        <div className="flex gap-2">
          <Input
            value={custom}
            maxLength={3}
            onChange={(e) => setCustom(e.target.value.toUpperCase())}
            placeholder="Ej. BR"
            className="font-mono"
          />
          <Button disabled={!custom.trim()} onClick={() => { apply(custom.trim()); setCustom(""); }}>
            Aplicar
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Se guarda solo en este navegador. Recargá la app de paciente para ver los cambios.
        </p>
      </div>
    </div>
  );
}
