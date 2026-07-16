import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminButton, AdminCard, AdminModal, AdminToggle } from "@/components/admin/ui/AdminPrimitives";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export type Baremo = { label: string; min: number; max: number; color: string; message: string };
export type Option = { label: string; score: number };
export type TraitDesc = { label: string; short?: string; color?: string; description?: string; low?: string; high?: string };

export type TestDef = {
  id: string;
  code: string;
  name: string;
  kind: "symptom" | "personality";
  scale_min: number;
  scale_max: number;
  scale_labels: string[] | null;
  instructions: string | null;
  active: boolean;
  sort: number;
  baremos: Baremo[] | null;
  result_message: string | null;
  trait_descriptions: Record<string, TraitDesc> | null;
  recommended_interval_days: number | null;
};

export type TestItem = {
  id?: string;
  test_id?: string;
  sort: number;
  prompt: string;
  reverse: boolean;
  subscale: string | null;
  options: Option[] | null;
};

const emptyDef = (kind: "symptom" | "personality"): TestDef => ({
  id: "", code: "", name: "", kind, scale_min: 0, scale_max: 3,
  scale_labels: ["Nunca", "A veces", "Frecuente", "Siempre"],
  instructions: "", active: true, sort: 0,
  baremos: [], result_message: "", trait_descriptions: {},
  recommended_interval_days: null,
});

