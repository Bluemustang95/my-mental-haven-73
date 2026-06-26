import { ReactNode } from "react";

export function HabitShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f9f9fb_0%,#f2f4f8_100%)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-[#7cc2c8] opacity-[0.22] blur-[100px] animate-[orb-float_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-[#facb60] opacity-[0.20] blur-[100px] animate-[orb-float-2_18s_ease-in-out_infinite]" />
      </div>
      <div className="relative z-10 mx-auto flex h-screen max-w-md flex-col sm:h-[90vh] sm:max-h-[760px] sm:my-6 sm:rounded-[36px] sm:border sm:border-white/60 sm:bg-white/35 sm:shadow-[0_20px_60px_-20px_rgba(16,25,39,0.18)] sm:backdrop-blur-[28px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
