import { useState } from "react";
import { Leaf, Sparkles, Save, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DEFAULT_HOJAS_MESSAGES,
  getHojasMessages,
  setHojasMessages,
  type HojasMessages,
} from "@/lib/hojasMessages";

type Props = { onGoTo54321?: () => void };

export function MiraElPresenteManager({ onGoTo54321 }: Props) {
  const [msgs, setMsgs] = useState<HojasMessages>(() => getHojasMessages());

  const save = () => {
    setHojasMessages(msgs);
    toast.success("Mensajes guardados");
  };

  const reset = () => {
    setMsgs(DEFAULT_HOJAS_MESSAGES);
    setHojasMessages(DEFAULT_HOJAS_MESSAGES);
    toast.success("Restaurado a valores por defecto");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-800">Mira el presente</h2>
        <p className="text-xs text-slate-500">
          Gestioná los dos ejercicios del módulo: 5-4-3-2-1 y Las hojas pasar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* A. 5-4-3-2-1 */}
        <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#60A5FA]/15 text-[#3B82F6]">
              <Sparkles size={16} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-slate-800">5-4-3-2-1</h3>
              <p className="text-[11px] text-slate-500">Gestión del 54321</p>
            </div>
          </div>
          <p className="rounded-2xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
            Editá los scripts de reflexión de cada sentido en la sub-pestaña "5-4-3-2-1".
          </p>
          {onGoTo54321 && (
            <button
              onClick={onGoTo54321}
              className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <ExternalLink size={12} /> Ir a la gestión del 54321
            </button>
          )}
        </section>

        {/* B. Las hojas pasar */}
        <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Leaf size={16} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-slate-800">Las hojas pasar</h3>
              <p className="text-[11px] text-slate-500">Animación de pensamientos (nubes / hojas / tren).</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Mensaje antes de iniciar</label>
              <Textarea
                value={msgs.pre}
                onChange={(e) => setMsgs({ ...msgs, pre: e.target.value })}
                rows={4}
                placeholder="Observá tus pensamientos como si fueran..."
                className="resize-y rounded-2xl border-slate-200 bg-white/80 font-serif text-sm leading-relaxed"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Mensaje al finalizar</label>
              <Textarea
                value={msgs.post}
                onChange={(e) => setMsgs({ ...msgs, post: e.target.value })}
                rows={4}
                placeholder="Notaste cómo los pensamientos vienen y van..."
                className="resize-y rounded-2xl border-slate-200 bg-white/80 font-serif text-sm leading-relaxed"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={save}
                className="flex items-center gap-2 rounded-2xl bg-[#6B4EFF] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(107,78,255,0.6)] hover:brightness-110"
              >
                <Save size={14} /> Guardar cambios
              </button>
              <button
                onClick={reset}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Restaurar
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
