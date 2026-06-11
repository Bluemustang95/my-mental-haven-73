import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Music2, Play, Pause } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Sound = { id: string; title: string; url: string; enabled: boolean };

const STORAGE_KEY = "resma:admin:breathing_sounds";

const SEED: Sound[] = [
  { id: "rain", title: "Lluvia suave", url: "", enabled: true },
  { id: "ambient", title: "Ambient cálido", url: "", enabled: true },
  { id: "silence", title: "Silencio", url: "", enabled: true },
];

function load(): Sound[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    return JSON.parse(raw);
  } catch {
    return SEED;
  }
}

function save(list: Sound[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function BreathingSoundsManager() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sound | null>(null);
  const [form, setForm] = useState<Sound>({ id: "", title: "", url: "", enabled: true });
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => setSounds(load()), []);

  const persist = (next: Sound[]) => {
    setSounds(next);
    save(next);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ id: crypto.randomUUID(), title: "", url: "", enabled: true });
    setOpen(true);
  };

  const openEdit = (s: Sound) => {
    setEditing(s);
    setForm(s);
    setOpen(true);
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Poné un título");
      return;
    }
    const next = editing
      ? sounds.map((s) => (s.id === editing.id ? form : s))
      : [...sounds, form];
    persist(next);
    setOpen(false);
    toast.success(editing ? "Sonido actualizado" : "Sonido creado");
  };

  const remove = (id: string) => {
    persist(sounds.filter((s) => s.id !== id));
    toast.success("Eliminado");
  };

  const toggle = (id: string) => {
    persist(sounds.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-800">Sonidos de respiración</h2>
          <p className="text-xs text-slate-500">Música ambiente disponible durante las prácticas.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-2xl bg-[#6B4EFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(107,78,255,0.6)] transition hover:brightness-110"
        >
          <Plus size={16} /> Nuevo sonido
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sounds.map((s) => (
          <div
            key={s.id}
            className="group rounded-3xl border border-white/60 bg-white/70 p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6B4EFF]/10 text-[#6B4EFF]">
                  <Music2 size={18} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-800">{s.title}</h3>
                  <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-500" title={s.url}>
                    {s.url || "Sin archivo"}
                  </p>
                </div>
              </div>
              <Switch checked={s.enabled} onCheckedChange={() => toggle(s.id)} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                disabled={!s.url}
                onClick={() => setPlayingId(playingId === s.id ? null : s.id)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
              >
                {playingId === s.id ? <Pause size={12} /> : <Play size={12} />}
                {playingId === s.id ? "Pausar" : "Probar"}
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(s)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {playingId === s.id && s.url && (
              <audio src={s.url} autoPlay controls className="mt-3 w-full" onEnded={() => setPlayingId(null)} />
            )}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar sonido" : "Nuevo sonido"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lluvia suave" />
            </div>
            <div>
              <Label>URL del audio (mp3 / m4a / ogg)</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
              {form.url && <audio src={form.url} controls className="mt-2 w-full" />}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <Label className="text-sm">Publicado</Label>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            </div>
            <button
              onClick={submit}
              className="w-full rounded-2xl bg-[#6B4EFF] py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              {editing ? "Guardar cambios" : "Crear sonido"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
