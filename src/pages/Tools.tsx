import { BentoGrid } from "@/components/recursos/BentoGrid";

export default function Tools() {
  return (
    <div className="min-h-screen bg-background pb-32 safe-area-top">
      <div className="mx-auto max-w-md px-5 pt-12">
        <h1 className="font-display text-3xl font-bold text-foreground">Recursos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Elegí el camino de hoy.</p>

        <div className="mt-6">
          <BentoGrid />
        </div>
      </div>
    </div>
  );
}
