import { useNavigate } from "react-router-dom";
import { Wind, Eye, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const OPTIONS = [
  {
    to: "/herramientas/mindfulness/respiracion",
    icon: Wind,
    title: "Respiración",
    desc: "Patrones guiados.",
    from: "#FB923C",
    to2: "#FCD34D",
  },
  {
    to: "/herramientas/mindfulness/observar",
    icon: Eye,
    title: "Mira el presente",
    desc: "Pensamientos y sentidos.",
    from: "#60A5FA",
    to2: "#A78BFA",
  },
  {
    to: "/herramientas/mindfulness/describir",
    icon: MessageSquare,
    title: "Ver los hechos",
    desc: "Hechos vs. juicios.",
    from: "#A78BFA",
    to2: "#F472B6",
  },
];

export function QuickAddSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-none bg-[#FDFCFB] px-5 pb-8 pt-5"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-base font-semibold text-[#101927]">
            Agregar otro ejercicio
          </SheetTitle>
          <p className="text-xs text-muted-foreground">Elegí el camino.</p>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {OPTIONS.map((o) => (
            <button
              key={o.to}
              onClick={() => {
                onOpenChange(false);
                navigate(o.to);
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm active:scale-[0.99] transition"
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${o.from}, ${o.to2})` }}
              >
                <o.icon size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-semibold text-[#101927]">{o.title}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-1">{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
