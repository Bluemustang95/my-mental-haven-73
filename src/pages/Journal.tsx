import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const prompts = [
  "¿Qué fue lo mejor de tu día?",
  "¿Hay algo que te preocupe hoy?",
  "¿Qué aprendiste sobre vos hoy?",
  "Describí un momento en que te sentiste en paz.",
  "¿Qué necesitás soltar?",
  "¿Qué te agradecés hoy?",
];

const emotionOptions = [
  "Calma", "Alegría", "Tristeza", "Ansiedad", "Enojo",
  "Gratitud", "Confusión", "Esperanza", "Culpa", "Alivio",
];

export default function Journal() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleEmotion = (e: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  const pickPrompt = () => {
    const p = prompts[Math.floor(Math.random() * prompts.length)];
    setCurrentPrompt(p);
    setShowPrompt(true);
  };

  const save = () => {
    if (!content.trim()) return;
    // TODO: save to Supabase journal_entries
    setSaved(true);
    setTimeout(() => navigate("/herramientas"), 1500);
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/herramientas")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Diario</h1>
      </div>

      {saved ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="font-display text-sm font-medium text-success">Entrada guardada ✓</p>
          </div>
        </div>
      ) : (
        <>
          {/* Prompt suggestion */}
          {!showPrompt ? (
            <button
              onClick={pickPrompt}
              className="mb-4 rounded-xl border border-dashed border-border bg-card p-3 text-center font-display text-xs text-muted-foreground transition-colors active:bg-muted"
            >
              ¿Necesitás inspiración? Tocá para un prompt
            </button>
          ) : (
            <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-3">
              <p className="text-sm italic text-muted-foreground">{currentPrompt}</p>
              <button onClick={pickPrompt} className="mt-1 font-display text-[10px] text-accent-foreground underline">
                Otro prompt
              </button>
            </div>
          )}

          {/* Text editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribí lo que necesites..."
            className="mb-4 min-h-[200px] flex-1 resize-none rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-body"
            autoFocus
          />

          {/* Emotion tags */}
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <Tag size={14} className="text-muted-foreground" />
              <span className="font-display text-xs text-muted-foreground uppercase tracking-wider">Emociones</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {emotionOptions.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEmotion(e)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-display text-[11px] transition-all",
                    selectedEmotions.includes(e)
                      ? "border-accent bg-accent/10 text-accent-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={save}
            disabled={!content.trim()}
            className={cn(
              "w-full rounded-2xl py-3 font-display text-sm font-medium transition-all",
              content.trim()
                ? "bg-primary text-primary-foreground active:scale-[0.98]"
                : "bg-muted text-muted-foreground"
            )}
          >
            Guardar entrada
          </button>
        </>
      )}
    </div>
  );
}
