import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBAContent } from "@/hooks/useBAContent";
import { useBAProgram } from "@/hooks/useBAProgram";
import { BAOnboarding } from "./BAOnboarding";
import { BADayOne } from "./BADayOne";
import { BAJourney } from "./BAJourney";
import { BADayTask } from "./BADayTask";
import { AmbientGlows } from "@/components/pack/AmbientGlows";

export default function BAProgram() {
  const navigate = useNavigate();
  const { content, loading: loadingContent } = useBAContent();
  const { program, loading: loadingProgram, create, update, flush } = useBAProgram();

  const [view, setView] = useState<"journey" | "day_task" | "day_one">("journey");
  const [taskDay, setTaskDay] = useState<number>(2);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loadingProgram && !program) setShowOnboarding(true);
    if (program?.state === "day1") setView("day_one");
  }, [loadingProgram, program]);

  if (loadingContent || loadingProgram) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfbfb]">
        <AmbientGlows />
        <div className="relative h-6 w-6 animate-spin rounded-full border-2 border-[#facb60] border-t-transparent" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-[#fdfbfb] p-6 text-[#101927]">
        <p>Contenido no disponible.</p>
      </div>
    );
  }

  if (showOnboarding || !program) {
    return (
      <BAOnboarding
        content={content}
        onClose={() => navigate("/herramientas/pack")}
        onFinish={async () => {
          const p = await create();
          if (p) {
            setShowOnboarding(false);
            setView("day_one");
          }
        }}
      />
    );
  }

  if (view === "day_one" || program.state === "day1") {
    return (
      <BADayOne
        content={content}
        program={program}
        onUpdate={update}
        onBack={() => navigate("/herramientas/pack")}
        onFinish={async () => {
          await flush({ state: "active", current_day: 2, day_one_step: 5 });
          setView("journey");
        }}
      />
    );
  }

  if (view === "day_task") {
    return (
      <BADayTask
        content={content}
        program={program}
        day={taskDay}
        onBack={() => setView("journey")}
        onDayCompleted={async () => {
          const nextDay = Math.min(7, program.current_day + 1);
          const completed = nextDay > 7 ? program.current_day : program.current_day;
          await flush({
            current_day: nextDay,
            last_completed_date: new Date().toISOString().slice(0, 10),
            state: program.current_day >= 7 ? "completed" : "active",
            completed_at: program.current_day >= 7 ? new Date().toISOString() : null,
          });
          setView("journey");
        }}
      />
    );
  }

  return (
    <BAJourney
      content={content}
      program={program}
      onBack={() => navigate("/herramientas/pack")}
      onOpenDay={(d) => {
        if (d === 1) setView("day_one");
        else {
          setTaskDay(d);
          setView("day_task");
        }
      }}
      onUpdate={update}
    />
  );
}
