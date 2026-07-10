import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { NextSessionSheet, type NextSessionData } from "./NextSessionSheet";

const STORAGE_KEY = "resma:next-session";

function loadSession(): NextSessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NextSessionData;
  } catch {
    return null;
  }
}

export function NextSessionCard() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NextSessionData | null>(null);

  useEffect(() => {
    setData(loadSession());
  }, []);

  const handleSave = (next: NextSessionData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setData(next);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-[120px] w-full flex-col items-center justify-center gap-2 rounded-[22px] p-3 text-center transition active:scale-95"
        style={{ background: "#7cc2c8" }}
      >
        <Calendar size={26} strokeWidth={2} className="text-white" />
        <p className="font-display text-[13px] font-bold leading-tight text-white">
          Próxima Sesión
        </p>
      </button>

      <NextSessionSheet
        open={open}
        initial={data}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
