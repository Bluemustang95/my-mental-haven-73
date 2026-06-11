import { useState } from "react";
import { Eye, Hand, Ear, Wind, Coffee, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DEFAULT_GROUNDING_SCRIPTS,
  getGroundingScripts,
  setGroundingScripts,
  type GroundingScripts,
} from "@/lib/groundingScripts";

const FIELDS: { key: keyof GroundingScripts; label: string; icon: any; color: string }[] = [
  { key: "see", label: "5 · Ver", icon: Eye, color: "#FCD34D" },
  { key: "touch", label: "4 · Tocar", icon: Hand, color: "#A78BFA" },
  { key: "hear", label: "3 · Escuchar", icon: Ear, color: "#60A5FA" },
  { key: "smell", label: "2 · Oler", icon: Wind, color: "#34D399" },
  { key: "taste", label: "1 · Saborear", icon: Coffee, color: "#FB923C" },
];

export function Grounding54321Manager() {
  const [scripts, setScripts] = useState<GroundingScripts>(() => getGroundingScripts());

  const save = () => {
    setGroundingScripts(scripts);
    toast.success("Scripts del 5-4-3-2-1 guardados");
  };

  const reset = () => {
    setScripts(DEFAULT_GROUNDING_SCRIPTS);
    setGroundingScripts(DEFAULT_GROUNDING_SCRIPTS);
    toast.success("Restaurado a valores por defecto");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-800">5-4-3-2-1 · Scripts de reflexión</h2>
        <p className="text-xs text-slate-500">
          Texto que se muestra (y narra) tras completar cada sentido. La voz usada es la Voz Global configurada en Configuración.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.key}
              className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl"
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}25`, color: f.color }}
                >
                  <Icon size={16} />
                </div>
                <h3 className="font-display text-sm font-semibold text-slate-800">{f.label}</h3>
              </div>
              <Textarea
                value={scripts[f.key]}
                onChange={(e) => setScripts({ ...scripts, [f.key]: e.target.value })}
                rows={4}
                className="resize-y rounded-2xl border-slate-200 bg-white/80 font-serif text-sm leading-relaxed"
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          className="flex items-center gap-2 rounded-2xl bg-[#6B4EFF] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(107,78,255,0.6)] hover:brightness-110"
        >
          <Save size={14} /> Guardar cambios
        </button>
        <button
          onClick={reset}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Restaurar
        </button>
      </div>
    </div>
  );
}
