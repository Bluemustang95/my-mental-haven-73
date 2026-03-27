import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import HistoryPanel from "@/components/journal/HistoryPanel";

const emotionOptions = ["Miedo", "Calma", "Confusión", "Alegría", "Ansiedad", "Nostalgia", "Tristeza", "Curiosidad"];
const themeOptions = ["Caída", "Persecución", "Volar", "Agua", "Familiar", "Lugar desconocido", "Animal", "Persona conocida"];

export default function DreamLog() {
  const navigate = useNavigate();
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
    // TODO: save to Supabase dream_log
    setSaved(true);
    setTimeout(() => navigate("/diario"), 1500);
  };

  if (saved) {
    return (
      <div className="flex min-h-screen items-center justify-center safe-area-top">
        <p className="font-display text-sm font-medium text-success">Sueño registrado ✓</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display text-lg font-semibold">Registro de Sueños</h1>
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
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">Calidad de sueño</p>
                  <p className="text-sm font-body">{item.sleep_quality}/10</p>
                </div>
              )}
              {item.lucid && <p className="text-xs text-accent-foreground">✓ Sueño lúcido</p>}
              {item.emotions && item.emotions.length > 0 && (
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">Emociones</p>
                  <div className="flex flex-wrap gap-1">{item.emotions.map(e => (
                    <span key={e} className="rounded-full border border-accent bg-accent/10 px-2 py-0.5 text-[10px] text-accent-foreground">{e}</span>
                  ))}</div>
                </div>
              )}
              {item.themes && item.themes.length > 0 && (
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">Temas</p>
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
        {/* Description */}
        <div>
          <label className="mb-2 block font-display text-xs uppercase tracking-wider text-muted-foreground">
            ¿Qué soñaste?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describí tu sueño con el mayor detalle posible..."
            className="min-h-[140px] w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm font-body leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>

        {/* Sleep quality */}
        <div>
          <label className="mb-2 block font-display text-xs uppercase tracking-wider text-muted-foreground">
            Calidad de sueño: {sleepQuality}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(parseInt(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        {/* Lucid */}
        <button
          onClick={() => setLucid(!lucid)}
          className={cn(
            "w-full rounded-2xl border p-3 text-left font-display text-sm transition-all",
            lucid ? "border-accent bg-accent/10" : "border-border bg-card text-muted-foreground"
          )}
        >
          {lucid ? "✓ Sueño lúcido" : "¿Fue un sueño lúcido?"}
        </button>

        {/* Emotions */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Tag size={14} className="text-muted-foreground" />
            <span className="font-display text-xs text-muted-foreground uppercase tracking-wider">Emociones</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {emotionOptions.map((e) => (
              <button
                key={e}
                onClick={() => toggle(emotions, setEmotions, e)}
                className={cn(
                  "rounded-full border px-3 py-1 font-display text-[11px] transition-all",
                  emotions.includes(e) ? "border-accent bg-accent/10 text-accent-foreground" : "border-border text-muted-foreground"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Themes */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Tag size={14} className="text-muted-foreground" />
            <span className="font-display text-xs text-muted-foreground uppercase tracking-wider">Temas</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {themeOptions.map((t) => (
              <button
                key={t}
                onClick={() => toggle(themes, setThemes, t)}
                className={cn(
                  "rounded-full border px-3 py-1 font-display text-[11px] transition-all",
                  themes.includes(t) ? "border-accent bg-accent/10 text-accent-foreground" : "border-border text-muted-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={!description.trim()}
        className={cn(
          "mt-6 w-full rounded-2xl py-3 font-display text-sm font-medium transition-all",
          description.trim() ? "bg-primary text-primary-foreground active:scale-[0.98]" : "bg-muted text-muted-foreground"
        )}
      >
        Guardar sueño
      </button>
    </div>
  );
}
