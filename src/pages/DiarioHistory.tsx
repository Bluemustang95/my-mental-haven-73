import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Clock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface JournalEntry {
  id: string;
  content: string;
  emotion_tags: string[] | null;
  created_at: string | null;
  prompt: string | null;
}

const ALLOWED = /<\/?(b|strong|i|em|br|div|p)\b[^>]*>/gi;
function sanitize(html: string): string {
  if (!html) return "";
  // strip script/style and disallowed tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(?!\/?(b|strong|i|em|br|div|p)\b)[^>]*>/gi, "");
}

function plainText(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();
}

function summarize(html: string, maxLen = 110): string {
  const t = plainText(html);
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + "…";
}

export default function DiarioHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<JournalEntry | null>(null);
  const [toDelete, setToDelete] = useState<JournalEntry | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("journal_entries")
      .select("id, content, emotion_tags, created_at, prompt")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setEntries((data as JournalEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setToDelete(null);
    setViewing(null);
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) {
      toast({ title: "No se pudo eliminar", description: error.message, variant: "destructive" });
      load();
    } else {
      toast({ title: "Entrada eliminada" });
    }
  };

  const fmt = (dateStr: string | null) => {
    if (!dateStr) return { day: "", month: "", weekday: "", time: "", full: "" };
    const d = new Date(dateStr);
    return {
      day: format(d, "d"),
      month: format(d, "MMM", { locale: es }).replace(".", ""),
      weekday: format(d, "EEEE", { locale: es }),
      time: format(d, "HH:mm"),
      full: format(d, "d 'de' MMMM 'de' yyyy", { locale: es }),
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFCFB] via-[#F7F5F1] to-[#FDFCFB] dark:from-background dark:via-background dark:to-background safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-14 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/diario")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border/50 text-muted-foreground active:scale-95 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground tracking-tight">
              Historial
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {entries.length} {entries.length === 1 ? "entrada" : "entradas"} guardadas
            </p>
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="px-4 pb-12 space-y-2.5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Todavía no tenés entradas.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Escribí algo en tu diario para comenzar.
            </p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const d = fmt(entry.created_at);
            return (
              <motion.button
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.25 }}
                onClick={() => setViewing(entry)}
                className="group w-full overflow-hidden rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-3.5 text-left shadow-[0_1px_8px_-4px_hsl(var(--foreground)/0.06)] transition-all active:scale-[0.99] hover:border-accent/40 hover:shadow-[0_4px_14px_-6px_hsl(var(--foreground)/0.08)]"
              >
                <div className="flex gap-3.5">
                  {/* Date capsule */}
                  <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20">
                    <span className="font-display text-lg font-bold leading-none text-foreground">
                      {d.day}
                    </span>
                    <span className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                      {d.month}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="capitalize font-medium text-accent-foreground/80">
                        {d.weekday}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <Clock size={9} className="text-muted-foreground/60" />
                      <span>{d.time}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-snug text-foreground/85 font-body line-clamp-2">
                      {summarize(entry.content)}
                    </p>
                    {entry.emotion_tags && entry.emotion_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.emotion_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-accent/10 border border-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {entry.emotion_tags.length > 3 && (
                          <span className="text-[9px] text-muted-foreground self-center">
                            +{entry.emotion_tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* View entry sheet */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent
          side="bottom"
          className="h-[88vh] rounded-t-3xl border-t border-border/50 bg-[#FDFCFB] dark:bg-background p-0"
        >
          {viewing && (
            <div className="flex h-full flex-col">
              <SheetHeader className="px-6 pt-6 pb-3 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="font-display text-lg font-semibold capitalize">
                      {fmt(viewing.created_at).weekday}, {fmt(viewing.created_at).full}
                    </SheetTitle>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {fmt(viewing.created_at).time} hs
                    </p>
                  </div>
                  <button
                    onClick={() => setToDelete(viewing)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive transition active:scale-95 hover:bg-destructive/15"
                    aria-label="Eliminar entrada"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {viewing.emotion_tags && viewing.emotion_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {viewing.emotion_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 pb-10">
                <div
                  className="font-body text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: sanitize(viewing.content) }}
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La entrada se borrará para siempre de tu diario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
