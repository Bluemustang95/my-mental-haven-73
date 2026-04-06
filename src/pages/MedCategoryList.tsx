import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pill } from "lucide-react";
import { motion } from "framer-motion";

type DrugInfo = {
  id: string;
  name: string;
  genericName: string;
};

const drugsByCategory: Record<string, { title: string; drugs: DrugInfo[] }> = {
  antidepresivos: {
    title: "Antidepresivos",
    drugs: [
      { id: "sertralina", name: "Sertralina", genericName: "ISRS" },
      { id: "escitalopram", name: "Escitalopram", genericName: "ISRS" },
      { id: "fluoxetina", name: "Fluoxetina", genericName: "ISRS" },
      { id: "venlafaxina", name: "Venlafaxina", genericName: "IRSN" },
      { id: "duloxetina", name: "Duloxetina", genericName: "IRSN" },
      { id: "mirtazapina", name: "Mirtazapina", genericName: "NaSSA" },
      { id: "bupropion", name: "Bupropión", genericName: "IRND" },
    ],
  },
  ansioliticos: {
    title: "Ansiolíticos",
    drugs: [
      { id: "clonazepam", name: "Clonazepam", genericName: "Benzodiacepina" },
      { id: "alprazolam", name: "Alprazolam", genericName: "Benzodiacepina" },
      { id: "lorazepam", name: "Lorazepam", genericName: "Benzodiacepina" },
      { id: "diazepam", name: "Diazepam", genericName: "Benzodiacepina" },
      { id: "pregabalina", name: "Pregabalina", genericName: "Gabapentinoide" },
    ],
  },
  estabilizadores: {
    title: "Estabilizadores del ánimo",
    drugs: [
      { id: "litio", name: "Litio", genericName: "Estabilizador" },
      { id: "valproato", name: "Ácido Valproico", genericName: "Anticonvulsivante" },
      { id: "lamotrigina", name: "Lamotrigina", genericName: "Anticonvulsivante" },
      { id: "carbamazepina", name: "Carbamazepina", genericName: "Anticonvulsivante" },
    ],
  },
  antipsicoticos: {
    title: "Antipsicóticos",
    drugs: [
      { id: "quetiapina", name: "Quetiapina", genericName: "Atípico" },
      { id: "risperidona", name: "Risperidona", genericName: "Atípico" },
      { id: "olanzapina", name: "Olanzapina", genericName: "Atípico" },
      { id: "aripiprazol", name: "Aripiprazol", genericName: "Atípico" },
    ],
  },
  hipnoticos: {
    title: "Hipnóticos / Para dormir",
    drugs: [
      { id: "zolpidem", name: "Zolpidem", genericName: "No benzodiacepínico" },
      { id: "melatonina", name: "Melatonina", genericName: "Hormona" },
      { id: "trazodona", name: "Trazodona", genericName: "Antidepresivo sedante" },
    ],
  },
  estimulantes: {
    title: "Estimulantes (TDAH)",
    drugs: [
      { id: "metilfenidato", name: "Metilfenidato", genericName: "Estimulante" },
      { id: "atomoxetina", name: "Atomoxetina", genericName: "No estimulante" },
      { id: "lisdexanfetamina", name: "Lisdexanfetamina", genericName: "Estimulante" },
    ],
  },
};

export default function MedCategoryList() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const category = drugsByCategory[categoryId ?? ""] ?? { title: "Categoría", drugs: [] };

  return (
    <div className="px-5 pt-14 pb-28 safe-area-top bg-[hsl(var(--background))]">
      <button onClick={() => navigate("/mi-proceso/medicacion/biblioteca")} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Tipo de medicamentos
      </button>
      <h1 className="mb-1 font-display text-xl font-semibold">{category.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Tocá un medicamento para ver más información.</p>

      <div className="space-y-2.5">
        {category.drugs.map((drug, i) => (
          <motion.button
            key={drug.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => navigate(`/mi-proceso/medicacion/biblioteca/${categoryId}/${drug.id}`)}
            className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] active:bg-muted transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
              <Pill size={16} className="text-[hsl(var(--accent-foreground))]" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-medium">{drug.name}</p>
              <p className="text-[11px] text-muted-foreground">{drug.genericName}</p>
            </div>
            <ArrowLeft size={14} className="text-muted-foreground rotate-180" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export { drugsByCategory };
