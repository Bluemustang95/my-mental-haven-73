export type BAIntroSlide = { title: string; body: string; icon?: string };

export type BAValue = {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
};

export type BALadderStep = { text: string; suds: number };

export type BABarrier = { label: string; response: string };

export type BAContent = {
  id: string;
  program_meta: { title: string; subtitle: string; icon?: string };
  intro_slides: BAIntroSlide[];
  cycle_text: {
    title: string;
    subtitle: string;
    less: { title: string; body: string };
    more: { title: string; body: string };
  };
  clinical_plan: { title: string; steps: string[]; designed_for: string[] };
  values_catalog: BAValue[];
  default_ladder: BALadderStep[];
  barriers_catalog: BABarrier[];
  daily_messages: Record<string, string>;
  active: boolean;
};

export type BAProgramState = "onboarding" | "day1" | "active" | "completed";

export type BAProgram = {
  id: string;
  user_id: string;
  state: BAProgramState;
  current_day: number;
  day_one_step: number;
  selected_values: string[];
  motivation: string;
  goals: string[];
  selected_goal_idx: number;
  ladder: BALadderStep[];
  started_at: string;
  last_completed_date: string | null;
  completed_at: string | null;
};

export type BABaselineEntry = {
  id?: string;
  user_id: string;
  program_id: string;
  day_of_week: number;
  hour: number;
  activity: string;
  emotion: string;
  intensity: number;
  dominio: number;
  agrado: number;
};

export type BADayPhase = "planning" | "pending" | "feedback" | "done";

export type BADayLog = {
  id?: string;
  user_id: string;
  program_id: string;
  day: number;
  phase: BADayPhase;
  scheduled_time: string | null;
  anticipated_difficulty: number | null;
  actual_difficulty: number | null;
  dominio: number | null;
  agrado: number | null;
  barrier_chosen: string | null;
  completed_at: string | null;
};

export const DEFAULT_BA_CONTENT: BAContent = {
  id: "",
  program_meta: { title: "Activación Comportamental", subtitle: "Recuperá tu energía vital actuando de afuera hacia adentro.", icon: "zap" },
  intro_slides: [],
  cycle_text: {
    title: "El Ciclo de la Acción",
    subtitle: "Nuestras acciones retroalimentan cómo nos sentimos.",
    less: { title: "Aislamiento y Evitación", body: "" },
    more: { title: "Sobreexigencia y Distracción", body: "" },
  },
  clinical_plan: { title: "El Plan Clínico", steps: [], designed_for: [] },
  values_catalog: [],
  default_ladder: [],
  barriers_catalog: [],
  daily_messages: {},
  active: true,
};

export const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i); // 8..22
export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
