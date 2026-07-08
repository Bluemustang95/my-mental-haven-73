// src/components/onboarding/OnboardingShell.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  OnboardingResponses,
  calculateHomeModules,
} from "@/lib/onboardingAlgorithm";

// Textos y copys de la pantalla final según tu documento
const categoryContent: Record<string, { titulo: string; descripcion: string }> = {
  sueno: {
    titulo: "Armamos tu plan de mejora del sueño",
    descripcion: "Tu descanso importa más de lo que creés. Construimos un camino para que puedas recuperar la calma nocturna, soltar el cuerpo y despertar con más energía.",
  },
  ansiedad: {
    titulo: "Armamos tu plan de manejo de la ansiedad",
    descripcion: "Aprender a soltar el control es un proceso. Preparamos herramientas para que puedas calmar tu mente, reducir el ruido interno y encontrar más equilibrio en el día a día.",
  },
  recuperacion: {
    titulo: "Armamos tu plan de recuperación emocional",
    descripcion: "Las emociones no se borran, se procesan. Diseñamos un espacio para que puedas transitar lo que sentís, sanar a tu propio ritmo y avanzar con más liviandad.",
  },
  activacion: {
    titulo: "Armamos tu plan de activación y motivación",
    descripcion: "Reconectar con lo que te mueve es el primer paso. Tu plan está pensado para ayudarte a retomar acciones, crear nuevos hábitos y recuperar esa chispa que a veces se apaga.",
  },
  autoconocimiento: {
    titulo: "Armamos tu plan de autoconocimiento",
    descripcion: "Mirarte por dentro es un acto de valentía. Construimos un camino para que puedas pausar, entenderte mejor y construir una relación más honesta y compasiva con vos mismo/a.",
  },
  integral: {
    titulo: "Armamos tu plan integral de bienestar",
    descripcion: "Tu bienestar tiene muchas dimensiones. Diseñamos un plan completo y equilibrado para que puedas trabajar distintos aspectos de tu salud emocional a tu propio ritmo.",
  },
};

