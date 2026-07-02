import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Circle, ChevronRight, Brain } from "lucide-react";
import FollowupCompleteSheet from "./FollowupCompleteSheet";

type Followup = { id: string; title: string; type: string; due_date: string | null; status: string };

export default function ThoughtTaskWidget() {
  const { user } = useAuth();
  const [items, setItems] = useState<Followup[]>([]);
  const [active, setActive] = useState<Followup | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("thought_followups")
      .select("id,title,type,due_date,status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("pinned_home", true)
      .order("due_date", { ascending: true })
      .limit(3);
    setItems((data ?? []) as any);
  };

  useEffect(() => { load(); }, [user?.id]);

  if (!user || items.length === 0) return null;

  return (
    <>
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-8 w-8 rounded-full bg-[#7cc2c8]/20 flex items-center justify-center">
            <Brain size={14} className="text-[#7cc2c8]" />
          </div>
          <div>
            <p className="font-display text-[13px] font-bold text-[#101927]">Tareas — Mente & Emoción</p>
            <p className="text-[10px] text-[#101927]/55">Seguimiento de tus registros</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setActive(it)}
              className="w-full flex items-center gap-2 rounded-2xl bg-slate-50 hover:bg-slate-100 px-3 py-2.5 text-left"
            >
              <Circle size={14} className="text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-[#101927] line-clamp-1">{it.title}</p>
                {it.due_date && <p className="text-[10px] text-[#101927]/50">Para {it.due_date}</p>}
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>
      <FollowupCompleteSheet
        followup={active}
        onClose={() => setActive(null)}
        onDone={() => { setActive(null); load(); }}
      />
    </>
  );
}
