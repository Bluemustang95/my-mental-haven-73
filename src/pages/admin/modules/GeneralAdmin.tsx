import { useEffect, useMemo, useState } from "react";
import { AdminButton, AdminCard, AdminPageHeader } from "@/components/admin/ui/AdminPrimitives";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Volume2, DollarSign, Plus, Trash2, Play } from "lucide-react";

const COUNTRIES = [
  { code: "default", label: "Predeterminado" },
  { code: "Argentina", label: "Argentina" },
  { code: "Uruguay", label: "Uruguay" },
  { code: "Chile", label: "Chile" },
  { code: "México", label: "México" },
  { code: "Colombia", label: "Colombia" },
  { code: "Perú", label: "Perú" },
  { code: "España", label: "España" },
  { code: "Estados Unidos", label: "Estados Unidos" },
];

type VoiceRow = { id?: string; country_code: string; gender: "female" | "male"; voice_id: string; label: string | null };
type ElevenVoice = { voice_id: string; name: string; labels?: Record<string, string> };

export default function GeneralAdmin() {
  const [tab, setTab] = useState<"voces" | "gasto">("voces");
  return (
    <>
      <AdminPageHeader title="General" subtitle="Configuración global de voces y gasto de IA" />
      <div className="px-8 py-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("voces")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === "voces" ? "bg-resma-teal text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <Volume2 size={14} /> Voces
          </button>
          <button
            onClick={() => setTab("gasto")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === "gasto" ? "bg-resma-teal text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <DollarSign size={14} /> Gasto de IA
          </button>
        </div>
      </div>
      <div className="admin-scroll flex-1 overflow-y-auto px-8 pb-32">
        {tab === "voces" ? <VoicesTab /> : <SpendTab />}
      </div>
    </>
  );
}

function VoicesTab() {
  const [rows, setRows] = useState<VoiceRow[]>([]);
  const [voices, setVoices] = useState<ElevenVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: v }] = await Promise.all([
        supabase.from("voice_settings").select("*"),
        supabase.functions.invoke("list-elevenlabs-voices"),
      ]);
      setRows((data as VoiceRow[]) ?? []);
      const voicesData = (v as { voices?: ElevenVoice[] } | null)?.voices ?? [];
      setVoices(voicesData);
      setLoading(false);
    })();
  }, []);

  const getRow = (country: string, gender: "female" | "male"): VoiceRow => {
    return rows.find(r => r.country_code === country && r.gender === gender)
      ?? { country_code: country, gender, voice_id: "", label: null };
  };

  const setRow = (row: VoiceRow) => {
    setRows(prev => {
      const idx = prev.findIndex(r => r.country_code === row.country_code && r.gender === row.gender);
      if (idx >= 0) { const next = [...prev]; next[idx] = row; return next; }
      return [...prev, row];
    });
  };

  const save = async () => {
    setSaving(true);
    const payload = rows.filter(r => r.voice_id).map(r => ({
      country_code: r.country_code, gender: r.gender, voice_id: r.voice_id, label: r.label,
    }));
    const { error } = await supabase.from("voice_settings").upsert(payload, { onConflict: "country_code,gender" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Voces guardadas");
  };

  if (loading) return <div className="text-slate-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Cargando…</div>;

  return (
    <AdminCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-resma-navy">Voces por país</h2>
          <p className="text-xs text-slate-500 mt-0.5">Elegí la voz femenina y masculina que se usará según el país del usuario. La persona podrá elegir en Ajustes cuál prefiere.</p>
        </div>
        <AdminButton variant="purple" onClick={save}>
          {saving ? <Loader2 className="animate-spin" size={14} /> : null} Guardar cambios
        </AdminButton>
      </div>

      <div className="grid grid-cols-[180px_1fr_1fr] gap-3 pb-2 border-b border-slate-100 mb-2">
        <div className="text-[10px] font-admin-label text-slate-500">País</div>
        <div className="text-[10px] font-admin-label text-slate-500">Voz femenina</div>
        <div className="text-[10px] font-admin-label text-slate-500">Voz masculina</div>
      </div>

      {COUNTRIES.map(c => {
        const f = getRow(c.code, "female");
        const m = getRow(c.code, "male");
        return (
          <div key={c.code} className="grid grid-cols-[180px_1fr_1fr] gap-3 py-2.5 border-b border-slate-50 items-center">
            <div className="text-sm font-semibold text-resma-navy">{c.label}</div>
            <VoiceSelect voices={voices} row={f} onChange={setRow} />
            <VoiceSelect voices={voices} row={m} onChange={setRow} />
          </div>
        );
      })}
    </AdminCard>
  );
}

function VoiceSelect({ voices, row, onChange }: { voices: ElevenVoice[]; row: VoiceRow; onChange: (r: VoiceRow) => void }) {
  const current = voices.find(v => v.voice_id === row.voice_id);
  return (
    <div className="flex items-center gap-2">
      <select
        value={row.voice_id}
        onChange={(e) => {
          const v = voices.find(x => x.voice_id === e.target.value);
          onChange({ ...row, voice_id: e.target.value, label: v?.name ?? null });
        }}
        className="flex-1 h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm text-resma-navy"
      >
        <option value="">— Sin configurar —</option>
        {voices.map(v => (
          <option key={v.voice_id} value={v.voice_id}>{v.name}{v.labels?.accent ? ` · ${v.labels.accent}` : ""}</option>
        ))}
      </select>
      {current && (
        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{current.labels?.accent ?? ""}</span>
      )}
    </div>
  );
}

function SpendTab() {
  const [rows, setRows] = useState<{ feature: string; total: number; count: number; chars: number }[]>([]);
  const [byUser, setByUser] = useState<{ user_id: string | null; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"30d" | "7d" | "month">("30d");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date();
      if (range === "7d") since.setDate(since.getDate() - 7);
      else if (range === "30d") since.setDate(since.getDate() - 30);
      else since.setDate(1);

      const { data } = await supabase
        .from("ai_usage_log")
        .select("feature, cost_usd, chars, user_id")
        .gte("created_at", since.toISOString());
      const list = (data as { feature: string; cost_usd: number; chars: number; user_id: string | null }[]) ?? [];

      const byFeat = new Map<string, { total: number; count: number; chars: number }>();
      const byU = new Map<string | null, number>();
      for (const r of list) {
        const f = byFeat.get(r.feature) ?? { total: 0, count: 0, chars: 0 };
        f.total += Number(r.cost_usd ?? 0);
        f.count += 1;
        f.chars += Number(r.chars ?? 0);
        byFeat.set(r.feature, f);
        byU.set(r.user_id, (byU.get(r.user_id) ?? 0) + Number(r.cost_usd ?? 0));
      }
      setRows([...byFeat.entries()].map(([feature, v]) => ({ feature, ...v })).sort((a, b) => b.total - a.total));
      setByUser([...byU.entries()].map(([user_id, total]) => ({ user_id, total })).sort((a, b) => b.total - a.total).slice(0, 10));
      setLoading(false);
    })();
  }, [range]);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["7d", "30d", "month"] as const).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              range === r ? "bg-resma-teal text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {r === "7d" ? "Últimos 7 días" : r === "30d" ? "Últimos 30 días" : "Mes en curso"}
          </button>
        ))}
      </div>

      <AdminCard className="p-6">
        <div className="text-[10px] font-admin-label text-slate-500 mb-1">Gasto total</div>
        <div className="text-3xl font-bold text-resma-navy">${grandTotal.toFixed(2)} USD</div>
        <div className="text-xs text-slate-500 mt-1">
          {loading ? "Cargando…" : `${rows.reduce((s, r) => s + r.count, 0)} llamadas · ${rows.reduce((s, r) => s + r.chars, 0).toLocaleString()} caracteres`}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="text-sm font-semibold text-resma-navy mb-3">Por feature</h3>
        {rows.length === 0 && <div className="text-xs text-slate-400">Sin llamadas registradas en este período.</div>}
        <div className="space-y-2">
          {rows.map(r => {
            const pct = grandTotal > 0 ? (r.total / grandTotal) * 100 : 0;
            return (
              <div key={r.feature}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-resma-navy">{r.feature}</span>
                  <span className="text-slate-500">${r.total.toFixed(3)} · {r.count} llamadas</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-resma-teal" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <h3 className="text-sm font-semibold text-resma-navy mb-3">Top usuarios (por costo)</h3>
        {byUser.length === 0 && <div className="text-xs text-slate-400">Sin datos.</div>}
        <div className="space-y-1.5">
          {byUser.map((u, i) => (
            <div key={u.user_id ?? "anon"} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-600 font-mono truncate max-w-[60%]">#{i + 1} · {u.user_id ?? "anónimo"}</span>
              <span className="font-semibold text-resma-navy">${u.total.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
