import { useEffect, useState } from "react";
import { Calendar, MapPin, Video, CalendarPlus, Pencil } from "lucide-react";
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

function formatDay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    const s = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric" }).format(dt);
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return dateStr;
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

  const hasData = !!data && !!data.date && !!data.time;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex flex-col justify-between rounded-[24px] border border-slate-100 bg-white p-3.5 text-left shadow-sm transition-all hover:border-blue-200 active:scale-95"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <Calendar size={15} />
          </div>
          {hasData && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              Próxima
            </span>
          )}
        </div>

        <div className="mt-2.5">
          {hasData ? (
            <>
              <p className="font-display text-[12.5px] font-bold leading-tight text-[#0f172a]">
                {formatDay(data!.date)}
                <br />
                {data!.time} hs
              </p>
              <div className="mt-1.5 flex items-start gap-1 text-[10.5px] leading-snug text-slate-500">
                {data!.modality === "presencial" ? (
                  <>
                    <MapPin size={11} className="mt-0.5 shrink-0" />
                    <span className="line-clamp-2">
                      {data!.location || "Sin dirección"}
                    </span>
                  </>
                ) : (
                  <>
                    <Video size={11} className="mt-0.5 shrink-0 text-blue-500" />
                    <span className="truncate text-blue-600 underline underline-offset-2">
                      Link de la llamada
                    </span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="font-display text-[12.5px] font-bold leading-tight text-[#0f172a]">
                Próxima Sesión
              </p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-slate-500">
                Tocá para agendar tu encuentro.
              </p>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-400">
            <CalendarPlus size={11} /> Agendar
          </span>
          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-500 underline underline-offset-2">
            <Pencil size={10} /> Editar
          </span>
        </div>
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
