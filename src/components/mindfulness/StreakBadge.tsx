import { Flame } from "lucide-react";

interface Props {
  progressByDate: Record<string, number>;
}

function streakFromMap(map: Record<string, number>): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    if ((map[key] ?? 0) > 0) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      // allow today to be empty without breaking streak
      if (i === 0) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

export function StreakBadge({ progressByDate }: Props) {
  const n = streakFromMap(progressByDate);
  if (n < 2) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FB923C]/15 px-2.5 py-1 text-[11px] font-semibold text-[#C2410C]">
      <Flame size={12} className="text-[#FB923C]" />
      {n} días seguidos
    </span>
  );
}