export const OnboardingShell = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    category: string;
    dynamic: string[];
  } | null>(null);

  // Estado para guardar las respuestas del usuario
  const [responses, setResponses] = useState<OnboardingResponses>({
    q1: [],
    q2: "",
    q3: "",
    q4: "",
  });

  const handleNext = () => {
    // Validaciones simples para no avanzar si no seleccionó nada
    if (step === 1 && responses.q1.length === 0) return toast.error("Seleccioná al menos una opción");
    if (step === 2 && !responses.q2) return toast.error("Seleccioná una opción");
    if (step === 3 && !responses.q3) return toast.error("Seleccioná una opción");

    if (step < 4) {
      setStep(step + 1);
    } else {
      if (!responses.q4) return toast.error("Seleccioná una opción");
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setIsSaving(true);
    try {
      // 1. Calculamos la categoría y los módulos usando el algoritmo que creamos en el Paso 1
      const result = calculateHomeModules(responses);
      setFinalResult(result);
      
      // Pasamos al "paso 5" (Pantalla final de resultados)
      setStep(5);

      // 2. Intentamos guardar en Supabase (Opcional, si el usuario ya está logueado)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         await supabase
          .from("patient_app_profiles")
          .update({
             onboarding_category: result.category,
             // Aquí a futuro podrías guardar result.dynamic (los módulos) en una columna JSON
          })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Error guardando onboarding:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = () => {
    // Redirigir al inicio
    navigate("/");
    toast.success("¡Plan configurado correctamente!");
  };

  // ---- RENDERIZADO DE LAS PREGUNTAS ----

  if (step === 1) {
    return (
      <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-2">¿Qué brújula guía tu viaje?</h2>
        <p className="text-muted-foreground mb-6">Podés elegir más de una opción</p>
        <div className="space-y-3 mb-8">
          {[
            { id: "almohada", label: "Hacer las paces con mi almohada" },
            { id: "control", label: "Aprender a soltar el control" },
            { id: "ruido", label: "Apagar el ruido mental" },
            { id: "chispa", label: "Reconectar con mi chispa" },
            { id: "refugio", label: "Construir un refugio interno" },
            { id: "tristeza", label: "Navegar la tristeza sin ahogarme" },
            { id: "mente", label: "Enfocar mi mente dispersa" },
            { id: "creativo", label: "Despertar mi lado creativo" },
          ].map((opt) => (
            <Card
              key={opt.id}
              className={`p-4 cursor-pointer transition-colors ${
                responses.q1.includes(opt.id) ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => {
                setResponses(prev => ({
                  ...prev,
                  q1: prev.q1.includes(opt.id)
                    ? prev.q1.filter(i => i !== opt.id)
                    : [...prev.q1, opt.id]
                }));
              }}
            >
              <div className="flex items-center justify-between">
                <span>{opt.label}</span>
                {responses.q1.includes(opt.id) && <Check className="w-5 h-5 text-primary" />}
              </div>
            </Card>
          ))}
        </div>
        <Button onClick={handleNext} className="w-full">Siguiente <ChevronRight className="w-4 h-4 ml-2"/></Button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-2">¿Qué maleta querés aligerar?</h2>
        <p className="text-muted-foreground mb-6">Elegí la que más resuene hoy</p>
        <div className="space-y-3 mb-8">
          {[
            { id: "nino", label: "Abrazar a mi niño/a interior" },
            { id: "habito", label: "Despedirme de un hábito caduco" },
            { id: "pausa", label: "Pausar y mirarme por dentro" },
            { id: "comida", label: "Hacer las paces con la comida" },
            { id: "no", label: "Aprender a decir 'no' sin culpa" },
            { id: "perdon", label: "Perdonarme por el pasado" },
          ].map((opt) => (
            <Card
              key={opt.id}
              className={`p-4 cursor-pointer transition-colors ${
                responses.q2 === opt.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setResponses(prev => ({ ...prev, q2: opt.id }))}
            >
              <span>{opt.label}</span>
            </Card>
          ))}
        </div>
        <Button onClick={handleNext} className="w-full">Siguiente <ChevronRight className="w-4 h-4 ml-2"/></Button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-2">¿Cómo dormís últimamente?</h2>
        <div className="space-y-3 mb-8">
          {[
            { id: "reparador", label: "Reparador (Me levanto descansado/a)" },
            { id: "interrumpido", label: "Interrumpido (Me despierto varias veces)" },
            { id: "cuesta", label: "Cuesta dormirme (Tardo mucho en conciliar)" },
            { id: "pesadillas", label: "Pesadillas (Sueños intensos o angustia)" },
          ].map((opt) => (
            <Card
              key={opt.id}
              className={`p-4 cursor-pointer transition-colors ${
                responses.q3 === opt.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setResponses(prev => ({ ...prev, q3: opt.id }))}
            >
              <span>{opt.label}</span>
            </Card>
          ))}
        </div>
        <Button onClick={handleNext} className="w-full">Siguiente <ChevronRight className="w-4 h-4 ml-2"/></Button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-2">¿Cómo te gusta aprender?</h2>
        <div className="space-y-3 mb-8">
          {[
            { id: "lectura", label: "Lecturas y teoría (Aprendo leyendo)" },
            { id: "audios", label: "Audios y meditaciones (Prefiero escuchar)" },
            { id: "practico", label: "Ejercicios prácticos (Aprendo haciendo)" },
          ].map((opt) => (
            <Card
              key={opt.id}
              className={`p-4 cursor-pointer transition-colors ${
                responses.q4 === opt.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setResponses(prev => ({ ...prev, q4: opt.id }))}
            >
              <span>{opt.label}</span>
            </Card>
          ))}
        </div>
        <Button onClick={handleNext} disabled={isSaving} className="w-full">
          {isSaving ? "Armando tu plan..." : "Finalizar"}
        </Button>
      </div>
    );
  }

  // ---- PANTALLA FINAL (RESULTADO DEL ALGORITMO) ----
  if (step === 5 && finalResult) {
    const content = categoryContent[finalResult.category] || categoryContent.integral;
    
    return (
      <div className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Check className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{content.titulo}</h1>
        <p className="text-muted-foreground text-lg mb-8">
          {content.descripcion}
        </p>
        
        <div className="bg-muted/50 p-4 rounded-lg mb-8 text-sm text-left">
           <p className="font-medium mb-2">Tu Home incluirá:</p>
           <ul className="list-disc list-inside pl-4 text-muted-foreground">
             <li>Valoraciones (Fijo)</li>
             {finalResult.dynamic.map(mod => (
               <li key={mod} className="capitalize">{mod.replace(/_/g, ' ')}</li>
             ))}
           </ul>
        </div>

        <p className="text-sm text-muted-foreground mb-4">Tu home está lista para empezar.</p>
        
        <Button onClick={handleComplete} size="lg" className="w-full mb-4">
          Empezar mi plan <ChevronRight className="w-4 h-4 ml-2"/>
        </Button>

        <p className="text-xs text-muted-foreground">
          Podés cambiar esto en Configuración cuando quieras.
        </p>
      </div>
    );
  }

  return null;
};
