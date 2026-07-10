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
        className="flex aspect-square w-full flex-col items-start justify-between rounded-[24px] border border-slate-100 bg-white p-4 text-left shadow-sm transition active:scale-95"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
          <Calendar size={20} />
        </div>
        <p className="font-display text-[15px] font-bold leading-tight text-[#0f172a]">
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
