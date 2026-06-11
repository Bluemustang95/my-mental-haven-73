import { useState } from "react";
import { cn } from "@/lib/utils";

const EMOJIS = ["😌", "🙂", "😐", "😕", "🙁", "😣", "😖", "😫", "😩", "😭", "🥵"];
const LABELS = [
  "Calma plena", "Muy bajo", "Bajo", "Suave", "Notorio",
  "Medio", "Marcado", "Alto", "Muy alto", "Intenso", "Máximo",
];

interface SudsSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export function SudsSlider({ value, onChange }: SudsSliderProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="text-7xl leading-none transition-transform" style={{ transform: `scale(${1 + value * 0.012})` }}>
        {EMOJIS[value]}
      </div>
      <div className="text-center">
        <div className="font-display text-5xl font-bold text-white tabular-nums">{value}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/55">{LABELS[value]}</div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none accent-[#FB923C] h-2 rounded-full bg-white/15 cursor-pointer"
      />
      <div className="flex w-full justify-between text-[10px] uppercase tracking-wider text-white/40">
        <span>Calma</span>
        <span>Malestar máximo</span>
      </div>
    </div>
  );
}

export function useSuds(initial = 5) {
  return useState(initial);
}
