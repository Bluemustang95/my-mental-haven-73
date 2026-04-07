import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Calendar, MessageCircle, Brain, Mail, Trophy, Moon, Mic, Square, Play, Trash, Send, MoreHorizontal, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Keyword triggers for dynamic recommendations ── */
const relationshipWords = ["mamá", "papá", "madre", "padre", "amigo", "amiga", "pareja", "novio", "novia", "hermano", "hermana", "familia", "hijo", "hija", "compañero", "compañera", "jefe", "colega"];
const temporalWords = ["hoy", "ayer", "mañana", "esta mañana", "esta tarde", "esta noche", "anoche", "día", "semana"];
const introspectionWords = ["siento", "creo", "pienso", "me doy cuenta", "me cuesta", "necesito", "quiero", "debería", "culpa", "miedo", "vergüenza", "enojo", "tristeza", "ansiedad", "angustia", "soledad"];
const dreamWords = ["soñé", "sueño", "pesadilla", "dormí", "desperté", "insomnio"];
const achievementWords = ["logré", "pude", "avancé", "conseguí", "superé", "orgulloso", "orgullosa", "celebro"];

interface Recommendation {
  id: string;
  label: string;
  icon: typeof Users;
  path: string;
}

const allRecommendations: Record<string, Recommendation> = {
  vinculos:    { id: "vinculos",    label: "Vínculos",            icon: Users,          path: "/diario/vinculos" },
  timeline:    { id: "timeline",    label: "Línea del día",       icon: Calendar,       path: "/diario/dia" },
  dialogo:     { id: "dialogo",     label: "Diálogo interno",     icon: MessageCircle,  path: "/diario/dialogo" },
  pensamientos:{ id: "pensamientos",label: "Registro de pensamientos", icon: Brain,     path: "/diario/pensamientos" },
  cartas:      { id: "cartas",      label: "Cartas sin enviar",   icon: Mail,           path: "/diario/cartas" },
  suenos:      { id: "suenos",      label: "Registro de sueños",  icon: Moon,           path: "/diario/suenos" },
  logros:      { id: "logros",      label: "Micro-logros",        icon: Trophy,         path: "/diario/logros" },
};

function detectRecommendations(text: string): Recommendation[] {
  const lower = text.toLowerCase();
  const results: Recommendation[] = [];
  if (relationshipWords.some(w => lower.includes(w))) results.push(allRecommendations.vinculos);
  if (temporalWords.some(w => lower.includes(w))) results.push(allRecommendations.timeline);
  if (dreamWords.some(w => lower.includes(w))) results.push(allRecommendations.suenos);
  if (achievementWords.some(w => lower.includes(w))) results.push(allRecommendations.logros);
  if (introspectionWords.some(w => lower.includes(w))) {
    results.push(allRecommendations.dialogo);
    if (lower.length > 200) results.push(allRecommendations.pensamientos);
  }
  if (lower.length > 300 && !results.find(r => r.id === "cartas")) {
    results.push(allRecommendations.cartas);
  }
  return results;
}

/* ── Emotion config (text-only, no emojis) ── */
const primaryEmotions = [
  { label: "Calma" },
  { label: "Alegría" },
  { label: "Tristeza" },
];

const allEmotions = [
  "Calma", "Alegría", "Tristeza", "Ansiedad", "Enojo",
  "Gratitud", "Confusión", "Esperanza", "Culpa", "Alivio",
  "Vergüenza", "Orgullo", "Frustración", "Amor", "Nostalgia",
];

