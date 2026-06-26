import { ArrowRight, User } from "lucide-react";

export function BigFiveCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div>
      <p className="mb-1 font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-[#7c3aed]">
        Tu perfil de personalidad
      </p>
      <p className="mb-2.5 text-[11.5px] text-[#64748b]">Evaluación trimestral de rasgos cognitivos estables.</p>
      <button
        onClick={onOpen}
        className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[20px] p-3.5 text-left text-white shadow-[0_10px_24px_-14px_rgba(124,58,237,0.4)] transition active:scale-[0.99]"
        style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)" }}
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
          <User size={18} />
        </div>
        <div className="relative flex-1">
          <p className="font-serif text-[14px] font-medium leading-tight">Rasgos Big Five (BFI-20)</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/85">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span>Estable · hace 3 meses</span>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
          <ArrowRight size={15} />
        </div>
      </button>
    </div>
  );
}
