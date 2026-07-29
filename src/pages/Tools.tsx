import { BentoGrid } from "@/components/recursos/BentoGrid";

export default function Tools() {
  return (
    <div className="min-h-screen bg-background pb-32 safe-area-top">
      <div className="mx-auto max-w-md px-5 pt-14">
        <p className="font-display text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Tu espacio
        </p>
        <h1 className="mt-1 font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-foreground">
          Recursos
        </h1>

        <div className="mt-7">
          <BentoGrid />
        </div>
      </div>
    </div>
  );
}
