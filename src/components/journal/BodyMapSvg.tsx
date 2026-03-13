import { cn } from "@/lib/utils";

const bodyParts = [
  { id: "head", label: "Cabeza", cx: 100, cy: 30, rx: 18, ry: 22 },
  { id: "neck", label: "Cuello", cx: 100, cy: 60, rx: 8, ry: 8 },
  { id: "chest", label: "Pecho", cx: 100, cy: 95, rx: 30, ry: 22 },
  { id: "stomach", label: "Estómago", cx: 100, cy: 130, rx: 25, ry: 18 },
  { id: "left_shoulder", label: "Hombro izq.", cx: 60, cy: 78, rx: 14, ry: 10 },
  { id: "right_shoulder", label: "Hombro der.", cx: 140, cy: 78, rx: 14, ry: 10 },
  { id: "left_arm", label: "Brazo izq.", cx: 45, cy: 120, rx: 10, ry: 28 },
  { id: "right_arm", label: "Brazo der.", cx: 155, cy: 120, rx: 10, ry: 28 },
  { id: "pelvis", label: "Pelvis", cx: 100, cy: 160, rx: 25, ry: 14 },
  { id: "left_leg", label: "Pierna izq.", cx: 82, cy: 220, rx: 12, ry: 45 },
  { id: "right_leg", label: "Pierna der.", cx: 118, cy: 220, rx: 12, ry: 45 },
  { id: "left_foot", label: "Pie izq.", cx: 82, cy: 280, rx: 10, ry: 8 },
  { id: "right_foot", label: "Pie der.", cx: 118, cy: 280, rx: 10, ry: 8 },
];

interface BodyMapSvgProps {
  selected: string[];
  onToggle: (part: string) => void;
}

export function BodyMapSvg({ selected, onToggle }: BodyMapSvgProps) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 300" className="h-[280px] w-auto">
        {/* Body outline */}
        <ellipse cx="100" cy="30" rx="20" ry="24" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <line x1="100" y1="54" x2="100" y2="70" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <ellipse cx="100" cy="110" rx="35" ry="45" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <line x1="65" y1="85" x2="35" y2="150" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <line x1="135" y1="85" x2="165" y2="150" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <line x1="85" y1="155" x2="80" y2="275" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <line x1="115" y1="155" x2="120" y2="275" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Interactive zones */}
        {bodyParts.map((part) => {
          const isSelected = selected.includes(part.id);
          return (
            <ellipse
              key={part.id}
              cx={part.cx}
              cy={part.cy}
              rx={part.rx}
              ry={part.ry}
              className={cn(
                "cursor-pointer transition-all",
                isSelected
                  ? "fill-destructive/40 stroke-destructive"
                  : "fill-transparent stroke-transparent hover:fill-muted/50 hover:stroke-muted-foreground/30"
              )}
              strokeWidth="1.5"
              onClick={() => onToggle(part.id)}
            />
          );
        })}
      </svg>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {selected.map((id) => {
            const part = bodyParts.find((p) => p.id === id);
            return (
              <span
                key={id}
                className="rounded-full bg-destructive/10 px-2.5 py-0.5 font-display text-[10px] text-destructive"
              >
                {part?.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
