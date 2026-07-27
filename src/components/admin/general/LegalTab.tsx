import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AdminButton, AdminCard } from "@/components/admin/ui/AdminPrimitives";
import { loadLegalLinks, saveLegalLinks } from "@/lib/legalLinks";

export function LegalTab() {
  const [privacy, setPrivacy] = useState("");
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLegalLinks()
      .then((l) => {
        setPrivacy(l.privacy);
        setTerms(l.terms);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await saveLegalLinks({ privacy: privacy.trim(), terms: terms.trim() });
      toast.success("Enlaces legales guardados");
    } catch {
      toast.error("No se pudieron guardar los enlaces");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Cargando…
      </div>
    );
  }

  return (
    <AdminCard>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Enlaces legales</h3>
          <p className="mt-1 text-xs text-slate-500">
            Se muestran en la primera pantalla del onboarding. Se abren en una pestaña nueva.
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">
            URL de Políticas de Privacidad
          </span>
          <input
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
            placeholder="https://resma.app/privacidad"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-resma-teal/40"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">
            URL de Términos y Condiciones
          </span>
          <input
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="https://resma.app/terminos"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-resma-teal/40"
          />
        </label>

        <AdminButton onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </AdminButton>
      </div>
    </AdminCard>
  );
}
