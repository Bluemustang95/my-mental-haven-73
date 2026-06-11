import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Clock, Mic, MapPin, FileText, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Duration = 5 | 15 | 30;

type Voice = { id: string; country: string; voiceId: string; label: string };
type Marker = { id: string; second: number; zone: string };
type BodyScan = { script: string; voices: Voice[]; markers: Marker[] };

const COUNTRIES = ["Argentina", "México", "España", "Colombia", "Chile", "Uruguay", "Perú", "Venezuela"];
const ZONES = ["Cabeza", "Mandíbula", "Cuello y hombros", "Pecho", "Abdomen", "Brazos", "Manos", "Piernas", "Pies"];

const empty: BodyScan = { script: "", voices: [], markers: [] };
const key = (d: Duration) => `resma:admin:body_scan:${d}`;

function load(d: Duration): BodyScan {
  try {
    const raw = localStorage.getItem(key(d));
    return raw ? JSON.parse(raw) : empty;
  } catch {
    return empty;
  }
}

function save(d: Duration, data: BodyScan) {
  localStorage.setItem(key(d), JSON.stringify(data));
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BodyScanManager() {
  const [duration, setDuration] = useState<Duration>(5);
  const [data, setData] = useState<BodyScan>(empty);
  const [markerOpen, setMarkerOpen] = useState(false);
  const [markerDraft, setMarkerDraft] = useState({ second: 0, zone: ZONES[0] });

  useEffect(() => {
    setData(load(duration));
  }, [duration]);

  const update = (patch: Partial<BodyScan>) => {
    const next = { ...data, ...patch };
    setData(next);
    save(duration, next);
  };

  const addVoice = () =>
    update({
      voices: [
        ...data.voices,
        { id: crypto.randomUUID(), country: COUNTRIES[0], voiceId: "", label: "" },
      ],
    });

  const updateVoice = (id: string, patch: Partial<Voice>) =>
    update({ voices: data.voices.map((v) => (v.id === id ? { ...v, ...patch } : v)) });

  const removeVoice = (id: string) =>
    update({ voices: data.voices.filter((v) => v.id !== id) });

  const addMarker = () => {
    const max = duration * 60;
    if (markerDraft.second < 0 || markerDraft.second > max) {
      toast.error(`El segundo debe estar entre 0 y ${max}`);
      return;
    }
    update({
      markers: [
        ...data.markers,
        { id: crypto.randomUUID(), second: markerDraft.second, zone: markerDraft.zone },
      ].sort((a, b) => a.second - b.second),
    });
    setMarkerOpen(false);
    setMarkerDraft({ second: 0, zone: ZONES[0] });
  };

  const removeMarker = (id: string) =>
    update({ markers: data.markers.filter((m) => m.id !== id) });

  const sortedMarkers = useMemo(
    () => [...data.markers].sort((a, b) => a.second - b.second),
    [data.markers],
  );

  const estSeconds = Math.round(data.script.length / 14);

  return (
    <div className="space-y-5">
      {/* Header + duration tabs */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-800">Body Scan</h2>
          <p className="text-xs text-slate-500">Editá el guion, las voces locales y el timeline de iluminación.</p>
        </div>
        <div className="flex gap-2 rounded-2xl border border-white/60 bg-white/55 p-1.5 backdrop-blur-xl">
          {([5, 15, 30] as Duration[]).map((d) => {
            const active = d === duration;
            return (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[#6B4EFF] text-white shadow-[0_8px_18px_-10px_rgba(107,78,255,0.6)]"
                    : "text-slate-500 hover:bg-white/70"
                }`}
              >
                <Clock size={13} /> {d} min
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Script editor */}
        <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6B4EFF]/10 text-[#6B4EFF]">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-slate-800">Guion ({duration} min)</h3>
              <p className="text-[11px] text-slate-500">Texto que narrará la voz de IA.</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
              <Save size={11} /> Autosave
            </span>
          </div>
          <Textarea
            value={data.script}
            onChange={(e) => update({ script: e.target.value })}
            placeholder="Comenzá llevando la atención a tu cuerpo…"
            className="min-h-[420px] resize-y rounded-2xl border-slate-200 bg-white/80 font-serif text-sm leading-relaxed"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{data.script.length} caracteres</span>
            <span>≈ {fmt(estSeconds)} narrados / objetivo {fmt(duration * 60)}</span>
          </div>
        </section>

        <div className="space-y-5">
          {/* Voices */}
          <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8A365]/15 text-[#B5701F]">
                <Mic size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-semibold text-slate-800">Voces por país</h3>
                <p className="text-[11px] text-slate-500">Asigná un voiceId de ElevenLabs a cada región.</p>
              </div>
              <button
                onClick={addVoice}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>

            <div className="space-y-2">
              {data.voices.length === 0 && (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                  Sin voces. Agregá la primera.
                </p>
              )}
              {data.voices.map((v) => (
                <div key={v.id} className="rounded-2xl border border-slate-100 bg-white p-3">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <select
                      value={v.country}
                      onChange={(e) => updateVoice(v.id, { country: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <Input
                      value={v.label}
                      onChange={(e) => updateVoice(v.id, { label: e.target.value })}
                      placeholder="Etiqueta (Jorge_Arg)"
                      className="h-9 text-xs"
                    />
                    <button
                      onClick={() => removeVoice(v.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Input
                    value={v.voiceId}
                    onChange={(e) => updateVoice(v.id, { voiceId: e.target.value })}
                    placeholder="ElevenLabs voiceId (ej. JBFqnCBsd6RMkjVDRZzb)"
                    className="mt-2 h-9 font-mono text-[11px]"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <MapPin size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-semibold text-slate-800">Timeline de iluminación</h3>
                <p className="text-[11px] text-slate-500">Sincronizá zonas del cuerpo con segundos del audio.</p>
              </div>
              <button
                onClick={() => setMarkerOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#6B4EFF] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                <Plus size={12} /> Marcador
              </button>
            </div>

            {sortedMarkers.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                Sin marcadores. Añadí el primero.
              </p>
            ) : (
              <ol className="relative space-y-3 border-l-2 border-slate-200 pl-5">
                {sortedMarkers.map((m) => (
                  <li key={m.id} className="relative">
                    <span className="absolute -left-[27px] top-2 h-3 w-3 rounded-full bg-[#6B4EFF] ring-4 ring-[#6B4EFF]/15" />
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-800">{fmt(m.second)}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="rounded-md bg-[#6B4EFF]/10 px-2 py-0.5 text-xs font-semibold text-[#6B4EFF]">
                          Iluminar: {m.zone}
                        </span>
                      </div>
                      <button
                        onClick={() => removeMarker(m.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <Dialog open={markerOpen} onOpenChange={setMarkerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo marcador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Segundo (0 – {duration * 60})</Label>
              <Input
                type="number"
                min={0}
                max={duration * 60}
                value={markerDraft.second}
                onChange={(e) => setMarkerDraft({ ...markerDraft, second: Number(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-slate-500">≡ {fmt(markerDraft.second)}</p>
            </div>
            <div>
              <Label>Zona corporal</Label>
              <select
                value={markerDraft.zone}
                onChange={(e) => setMarkerDraft({ ...markerDraft, zone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {ZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addMarker}
              className="w-full rounded-2xl bg-[#6B4EFF] py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Añadir marcador
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