export function TestsCrudPanel({ kind }: { kind: "symptom" | "personality" }) {
  const [defs, setDefs] = useState<TestDef[]>([]);
  const [editing, setEditing] = useState<TestDef | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("test_definitions" as any).select("*").eq("kind", kind).order("sort");
    setDefs((data as any as TestDef[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [kind]);

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este test y todos sus ítems?")) return;
    await supabase.from("test_definitions" as any).delete().eq("id", id);
    toast.success("Test eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {kind === "symptom" ? "Inventarios sintomáticos (BDI, BAI, PSWQ, etc.)" : "Tests de personalidad (BIGFIVE, etc.)"}
        </p>
        <AdminButton onClick={() => setEditing(emptyDef(kind))}>
          <Plus size={14} /> Nuevo {kind === "symptom" ? "inventario" : "test"}
        </AdminButton>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Cargando…</div>
      ) : defs.length === 0 ? (
        <AdminCard className="p-8 text-center text-sm text-slate-500">
          Aún no hay tests. Creá el primero.
        </AdminCard>
      ) : (
        <div className="space-y-2">
          {defs.map((d) => (
            <AdminCard key={d.id} className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-resma-navy text-sm">{d.name}</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{d.code}</span>
                  {!d.active && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">inactivo</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Escala {d.scale_min}–{d.scale_max} · {(d.baremos?.length ?? 0)} baremos
                </div>
              </div>
              <AdminButton variant="secondary" onClick={() => setEditing(d)}><Pencil size={14} /> Editar</AdminButton>
              <AdminButton variant="danger" onClick={() => remove(d.id)}><Trash2 size={14} /></AdminButton>
            </AdminCard>
          ))}
        </div>
      )}

      {editing && (
        <TestEditor
          def={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function TestEditor({ def, onClose, onSaved }: { def: TestDef; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<TestDef>({
    ...def,
    baremos: def.baremos ?? [],
    trait_descriptions: def.trait_descriptions ?? {},
    scale_labels: def.scale_labels ?? [],
  });
  const [items, setItems] = useState<TestItem[]>([]);
  const [tab, setTab] = useState<"info" | "items" | "baremos" | "personality">("info");
  const isNew = !d.id;

  useEffect(() => {
    if (isNew) { setItems([]); return; }
    supabase.from("test_items" as any).select("*").eq("test_id", d.id).order("sort").then(({ data }) => {
      setItems(((data as any[]) ?? []).map((it) => ({
        id: it.id, test_id: it.test_id, sort: it.sort, prompt: it.prompt,
        reverse: !!it.reverse, subscale: it.subscale, options: it.options ?? null,
      })));
    });
  }, [d.id]);

  const save = async () => {
    if (!d.code.trim() || !d.name.trim()) return toast.error("Código y nombre requeridos");
    const payload: any = {
      code: d.code.trim(), name: d.name.trim(), kind: d.kind,
      scale_min: d.scale_min, scale_max: d.scale_max, scale_labels: d.scale_labels,
      instructions: d.instructions, active: d.active, sort: d.sort,
      baremos: d.baremos, result_message: d.result_message,
      trait_descriptions: d.kind === "personality" ? d.trait_descriptions : null,
      recommended_interval_days: d.recommended_interval_days,
    };
    let testId = d.id;
    if (isNew) {
      const { data, error } = await supabase.from("test_definitions" as any).insert(payload).select().single();
      if (error) return toast.error(error.message);
      testId = (data as any).id;
    } else {
      const { error } = await supabase.from("test_definitions" as any).update(payload).eq("id", d.id);
      if (error) return toast.error(error.message);
    }
    // replace items
    await supabase.from("test_items" as any).delete().eq("test_id", testId);
    if (items.length > 0) {
      const rows = items.map((it, i) => ({
        test_id: testId, sort: i, prompt: it.prompt, reverse: it.reverse,
        subscale: it.subscale, options: it.options,
      }));
      const { error } = await supabase.from("test_items" as any).insert(rows);
      if (error) return toast.error(error.message);
    }
    toast.success("Guardado");
    onSaved();
  };

  return (
    <AdminModal open onClose={onClose} title={isNew ? "Nuevo test" : `Editar: ${d.name}`} maxWidth="max-w-3xl">
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        <TabBtn active={tab === "info"} onClick={() => setTab("info")}>Información</TabBtn>
        <TabBtn active={tab === "items"} onClick={() => setTab("items")}>Ítems ({items.length})</TabBtn>
        <TabBtn active={tab === "baremos"} onClick={() => setTab("baremos")}>Baremos ({d.baremos?.length ?? 0})</TabBtn>
        {d.kind === "personality" && (
          <TabBtn active={tab === "personality"} onClick={() => setTab("personality")}>Rasgos</TabBtn>
        )}
      </div>

      {tab === "info" && (
        <div className="space-y-4">
          <Row>
            <Field label="Código *"><Input value={d.code} onChange={(v) => setD({ ...d, code: v })} placeholder="BDI, BAI, BIGFIVE…" /></Field>
            <Field label="Nombre *"><Input value={d.name} onChange={(v) => setD({ ...d, name: v })} /></Field>
          </Row>
          <Field label="Instrucciones">
            <Textarea value={d.instructions ?? ""} onChange={(v) => setD({ ...d, instructions: v })} rows={3} />
          </Field>
          <Row>
            <Field label="Escala mín"><NumInput value={d.scale_min} onChange={(v) => setD({ ...d, scale_min: v })} /></Field>
            <Field label="Escala máx"><NumInput value={d.scale_max} onChange={(v) => setD({ ...d, scale_max: v })} /></Field>
            <Field label="Orden"><NumInput value={d.sort} onChange={(v) => setD({ ...d, sort: v })} /></Field>
          </Row>
          <Field label="Tiempo recomendado entre tests (días)">
            <NumInput
              value={d.recommended_interval_days ?? 0}
              onChange={(v) => setD({ ...d, recommended_interval_days: v > 0 ? v : null })}
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Si el paciente intenta repetir el test antes de este intervalo, se le mostrará una sugerencia blanda (podrá hacerlo igual). 0 = sin sugerencia.
            </p>
          </Field>
          <Field label="Etiquetas de escala (una por opción, separadas por coma)">
            <Input
              value={(d.scale_labels ?? []).join(", ")}
              onChange={(v) => setD({ ...d, scale_labels: v.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="Nunca, A veces, Frecuente, Siempre"
            />
            <p className="mt-1 text-[10px] text-slate-400">Se usan cuando un ítem no define opciones propias.</p>
          </Field>
          <Field label="Mensaje final (se muestra bajo el resultado)">
            <Textarea value={d.result_message ?? ""} onChange={(v) => setD({ ...d, result_message: v })} rows={2}
              placeholder="Ej: Compartí este resultado con tu psicólogo/a." />
          </Field>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium text-resma-navy">Activo</p>
              <p className="text-xs text-slate-500">Los inactivos no se muestran a pacientes.</p>
            </div>
            <AdminToggle value={d.active} onChange={(v) => setD({ ...d, active: v })} />
          </div>
        </div>
      )}

      {tab === "items" && (
        <ItemsEditor items={items} setItems={setItems} scaleMin={d.scale_min} scaleMax={d.scale_max} scaleLabels={d.scale_labels ?? []} />
      )}

      {tab === "baremos" && (
        <BaremosEditor baremos={d.baremos ?? []} setBaremos={(b) => setD({ ...d, baremos: b })} />
      )}

      {tab === "personality" && d.kind === "personality" && (
        <TraitsEditor traits={d.trait_descriptions ?? {}} setTraits={(t) => setD({ ...d, trait_descriptions: t })} />
      )}

      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <AdminButton variant="secondary" onClick={onClose}>Cancelar</AdminButton>
        <AdminButton onClick={save}>Guardar</AdminButton>
      </div>
    </AdminModal>
  );
}

function ItemsEditor({ items, setItems, scaleMin, scaleMax, scaleLabels }: {
  items: TestItem[]; setItems: (v: TestItem[]) => void;
  scaleMin: number; scaleMax: number; scaleLabels: string[];
}) {
  const add = () => setItems([...items, { sort: items.length, prompt: "", reverse: false, subscale: null, options: null }]);
  const upd = (i: number, patch: Partial<TestItem>) => {
    const n = [...items]; n[i] = { ...n[i], ...patch }; setItems(n);
  };
  const del = (i: number) => setItems(items.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= items.length) return;
    const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; setItems(n);
  };

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Sin ítems. Agregá el primero.</p>}
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-center gap-1 pt-1">
              <button onClick={() => move(i, -1)} className="text-slate-400 hover:text-slate-700"><ArrowUp size={14} /></button>
              <GripVertical size={14} className="text-slate-300" />
              <button onClick={() => move(i, 1)} className="text-slate-400 hover:text-slate-700"><ArrowDown size={14} /></button>
            </div>
            <div className="flex-1 space-y-2">
              <Textarea value={it.prompt} onChange={(v) => upd(i, { prompt: v })} placeholder={`Pregunta ${i + 1}`} rows={2} />
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input type="checkbox" checked={it.reverse} onChange={(e) => upd(i, { reverse: e.target.checked })} />
                  Inversa
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Subescala:</span>
                  <input value={it.subscale ?? ""} onChange={(e) => upd(i, { subscale: e.target.value || null })}
                    className="w-20 rounded border border-slate-200 px-2 py-1 text-xs" placeholder="ej: O" />
                </div>
                <button onClick={() => del(i)} className="ml-auto text-rose-500 hover:text-rose-700"><Trash2 size={14} /></button>
              </div>
              <ItemOptionsEditor
                options={it.options}
                setOptions={(o) => upd(i, { options: o })}
                fallbackLabels={scaleLabels}
                scaleMin={scaleMin} scaleMax={scaleMax}
              />
            </div>
          </div>
        </div>
      ))}
      <AdminButton variant="secondary" onClick={add}><Plus size={14} /> Agregar ítem</AdminButton>
    </div>
  );
}

function ItemOptionsEditor({ options, setOptions, fallbackLabels, scaleMin, scaleMax }: {
  options: Option[] | null;
  setOptions: (v: Option[] | null) => void;
  fallbackLabels: string[]; scaleMin: number; scaleMax: number;
}) {
  const use = !!options;
  const toggle = () => {
    if (use) return setOptions(null);
    const base = fallbackLabels.length > 0
      ? fallbackLabels.map((label, i) => ({ label, score: scaleMin + i }))
      : Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => ({ label: `Opción ${i + 1}`, score: scaleMin + i }));
    setOptions(base);
  };
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input type="checkbox" checked={use} onChange={toggle} />
        Opciones y puntajes personalizados
      </label>
      {use && options && (
        <div className="mt-2 space-y-1.5">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={o.label} onChange={(e) => { const n = [...options]; n[i] = { ...o, label: e.target.value }; setOptions(n); }}
                className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs" />
              <input type="number" value={o.score} onChange={(e) => { const n = [...options]; n[i] = { ...o, score: Number(e.target.value) }; setOptions(n); }}
                className="w-20 rounded border border-slate-200 px-2 py-1 text-xs" />
              <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-rose-500"><Trash2 size={12} /></button>
            </div>
          ))}
          <button onClick={() => setOptions([...options, { label: "", score: 0 }])} className="text-xs text-resma-teal font-semibold">+ Opción</button>
        </div>
      )}
    </div>
  );
}

