import { useState } from "react";
import { ArrowLeft, Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import HistoryPanel from "@/components/journal/HistoryPanel";
import { useConsistentBack } from "@/hooks/useConsistentBack";

const emotionOptions = ["Miedo", "Calma", "Confusión", "Alegría", "Ansiedad", "Nostalgia", "Tristeza", "Curiosidad"];
const themeOptions = ["Caída", "Persecución", "Volar", "Agua", "Familiar", "Lugar desconocido", "Animal", "Persona conocida"];

export default function DreamLog() {
  const goBack = useConsistentBack("/diario/herramientas");
  const [description, setDescription] = useState("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [lucid, setLucid] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const save = () => {
    if (!description.trim()) return;
    setSaved(true);
    setTimeout(() => goBack(), 1500);
  };

  if (saved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-resource-regulation-bg text-resource-regulation-accent safe-area-top">
        <p className="font-mindful text-2xl">Sueño registrado ✓</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-resource-regulation-bg px-5 pt-14 pb-4 text-resource-regulation-accent safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-regulation-accent/15 bg-card/75 text-resource-regulation-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-3xl leading-tight">Registro de sueños</h1>
          <p className="font-sans text-xs leading-5 text-resource-regulation-accent/65">Anotá y explorá</p>
        </div>
        <HistoryPanel<{ id: string; created_at: string | null; description: string; emotions: string[] | null; themes: string[] | null; sleep_quality: number | null; lucid: boolean | null; dream_date: string | null }>
          tableName="dream_log"
          renderItem={(item) => (
            <p className="text-xs text-foreground truncate">{item.description.slice(0, 60)}...</p>
          )}
          renderDetail={(item) => (
            <div className="space-y-3">
              <div>
                <p className="font-display text-xs text-muted-foreground mb-1">Sueño</p>
                <p className="text-sm font-body whitespace-pre-wrap leading-relaxed">{item.description}</p>
              </div>
              {item.sleep_quality && (
                <div><p className="font-display text-xs text-muted-foreground mb-1">Calidad de sueño</p><p className="text-sm font-body">{item.sleep_quality}/10</p></div>
              )}
              {item.lucid && <p className="text-xs text-accent-foreground">✓ Sueño lúcido</p>}
              {item.emotions && item.emotions.length > 0 && (
                <div><p className="font-display text-xs text-muted-foreground mb-1">Emociones</p>
                  <div className="flex flex-wrap gap-1">{item.emotions.map(e => (
                    <span key={e} className="rounded-full border border-accent bg-accent/10 px-2 py-0.5 text-[10px] text-accent-foreground">{e}</span>
                  ))}</div>
                </div>
              )}
              {item.themes && item.themes.length > 0 && (
                <div><p className="font-display text-xs text-muted-foreground mb-1">Temas</p>
                  <div className="flex flex-wrap gap-1">{item.themes.map(t => (
                    <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                  ))}</div>
                </div>
              )}
            </div>
          )}
        />
      </div>

      <div className="flex-1 space-y-5">
        <div>
          <label className="mb-2 block font-display text-xs font-semibold uppercase tracking-wider text-resource-regulation-accent/70">
            ¿Qué soñaste?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describí tu sueño con el mayor detalle posible..."
            autoFocus
            className="min-h-[140px] w-full resize-none rounded-2xl border border-resource-regulation-accent/15 bg-card/75 p-4 font-sans text-sm leading-relaxed text-resource-regulation-accent placeholder:text-resource-regulation-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-regulation-accent/20"
          />
        </div>

        <div>
          <label className="mb-2 block font-display text-xs font-semibold uppercase tracking-wider text-resource-regulation-accent/70">
            Calidad de sueño: {sleepQuality}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(parseInt(e.target.value))}
            className="w-full accent-resource-regulation-accent"
          />
        </div>

        <button
          onClick={() => setLucid(!lucid)}
          className={cn(
            "w-full rounded-2xl border p-3 text-left font-display text-sm font-semibold transition-all",
            lucid
              ? "border-resource-regulation-accent bg-resource-regulation-accent/10 text-resource-regulation-accent"
              : "border-resource-regulation-accent/15 bg-card/75 text-resource-regulation-accent/70"
          )}
        >
          {lucid ? "✓ Sueño lúcido" : "¿Fue un sueño lúcido?"}
        </button>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Tag size={14} className="text-resource-regulation-accent/70" />
            <span className="font-display text-xs font-semibold uppercase tracking-wider text-resource-regulation-accent/70">Emociones</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {emotionOptions.map((e) => (
              <button
                key={e}
                onClick={() => toggle(emotions, setEmotions, e)}
                className={cn(
                  "rounded-full border px-3 py-1 font-display text-[11px] font-semibold transition-all",
                  emotions.includes(e)
                    ? "border-resource-regulation-accent bg-resource-regulation-accent/15 text-resource-regulation-accent"
                    : "border-resource-regulation-accent/20 bg-card/55 text-resource-regulation-accent/70"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Tag size={14} className="text-resource-regulation-accent/70" />
            <span className="font-display text-xs font-semibold uppercase tracking-wider text-resource-regulation-accent/70">Temas</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {themeOptions.map((t) => (
              <button
                key={t}
                onClick={() => toggle(themes, setThemes, t)}
                className={cn(
                  "rounded-full border px-3 py-1 font-display text-[11px] font-semibold transition-all",
                  themes.includes(t)
                    ? "border-resource-regulation-accent bg-resource-regulation-accent/15 text-resource-regulation-accent"
                    : "border-resource-regulation-accent/20 bg-card/55 text-resource-regulation-accent/70"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={!description.trim()}
        className={cn(
          "mt-6 w-full rounded-2xl py-3 font-display text-sm font-semibold transition-all",
          description.trim() ? "bg-resource-regulation-accent text-primary-foreground active:scale-[0.98]" : "bg-card/55 text-resource-regulation-accent/45"
        )}
      >
        Guardar sueño
      </button>
    </div>
  );
}
