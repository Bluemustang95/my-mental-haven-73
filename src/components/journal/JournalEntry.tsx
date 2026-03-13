import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tag, Microphone, Stop, Play, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export default function JournalEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const removeAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
  };

  const save = async () => {
    if (!content.trim() || !user) return;
    setSaving(true);

    try {
      // Upload voice note if exists
      let voicePath: string | null = null;
      if (audioBlob) {
        const fileName = `${user.id}/${Date.now()}.webm`;
        const { error } = await supabase.storage.from("voice-notes").upload(fileName, audioBlob);
        if (!error) voicePath = fileName;
      }

      await supabase.from("journal_entries").insert({
        user_id: user.id,
        content: content.trim(),
        emotion_tags: selectedEmotions.length > 0 ? selectedEmotions : null,
        prompt: currentPrompt || null,
      });

      toast.success("Entrada guardada");
      navigate("/herramientas/journal");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/herramientas/journal")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Escritura libre</h1>
      </div>

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
        className="mb-4 min-h-[180px] flex-1 resize-none rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        autoFocus
      />

      {/* Voice recording */}
      <div className="mb-4 flex items-center gap-3">
        {!isRecording && !audioUrl && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 font-display text-xs text-muted-foreground transition-colors active:bg-muted"
          >
            <Microphone size={16} weight="duotone" />
            Grabar nota de voz
          </button>
        )}
        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 font-display text-xs text-destructive"
          >
            <Stop size={16} weight="fill" />
            <span className="animate-pulse">Grabando...</span>
          </button>
        )}
        {audioUrl && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => new Audio(audioUrl).play()}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 font-display text-xs text-muted-foreground"
            >
              <Play size={14} weight="fill" />
              Reproducir
            </button>
            <button onClick={removeAudio} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10">
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>

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

      <button
        onClick={save}
        disabled={!content.trim() || saving}
        className={cn(
          "w-full rounded-2xl py-3 font-display text-sm font-medium transition-all",
          content.trim()
            ? "bg-primary text-primary-foreground active:scale-[0.98]"
            : "bg-muted text-muted-foreground"
        )}
      >
        {saving ? "Guardando..." : "Guardar entrada"}
      </button>
    </div>
  );
}