export default function Diario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = user ? `diario_draft_${user.id}` : "diario_draft";

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setContent(parsed.content || "");
        setSelectedEmotions(parsed.emotions || []);
      } catch { /* ignore */ }
    }
  }, [draftKey]);

  // Autosave to localStorage
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (content.trim()) {
        localStorage.setItem(draftKey, JSON.stringify({ content, emotions: selectedEmotions }));
        setLastSaved(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
      }
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [content, selectedEmotions, draftKey]);

  // Dynamic recommendations
  const recommendations = useMemo(() => detectRecommendations(content), [content]);

  const toggleEmotion = (e: string) => {
    setSelectedEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { toast.error("No se pudo acceder al micrófono"); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };
  const removeAudio = () => { if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); setAudioBlob(null); };

  // Save entry
  const save = async () => {
    if (!content.trim() || !user) return;
    setSaving(true);
    try {
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
      });
      localStorage.removeItem(draftKey);
      setContent("");
      setSelectedEmotions([]);
      removeAudio();
      toast.success("Entrada guardada ✓");
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const hasContent = content.trim().length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFB] dark:bg-background safe-area-top">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-14 pb-2">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Diario</h1>
          <p className="text-xs text-muted-foreground">Tu espacio seguro para escribir.</p>
        </div>
        <button
          onClick={() => navigate("/diario/historial")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border/50 shadow-sm transition-all active:scale-95"
          aria-label="Historial"
        >
          <Clock size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* ── Autosave indicator ── */}
      <AnimatePresence>
        {lastSaved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 text-[10px] text-muted-foreground/60"
          >
            Borrador guardado · {lastSaved}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Writing area (compact — no flex-1, auto height) ── */}
      <div className="px-6 pt-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribí lo que necesites soltar..."
          className="w-full min-h-[120px] resize-none bg-transparent text-foreground text-[15px] leading-relaxed font-body placeholder:text-muted-foreground/50 focus:outline-none"
          autoFocus
        />
      </div>

      {/* ── Inline save button (ghost, compact) ── */}
      <AnimatePresence>
        {hasContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-1"
          >
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all active:bg-muted/40 disabled:opacity-50"
            >
              {saving ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
              ) : (
                <Send size={12} />
              )}
              Guardar entrada
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Voice recording (compact, right after save) ── */}
      <div className="px-6 py-1 flex items-center gap-3">
        {!isRecording && !audioUrl && (
          <button onClick={startRecording} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-1.5 text-xs text-muted-foreground transition active:bg-muted">
            <Mic size={14} />
            Nota de voz
          </button>
        )}
        {isRecording && (
          <button onClick={stopRecording} className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            <Square size={14} />
            <span className="animate-pulse">Grabando...</span>
          </button>
        )}
        {audioUrl && (
          <div className="flex items-center gap-2">
            <button onClick={() => new Audio(audioUrl).play()} className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <Play size={12} />
              Reproducir
            </button>
            <button onClick={removeAudio} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10">
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Emotion selector (text-only, no emojis) ── */}
      <div className="px-6 py-2">
        <div className="flex items-center gap-2">
          {primaryEmotions.map((em) => (
            <button
              key={em.label}
              onClick={() => toggleEmotion(em.label)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                selectedEmotions.includes(em.label)
                  ? "border-accent bg-accent/10 text-accent-foreground"
                  : "border-border/60 text-muted-foreground"
              }`}
            >
              {em.label}
            </button>
          ))}
          <button
            onClick={() => setShowEmotionPicker(true)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
              selectedEmotions.some(e => !primaryEmotions.find(p => p.label === e))
                ? "border-accent bg-accent/10 text-accent-foreground"
                : "border-border/60 text-muted-foreground"
            }`}
          >
            <MoreHorizontal size={14} />
            Otro
          </button>
        </div>

        {/* Selected non-primary emotions as chips */}
        {selectedEmotions.filter(e => !primaryEmotions.find(p => p.label === e)).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selectedEmotions.filter(e => !primaryEmotions.find(p => p.label === e)).map(e => (
              <span key={e} className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent-foreground flex items-center gap-1">
                {e}
                <button onClick={() => toggleEmotion(e)} className="hover:text-destructive"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Emotion Picker Modal ── */}
      <AnimatePresence>
        {showEmotionPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowEmotionPicker(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#FDFCFB] dark:bg-card shadow-2xl p-6 pb-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-foreground">¿Qué sentís?</h3>
                <button onClick={() => setShowEmotionPicker(false)} className="rounded-full p-1.5 text-muted-foreground active:bg-muted">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allEmotions.map((e) => (
                  <button
                    key={e}
                    onClick={() => toggleEmotion(e)}
                    className={`rounded-full border px-3.5 py-2 text-[12px] font-medium transition-all ${
                      selectedEmotions.includes(e)
                        ? "border-accent bg-accent/15 text-accent-foreground"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Dynamic recommendations ── */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="px-6 pb-2"
          >
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
              Herramientas sugeridas
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec) => {
                const Icon = rec.icon;
                return (
                  <motion.button
                    key={rec.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => navigate(rec.path)}
                    className="flex items-center gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-3 py-2 text-[11px] font-medium text-accent-foreground transition-all active:scale-95"
                  >
                    <Icon size={14} className="text-accent" />
                    {rec.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom padding for nav */}
      <div className="h-24" />
    </div>
  );
}