function BaremosEditor({ baremos, setBaremos }: { baremos: Baremo[]; setBaremos: (b: Baremo[]) => void }) {
  const add = () => setBaremos([...baremos, { label: "", min: 0, max: 0, color: "#7cc2c8", message: "" }]);
  const upd = (i: number, patch: Partial<Baremo>) => {
    const n = [...baremos]; n[i] = { ...n[i], ...patch }; setBaremos(n);
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">Definí los rangos clínicos. Al finalizar el test se busca el rango donde cae el puntaje total y se muestra su mensaje.</p>
      {baremos.map((b, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2">
          <Row>
            <Field label="Etiqueta"><Input value={b.label} onChange={(v) => upd(i, { label: v })} placeholder="Leve / Moderado…" /></Field>
            <Field label="Mín"><NumInput value={b.min} onChange={(v) => upd(i, { min: v })} /></Field>
            <Field label="Máx"><NumInput value={b.max} onChange={(v) => upd(i, { max: v })} /></Field>
            <Field label="Color"><input type="color" value={b.color} onChange={(e) => upd(i, { color: e.target.value })} className="h-9 w-14 rounded border border-slate-200" /></Field>
          </Row>
          <Field label="Mensaje interpretativo">
            <Textarea value={b.message} onChange={(v) => upd(i, { message: v })} rows={2} />
          </Field>
          <button onClick={() => setBaremos(baremos.filter((_, j) => j !== i))} className="text-xs text-rose-500 hover:text-rose-700"><Trash2 size={12} className="inline mr-1" />Quitar rango</button>
        </div>
      ))}
      <AdminButton variant="secondary" onClick={add}><Plus size={14} /> Agregar rango</AdminButton>
    </div>
  );
}

