import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pill } from "lucide-react";
import { motion } from "framer-motion";

type DrugInfo = {
  id: string;
  name: string;
  genericName: string;
  standardDoses: string[];
};

const drugsByCategory: Record<string, { title: string; drugs: DrugInfo[] }> = {
  antidepresivos: {
    title: "Antidepresivos",
    drugs: [
      { id: "sertralina", name: "Sertralina", genericName: "ISRS", standardDoses: ["25mg", "50mg", "100mg", "150mg", "200mg"] },
      { id: "escitalopram", name: "Escitalopram", genericName: "ISRS", standardDoses: ["5mg", "10mg", "15mg", "20mg"] },
      { id: "fluoxetina", name: "Fluoxetina", genericName: "ISRS", standardDoses: ["10mg", "20mg", "40mg", "60mg"] },
      { id: "venlafaxina", name: "Venlafaxina", genericName: "IRSN", standardDoses: ["37.5mg", "75mg", "150mg", "225mg"] },
      { id: "duloxetina", name: "Duloxetina", genericName: "IRSN", standardDoses: ["30mg", "60mg", "90mg", "120mg"] },
      { id: "mirtazapina", name: "Mirtazapina", genericName: "NaSSA", standardDoses: ["15mg", "30mg", "45mg"] },
      { id: "bupropion", name: "Bupropión", genericName: "IRND", standardDoses: ["150mg", "300mg"] },
    ],
  },
  ansioliticos: {
    title: "Ansiolíticos",
    drugs: [
      { id: "clonazepam", name: "Clonazepam", genericName: "Benzodiacepina", standardDoses: ["0.25mg", "0.5mg", "1mg", "2mg"] },
      { id: "alprazolam", name: "Alprazolam", genericName: "Benzodiacepina", standardDoses: ["0.25mg", "0.5mg", "1mg", "2mg"] },
      { id: "lorazepam", name: "Lorazepam", genericName: "Benzodiacepina", standardDoses: ["0.5mg", "1mg", "2mg", "2.5mg"] },
      { id: "diazepam", name: "Diazepam", genericName: "Benzodiacepina", standardDoses: ["2mg", "5mg", "10mg"] },
      { id: "pregabalina", name: "Pregabalina", genericName: "Gabapentinoide", standardDoses: ["25mg", "75mg", "150mg", "300mg"] },
    ],
  },
  estabilizadores: {
    title: "Estabilizadores del ánimo",
    drugs: [
      { id: "litio", name: "Litio", genericName: "Estabilizador", standardDoses: ["300mg", "450mg", "600mg", "900mg"] },
      { id: "valproato", name: "Ácido Valproico", genericName: "Anticonvulsivante", standardDoses: ["250mg", "500mg", "750mg", "1000mg"] },
      { id: "lamotrigina", name: "Lamotrigina", genericName: "Anticonvulsivante", standardDoses: ["25mg", "50mg", "100mg", "200mg"] },
      { id: "carbamazepina", name: "Carbamazepina", genericName: "Anticonvulsivante", standardDoses: ["200mg", "400mg", "600mg"] },
    ],
  },
  antipsicoticos: {
    title: "Antipsicóticos",
    drugs: [
      { id: "quetiapina", name: "Quetiapina", genericName: "Atípico", standardDoses: ["25mg", "50mg", "100mg", "200mg", "300mg"] },
      { id: "risperidona", name: "Risperidona", genericName: "Atípico", standardDoses: ["0.5mg", "1mg", "2mg", "3mg", "4mg"] },
      { id: "olanzapina", name: "Olanzapina", genericName: "Atípico", standardDoses: ["2.5mg", "5mg", "10mg", "15mg", "20mg"] },
      { id: "aripiprazol", name: "Aripiprazol", genericName: "Atípico", standardDoses: ["5mg", "10mg", "15mg", "20mg", "30mg"] },
    ],
  },
  hipnoticos: {
    title: "Hipnóticos / Para dormir",
    drugs: [
      { id: "zolpidem", name: "Zolpidem", genericName: "No benzodiacepínico", standardDoses: ["5mg", "10mg"] },
      { id: "melatonina", name: "Melatonina", genericName: "Hormona", standardDoses: ["1mg", "3mg", "5mg", "10mg"] },
      { id: "trazodona", name: "Trazodona", genericName: "Antidepresivo sedante", standardDoses: ["25mg", "50mg", "100mg", "150mg"] },
    ],
  },
  estimulantes: {
    title: "Estimulantes (TDAH)",
    drugs: [
      { id: "metilfenidato", name: "Metilfenidato", genericName: "Estimulante", standardDoses: ["10mg", "18mg", "20mg", "36mg", "54mg"] },
      { id: "atomoxetina", name: "Atomoxetina", genericName: "No estimulante", standardDoses: ["10mg", "18mg", "25mg", "40mg", "60mg", "80mg"] },
      { id: "lisdexanfetamina", name: "Lisdexanfetamina", genericName: "Estimulante", standardDoses: ["20mg", "30mg", "40mg", "50mg", "60mg", "70mg"] },
    ],
  },
};

export default function MedCategoryList() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as "add" | "info") ?? "info";
  const category = drugsByCategory[categoryId ?? ""] ?? { title: "Categoría", drugs: [] };

  const goToDrug = (drugId: string) => {
    if (mode === "add") {
      navigate(`/mi-proceso/medicacion/ajustes/${categoryId}/${drugId}`);
    } else {
      navigate(`/mi-proceso/medicacion/biblioteca/${categoryId}/${drugId}?mode=info`);
    }
  };

  return (
    <div className="px-5 pt-14 pb-28 safe-area-top bg-[hsl(var(--background))]">
      <button onClick={() => navigate(`/mi-proceso/medicacion/biblioteca?mode=${mode}`)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Tipo de medicamentos
      </button>
      <h1 className="mb-1 font-display text-xl font-semibold">{category.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {mode === "add" ? "Elegí el medicamento para configurar la toma." : "Tocá un medicamento para ver más información."}
      </p>

      <div className="space-y-2.5">
        {category.drugs.map((drug, i) => (
          <motion.button
            key={drug.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => goToDrug(drug.id)}
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