function TraitsEditor({ traits, setTraits }: { traits: Record<string, TraitDesc>; setTraits: (t: Record<string, TraitDesc>) => void }) {
  const [newKey, setNewKey] = useState("");
  const keys = Object.keys(traits);
  const upd = (k: string, patch: Partial<TraitDesc>) => setTraits({ ...traits, [k]: { ...traits[k], ...patch } });
  const del = (k: string) => { const n = { ...traits }; delete n[k]; setTraits(n); };
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Descripciones de rasgos (código de subescala como O, C, E, A, N). Se muestran al usuario tras completar el test.</p>
      {keys.map((k) => (
        <div key={k} className="rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-resma-navy text-sm">{k}</span>
            <button onClick={() => del(k)} className="text-rose-500"><Trash2 size={14} /></button>
          </div>
          <Row>
            <Field label="Nombre"><Input value={traits[k].label ?? ""} onChange={(v) => upd(k, { label: v })} /></Field>
            <Field label="Corto"><Input value={traits[k].short ?? ""} onChange={(v) => upd(k, { short: v })} /></Field>
            <Field label="Color"><input type="color" value={traits[k].color ?? "#7cc2c8"} onChange={(e) => upd(k, { color: e.target.value })} className="h-9 w-14 rounded border border-slate-200" /></Field>
          </Row>
          <Field label="Descripción general">
            <Textarea value={traits[k].description ?? ""} onChange={(v) => upd(k, { description: v })} rows={2} />
          </Field>
          <Row>
            <Field label="Puntaje bajo">
              <Textarea value={traits[k].low ?? ""} onChange={(v) => upd(k, { low: v })} rows={2} />
            </Field>
            <Field label="Puntaje alto">
              <Textarea value={traits[k].high ?? ""} onChange={(v) => upd(k, { high: v })} rows={2} />
            </Field>
          </Row>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3">
        <Input value={newKey} onChange={setNewKey} placeholder="Código (O, C, E…)" />
        <AdminButton variant="secondary" onClick={() => {
          if (!newKey.trim() || traits[newKey]) return;
          setTraits({ ...traits, [newKey.trim()]: { label: "", description: "", low: "", high: "", color: "#7cc2c8" } });
          setNewKey("");
        }}><Plus size={14} /> Agregar rasgo</AdminButton>
      </div>
    </div>
  );
}

// ── UI atoms ───────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`relative px-4 py-2 text-sm font-semibold ${active ? "text-resma-navy" : "text-slate-500 hover:text-resma-navy"}`}>
      {children}
      {active && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t bg-resma-teal" />}
    </button>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</label>{children}</div>;
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-resma-teal focus:outline-none" />;
}
function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-resma-teal focus:outline-none" />;
}
function Textarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-resma-teal focus:outline-none resize-none" />;
}
